const prisma = require('../lib/prisma');
const { applyMovement, StockError } = require('./stock.service');
const { assertUnitAccess } = require('../lib/access');
const { hasPermission } = require('../lib/roles');
const { getOpenSessionForUnit, recordRefund } = require('./cash.service');

const PAYMENT_METHODS = new Set(['cash', 'pix', 'debit', 'credit', 'other']);

class AftersaleError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function money(value) {
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed)) return NaN;
  return Math.round(parsed * 100) / 100;
}

function qty(value) {
  return parseFloat(value);
}

async function nextNumber(model, companyId, db) {
  const last = await db[model].findFirst({
    where: { companyId },
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  return (last?.number || 0) + 1;
}

function lineValue(saleItem) {
  const quantity = qty(saleItem.quantity);
  const total = money(saleItem.total);
  if (!quantity) return 0;
  return money(total / quantity);
}

async function remainingBySaleItem(saleId, db) {
  const [saleItems, returnItems, exchangeItems] = await Promise.all([
    db.saleItem.findMany({ where: { saleId } }),
    db.saleReturnItem.findMany({
      where: { saleItem: { saleId } },
      select: { saleItemId: true, quantity: true },
    }),
    db.exchangeItem.findMany({
      where: { saleItem: { saleId }, direction: 'in' },
      select: { saleItemId: true, quantity: true },
    }),
  ]);

  const used = {};
  for (const item of [...returnItems, ...exchangeItems]) {
    used[item.saleItemId] = (used[item.saleItemId] || 0) + qty(item.quantity);
  }

  return Object.fromEntries(
    saleItems.map((item) => [item.id, money(qty(item.quantity) - (used[item.id] || 0))])
  );
}

async function loadSale(companyId, saleId, db, { sellerId, user } = {}) {
  const sale = await db.sale.findFirst({
    where: { id: saleId, companyId, ...(sellerId && { sellerId }) },
    include: { items: true, unit: true },
  });
  if (!sale) {
    throw new AftersaleError('Venda não encontrada', 404);
  }
  if (sale.status === 'cancelled') {
    throw new AftersaleError('Não é possível devolver ou trocar uma venda cancelada');
  }
  if (user) {
    assertUnitAccess(user, sale.unitId);
  }
  return sale;
}

function assertMethod(method, amount) {
  if (Math.abs(amount) < 0.01) return null;
  if (!method || !PAYMENT_METHODS.has(method)) {
    throw new AftersaleError('Informe a forma de pagamento/estorno');
  }
  return method;
}

async function createReturn({ companyId, userId, saleId, items = [], reason, method, sellerId, user }) {
  if (!items.length) {
    throw new AftersaleError('Selecione pelo menos um item para devolver');
  }

  return prisma.$transaction(async (tx) => {
    const sale = await loadSale(companyId, saleId, tx, { sellerId, user });
    const remaining = await remainingBySaleItem(sale.id, tx);
    const saleItems = new Map(sale.items.map((item) => [item.id, item]));

    const prepared = items.map((input, index) => {
      const saleItem = saleItems.get(input.saleItemId);
      if (!saleItem) {
        throw new AftersaleError(`Item ${index + 1} não pertence a esta venda`);
      }
      const quantity = qty(input.quantity);
      if (!quantity || quantity <= 0) {
        throw new AftersaleError(`Item ${saleItem.sku}: quantidade inválida`);
      }
      if (quantity > (remaining[saleItem.id] || 0)) {
        throw new AftersaleError(
          `Item ${saleItem.sku}: só restam ${remaining[saleItem.id] || 0} para devolver`
        );
      }
      if (!saleItem.variantId) {
        throw new AftersaleError(`Item ${saleItem.sku}: variação original indisponível`);
      }
      const unitPrice = lineValue(saleItem);
      return {
        saleItem,
        quantity,
        unitPrice,
        total: money(unitPrice * quantity),
      };
    });

    const refundAmount = money(prepared.reduce((sum, item) => sum + item.total, 0));
    const refundMethod = assertMethod(method, refundAmount);
    const needsCashOut = refundMethod === 'cash' && refundAmount > 0.009;
    const session = await getOpenSessionForUnit(
      companyId,
      sale.unitId,
      user,
      { required: needsCashOut },
      tx
    );
    const number = await nextNumber('saleReturn', companyId, tx);

    const record = await tx.saleReturn.create({
      data: {
        number,
        reason: reason || null,
        refundAmount,
        method: refundMethod,
        companyId,
        unitId: sale.unitId,
        saleId: sale.id,
        createdById: userId,
        cashSessionId: session?.id || null,
        items: {
          create: prepared.map((item) => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            sku: item.saleItem.sku,
            productName: item.saleItem.productName,
            size: item.saleItem.size,
            color: item.saleItem.color,
            saleItemId: item.saleItem.id,
            variantId: item.saleItem.variantId,
          })),
        },
      },
    });

    if (needsCashOut) {
      await recordRefund(
        {
          session,
          amount: refundAmount,
          userId,
          reason: `Devolução #${String(number).padStart(4, '0')} da venda #${String(sale.number).padStart(4, '0')}`,
          referenceType: 'return',
          referenceId: record.id,
        },
        tx
      );
    }

    for (const item of prepared) {
      await applyMovement(
        {
          companyId,
          userId,
          variantId: item.saleItem.variantId,
          unitId: sale.unitId,
          type: 'return',
          quantity: item.quantity,
          reason: `Devolução #${String(number).padStart(4, '0')} da venda #${String(sale.number).padStart(4, '0')}`,
          reference: record.id,
        },
        tx
      );
    }

    return tx.saleReturn.findUnique({
      where: { id: record.id },
      include: { items: true, createdBy: { select: { id: true, name: true } } },
    });
  });
}

