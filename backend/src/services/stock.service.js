const { randomUUID } = require('crypto');
const prisma = require('../lib/prisma');

const DIRECTION = {
  entry: 1,
  return: 1,
  exchange_in: 1,
  transfer_in: 1,
  production: 1,
  exit: -1,
  sale: -1,
  exchange_out: -1,
  transfer_out: -1,
};

const TYPES = new Set([...Object.keys(DIRECTION), 'adjust']);

class StockError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function toNumber(value) {
  return parseFloat(value || 0);
}

async function assertVariantAndUnit(companyId, variantId, unitId, db = prisma) {
  const [variant, unit] = await Promise.all([
    db.productVariant.findFirst({
      where: { id: variantId, companyId, active: true },
      include: { product: true },
    }),
    db.unit.findFirst({
      where: { id: unitId, companyId, active: true },
    }),
  ]);

  if (!variant) {
    throw new StockError('Variação não encontrada ou inativa', 404);
  }
  if (!unit) {
    throw new StockError('Unidade não encontrada', 404);
  }

  return { variant, unit };
}

async function applyMovement(
  {
    companyId,
    userId,
    variantId,
    unitId,
    type,
    quantity,
    reason,
    reference,
    allowNegative = false,
  },
  db = prisma
) {
  if (!TYPES.has(type)) {
    throw new StockError('Tipo de movimentação inválido');
  }

  const qty = toNumber(quantity);
  if (Number.isNaN(qty)) {
    throw new StockError('Quantidade inválida');
  }
  if (type !== 'adjust' && qty <= 0) {
    throw new StockError('Quantidade deve ser maior que zero');
  }
  if (type === 'adjust' && qty === 0) {
    throw new StockError('Ajuste precisa de uma quantidade diferente de zero');
  }
  if (type === 'adjust' && !reason) {
    throw new StockError('Informe o motivo do ajuste');
  }

  await assertVariantAndUnit(companyId, variantId, unitId, db);

  const delta = type === 'adjust' ? qty : qty * DIRECTION[type];
  const recordedQty = type === 'adjust' ? Math.abs(qty) : qty;

  const stock = await db.stock.upsert({
    where: {
      variantId_unitId: { variantId, unitId },
    },
    update: {},
    create: {
      variantId,
      unitId,
      companyId,
      quantity: 0,
    },
  });

  const current = toNumber(stock.quantity);
  const next = current + delta;

  if (next < 0 && !allowNegative) {
    throw new StockError(
      `Estoque insuficiente. Saldo atual: ${current}`
    );
  }

  const [updated, movement] = await Promise.all([
    db.stock.update({
      where: { id: stock.id },
      data: { quantity: next },
    }),
    db.stockMovement.create({
      data: {
        type,
        quantity: recordedQty,
        reason: reason || null,
        reference: reference || null,
        variantId,
        unitId,
        companyId,
        createdById: userId,
      },
    }),
  ]);

  return { stock: updated, movement, previous: current };
}

async function transfer({
  companyId,
  userId,
  variantId,
  fromUnitId,
  toUnitId,
  quantity,
  reason,
}) {
  if (fromUnitId === toUnitId) {
    throw new StockError('Selecione unidades diferentes para transferir');
  }

  const reference = randomUUID();

  return prisma.$transaction(async (tx) => {
    const outgoing = await applyMovement(
      {
        companyId,
        userId,
        variantId,
        unitId: fromUnitId,
        type: 'transfer_out',
        quantity,
        reason,
        reference,
      },
      tx
    );

    const incoming = await applyMovement(
      {
        companyId,
        userId,
        variantId,
        unitId: toUnitId,
        type: 'transfer_in',
        quantity,
        reason,
        reference,
      },
      tx
    );

    return { reference, outgoing, incoming };
  });
}

const variantSearch = (search) =>
  search
    ? {
        OR: [
          { sku: { contains: search, mode: 'insensitive' } },
          { color: { contains: search, mode: 'insensitive' } },
          { size: { contains: search, mode: 'insensitive' } },
          { product: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }
    : {};

async function listStock({ companyId, unitId, search }) {
  if (unitId) {
    const [unit, variants] = await Promise.all([
      prisma.unit.findFirst({ where: { id: unitId, companyId } }),
      prisma.productVariant.findMany({
        where: {
          companyId,
          active: true,
          product: { active: true },
          ...variantSearch(search),
        },
        include: {
          product: { include: { category: true } },
          stocks: { where: { unitId }, include: { unit: true } },
        },
        orderBy: [{ sku: 'asc' }],
      }),
    ]);

    return variants.map((variant) => {
      const stock = variant.stocks[0];
      const { stocks, ...variantData } = variant;
      return {
        id: stock?.id || `virtual-${variant.id}-${unitId}`,
        quantity: stock?.quantity ?? 0,
        variantId: variant.id,
        unitId,
        companyId,
        unit: stock?.unit || unit,
        variant: variantData,
      };
    });
  }

  return prisma.stock.findMany({
    where: {
      companyId,
      variant: {
        active: true,
        product: { active: true },
        ...variantSearch(search),
      },
    },
    include: {
      unit: true,
      variant: {
        include: {
          product: {
            include: { category: true },
          },
        },
      },
    },
    orderBy: [{ unit: { name: 'asc' } }, { variant: { sku: 'asc' } }],
  });
}

module.exports = {
  StockError,
  applyMovement,
  transfer,
  listStock,
  TYPES,
};