async function createExchange({
  companyId,
  userId,
  saleId,
  returnItems = [],
  newItems = [],
  reason,
  method,
  sellerId,
  user,
}) {
  if (!returnItems.length) {
    throw new AftersaleError('Selecione o que volta para a loja');
  }
  if (!newItems.length) {
    throw new AftersaleError('Selecione o item novo da troca');
  }

  return prisma.$transaction(async (tx) => {
    const sale = await loadSale(companyId, saleId, tx, { sellerId, user });
    const remaining = await remainingBySaleItem(sale.id, tx);
    const saleItems = new Map(sale.items.map((item) => [item.id, item]));

    const incoming = returnItems.map((input, index) => {
      const saleItem = saleItems.get(input.saleItemId);
      if (!saleItem) {
        throw new AftersaleError(`Item devolvido ${index + 1} não pertence a esta venda`);
      }
      const quantity = qty(input.quantity);
      if (!quantity || quantity <= 0) {
        throw new AftersaleError(`Item ${saleItem.sku}: quantidade inválida`);
      }
      if (quantity > (remaining[saleItem.id] || 0)) {
        throw new AftersaleError(
          `Item ${saleItem.sku}: só restam ${remaining[saleItem.id] || 0} para trocar`
        );
      }
      if (!saleItem.variantId) {
        throw new AftersaleError(`Item ${saleItem.sku}: variação original indisponível`);
      }
      const unitPrice = lineValue(saleItem);
      return {
        saleItem,
        quantity,
        unitPrice,
        total: money(unitPrice * quantity),
      };
    });

    const variantIds = [...new Set(newItems.map((item) => item.variantId).filter(Boolean))];
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds }, companyId, active: true, product: { active: true } },
      include: { product: true },
    });
    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

    const canDiscount = user ? hasPermission(user, 'sales.discount') : true;
    const outgoing = newItems.map((input, index) => {
      const variant = variantMap.get(input.variantId);
      if (!variant) {
        throw new AftersaleError(`Item novo ${index + 1}: variação não encontrada`);
      }
      const quantity = qty(input.quantity);
      const catalogPrice = money(variant.salePrice);
      const requestedPrice =
        input.unitPrice === undefined || input.unitPrice === null || input.unitPrice === ''
          ? catalogPrice
          : money(input.unitPrice);
      if (!quantity || quantity <= 0 || Number.isNaN(requestedPrice) || requestedPrice < 0) {
        throw new AftersaleError(`Item ${variant.sku}: quantidade ou preço inválido`);
      }
      if (!canDiscount && requestedPrice !== catalogPrice) {
        throw new AftersaleError('Sem permissão para alterar o preço', 403);
      }
      const unitPrice = canDiscount ? requestedPrice : catalogPrice;
      return {
        variant,
        quantity,
        unitPrice,
        total: money(unitPrice * quantity),
      };
    });

    const credit = money(incoming.reduce((sum, item) => sum + item.total, 0));
    const debit = money(outgoing.reduce((sum, item) => sum + item.total, 0));
    const difference = money(debit - credit);
    const settlementMethod = assertMethod(method, difference);
    const cashImpact = settlementMethod === 'cash' && Math.abs(difference) > 0.009;
    const session = await getOpenSessionForUnit(
      companyId,
      sale.unitId,
      user,
      { required: cashImpact },
      tx
    );
    const number = await nextNumber('exchange', companyId, tx);

    const record = await tx.exchange.create({
      data: {
        number,
        reason: reason || null,
        difference,
        method: settlementMethod,
        companyId,
        unitId: sale.unitId,
        saleId: sale.id,
        createdById: userId,
        cashSessionId: session?.id || null,
        items: {
          create: [
            ...incoming.map((item) => ({
              direction: 'in',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              sku: item.saleItem.sku,
              productName: item.saleItem.productName,
              size: item.saleItem.size,
              color: item.saleItem.color,
              saleItemId: item.saleItem.id,
              variantId: item.saleItem.variantId,
            })),
            ...outgoing.map((item) => ({
              direction: 'out',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              sku: item.variant.sku,
              productName: item.variant.product.name,
              size: item.variant.size,
              color: item.variant.color,
              variantId: item.variant.id,
            })),
          ],
        },
      },
    });

    if (difference < -0.009 && settlementMethod === 'cash') {
      await recordRefund(
        {
          session,
          amount: money(Math.abs(difference)),
          userId,
          reason: `Troca #${String(number).padStart(4, '0')} da venda #${String(sale.number).padStart(4, '0')}`,
          referenceType: 'exchange',
          referenceId: record.id,
        },
        tx
      );
    }

    for (const item of incoming) {
      await applyMovement(
        {
          companyId,
          userId,
          variantId: item.saleItem.variantId,
          unitId: sale.unitId,
          type: 'exchange_in',
          quantity: item.quantity,
          reason: `Troca #${String(number).padStart(4, '0')} da venda #${String(sale.number).padStart(4, '0')}`,
          reference: record.id,
        },
        tx
      );
    }

    for (const item of outgoing) {
      await applyMovement(
        {
          companyId,
          userId,
          variantId: item.variant.id,
          unitId: sale.unitId,
          type: 'exchange_out',
          quantity: item.quantity,
          reason: `Troca #${String(number).padStart(4, '0')} da venda #${String(sale.number).padStart(4, '0')}`,
          reference: record.id,
        },
        tx
      );
    }

    return tx.exchange.findUnique({
      where: { id: record.id },
      include: { items: true, createdBy: { select: { id: true, name: true } } },
    });
  });
}

module.exports = {
  AftersaleError,
  createReturn,
  createExchange,
  remainingBySaleItem,
};
