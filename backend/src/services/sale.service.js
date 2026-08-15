const prisma = require('../lib/prisma');
const { applyMovement, StockError } = require('./stock.service');
const { remainingBySaleItem } = require('./aftersale.service');
const { resolveChannel, resolveOrigin, onlyDigits } = require('../lib/saleChannel');
const { createShipmentFromSale } = require('./shipment.service');
const { assertUnitAccess, resolveListUnitFilter } = require('../lib/access');
const { hasPermission } = require('../lib/roles');
const {
  getOpenSessionForUnit,
  recordRefund,
  cashAmountFromSale,
} = require('./cash.service');

const PAYMENT_METHODS = new Set(['cash', 'pix', 'debit', 'credit', 'other']);

class SaleError extends Error {
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

function quantity(value) {
  return parseFloat(value);
}

async function nextSaleNumber(companyId, db) {
  const last = await db.sale.findFirst({
    where: { companyId },
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  return (last?.number || 0) + 1;
}

const saleInclude = {
  client: { select: { id: true, number: true, name: true, phone: true, document: true } },
  seller: { select: { id: true, name: true } },
  unit: { select: { id: true, name: true, type: true } },
  quote: { select: { id: true, title: true } },
  items: { orderBy: { productName: 'asc' } },
  payments: { orderBy: { createdAt: 'asc' } },
  returns: {
    include: { items: true, createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  },
  exchanges: {
    include: { items: true, createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  },
  shipments: {
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      number: true,
      status: true,
      origin: true,
      recipientName: true,
      trackingCode: true,
      city: true,
      createdAt: true,
      shippedAt: true,
    },
  },
  cancelledBy: { select: { id: true, name: true } },
};

async function createSale({
  companyId,
  userId,
  user,
  unitId,
  clientId,
  items = [],
  payments = [],
  discount = 0,
  notes,
  origin = 'store',
  channel,
  quoteId,
  ship = false,
  shipping = {},
}) {
  if (!unitId) {
    throw new SaleError('Unidade é obrigatória');
  }
  if (user) {
    assertUnitAccess(user, unitId);
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new SaleError('Adicione pelo menos um item');
  }
  if (!Array.isArray(payments) || payments.length === 0) {
    throw new SaleError('Informe o pagamento');
  }

  const canDiscount = user ? hasPermission(user, 'sales.discount') : true;
  const saleDiscount = money(discount || 0);
  if (Number.isNaN(saleDiscount) || saleDiscount < 0) {
    throw new SaleError('Desconto da venda inválido');
  }
  if (!canDiscount && saleDiscount > 0) {
    throw new SaleError('Sem permissão para aplicar desconto', 403);
  }

  return prisma.$transaction(async (tx) => {
    const unit = await tx.unit.findFirst({
      where: { id: unitId, companyId, active: true },
    });
    if (!unit) {
      throw new SaleError('Unidade não encontrada', 404);
    }

    let client = null;
    if (clientId) {
      client = await tx.client.findFirst({
        where: { id: clientId, companyId, status: 1 },
      });
      if (!client) {
        throw new SaleError('Cliente não encontrado', 404);
      }
    }

    const saleChannel = resolveChannel(channel, client);
    const saleOrigin = resolveOrigin(origin);

    if (saleChannel === 'wholesale' && !client) {
      throw new SaleError('Venda de atacado precisa de um cliente pessoa jurídica');
    }
    if (saleChannel === 'wholesale' && onlyDigits(client.document).length <= 11) {
      throw new SaleError('Atacado precisa de um cliente com CNPJ');
    }

    if (quoteId) {
      const quote = await tx.quote.findFirst({
        where: { id: quoteId, companyId, deletionStatus: 1 },
      });
      if (!quote) {
        throw new SaleError('Orçamento não encontrado', 404);
      }
    }

    let cashSessionId = null;
    if (saleOrigin !== 'ecommerce') {
      const session = await getOpenSessionForUnit(companyId, unitId, user, { required: true }, tx);
      cashSessionId = session.id;
    }

    const variantIds = [...new Set(items.map((item) => item.variantId).filter(Boolean))];
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds }, companyId, active: true, product: { active: true } },
      include: { product: true },
    });
    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

    const preparedItems = items.map((item, index) => {
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        throw new SaleError(`Item ${index + 1}: variação não encontrada ou inativa`);
      }

      const qty = quantity(item.quantity);
      if (!qty || qty <= 0) {
        throw new SaleError(`Item ${variant.sku}: quantidade inválida`);
      }

      const catalogPrice = money(variant.salePrice);
      const requestedPrice =
        item.unitPrice === undefined || item.unitPrice === null || item.unitPrice === ''
          ? catalogPrice
          : money(item.unitPrice);
      const itemDiscount = money(item.discount || 0);
      if (Number.isNaN(requestedPrice) || requestedPrice < 0) {
        throw new SaleError(`Item ${variant.sku}: preço inválido`);
      }
      if (Number.isNaN(itemDiscount) || itemDiscount < 0) {
        throw new SaleError(`Item ${variant.sku}: desconto inválido`);
      }
      if (!canDiscount && itemDiscount > 0) {
        throw new SaleError('Sem permissão para aplicar desconto', 403);
      }
      if (!canDiscount && requestedPrice !== catalogPrice) {
        throw new SaleError('Sem permissão para alterar o preço', 403);
      }

      const unitPrice = canDiscount ? requestedPrice : catalogPrice;
      const lineTotal = money(qty * unitPrice - itemDiscount);
      if (lineTotal < 0) {
        throw new SaleError(`Item ${variant.sku}: desconto maior que o valor`);
      }

      return {
        variant,
        quantity: qty,
        unitPrice,
        discount: itemDiscount,
        total: lineTotal,
        sku: variant.sku,
        productName: variant.product.name,
        size: variant.size,
        color: variant.color,
      };
    });

    const subtotal = money(
      preparedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    );
    const itemsDiscount = money(
      preparedItems.reduce((sum, item) => sum + item.discount, 0)
    );
    const totalDiscount = money(itemsDiscount + saleDiscount);
    const total = money(subtotal - totalDiscount);
    if (total < 0) {
      throw new SaleError('Desconto maior que o total da venda');
    }

    const preparedPayments = payments.map((payment, index) => {
      if (!PAYMENT_METHODS.has(payment.method)) {
        throw new SaleError(`Pagamento ${index + 1}: forma inválida`);
      }
      const amount = money(payment.amount);
      if (!amount || amount <= 0) {
        throw new SaleError(`Pagamento ${index + 1}: valor inválido`);
      }
      return { method: payment.method, amount };
    });

    const paid = money(preparedPayments.reduce((sum, payment) => sum + payment.amount, 0));
    if (Math.abs(paid - total) > 0.01) {
      throw new SaleError(
        `Pagamentos (${paid.toFixed(2)}) devem fechar o total (${total.toFixed(2)})`
      );
    }

    const number = await nextSaleNumber(companyId, tx);
    const sale = await tx.sale.create({
      data: {
        number,
        status: 'completed',
        origin: saleOrigin,
        channel: saleChannel,
        subtotal,
        discount: totalDiscount,
        total,
        notes: notes || null,
        companyId,
        unitId,
        clientId: clientId || null,
        sellerId: userId,
        quoteId: quoteId || null,
        cashSessionId,
        items: {
          create: preparedItems.map((item) => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
            sku: item.sku,
            productName: item.productName,
            size: item.size,
            color: item.color,
            variantId: item.variant.id,
          })),
        },
        payments: {
          create: preparedPayments,
        },
      },
    });

    for (const item of preparedItems) {
      await applyMovement(
        {
          companyId,
          userId,
          variantId: item.variant.id,
          unitId,
          type: 'sale',
          quantity: item.quantity,
          reason: `Venda #${String(number).padStart(4, '0')}`,
          reference: sale.id,
        },
        tx
      );
    }

    if (ship) {
      const created = await tx.sale.findUnique({
        where: { id: sale.id },
        include: { items: true, client: true },
      });
      await createShipmentFromSale(
        {
          sale: created,
          companyId,
          userId,
          unitId,
          shipping,
          origin: saleOrigin === 'ecommerce' ? 'ecommerce' : 'sale',
        },
        tx
      );
    }

    return tx.sale.findUnique({
      where: { id: sale.id },
      include: saleInclude,
    });
  });
}

async function listSales({ companyId, unitId, search, page = 1, limit = 20, sellerId, channel, origin, user }) {
  const unitFilter = user ? resolveListUnitFilter(user, unitId) : { ...(unitId && { unitId }) };
  const where = {
    companyId,
    ...unitFilter,
    ...(sellerId && { sellerId }),
    ...(channel && { channel }),
    ...(origin && { origin }),
    ...(search && {
      OR: [
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { seller: { name: { contains: search, mode: 'insensitive' } } },
        ...(Number(String(search).replace(/\D/g, ''))
          ? [{ number: Number(String(search).replace(/\D/g, '')) }]
          : []),
      ],
    }),
  };

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        client: { select: { id: true, number: true, name: true } },
        seller: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true, type: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    sales,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

async function getSaleById({ companyId, id, sellerId, user }) {
  const sale = await prisma.sale.findFirst({
    where: { id, companyId, ...(sellerId && { sellerId }) },
    include: saleInclude,
  });

  if (!sale) {
    throw new SaleError('Venda não encontrada', 404);
  }
  if (user) {
    assertUnitAccess(user, sale.unitId);
  }

  const remaining = await remainingBySaleItem(sale.id, prisma);
  return {
    ...sale,
    items: sale.items.map((item) => ({
      ...item,
      remainingQuantity: remaining[item.id] ?? 0,
    })),
  };
}

function assertCancelUnitAccess(user, sale) {
  assertUnitAccess(user, sale.unitId);
}

async function cancelSale({ companyId, userId, id, reason, user }) {
  const cancelReason = String(reason || '').trim();
  if (!cancelReason) {
    throw new SaleError('Informe o motivo do cancelamento');
  }

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({
      where: { id, companyId },
      include: {
        items: true,
        payments: true,
        cashSession: { select: { id: true, status: true } },
        returns: { select: { id: true } },
        exchanges: { select: { id: true } },
        shipments: { select: { id: true, status: true } },
      },
    });

    if (!sale) {
      throw new SaleError('Venda não encontrada', 404);
    }

    assertCancelUnitAccess(user, sale);

    if (sale.status === 'cancelled') {
      throw new SaleError('Esta venda já está cancelada');
    }
    if (sale.status !== 'completed') {
      throw new SaleError('Só é possível cancelar uma venda concluída');
    }
    if (sale.returns.length || sale.exchanges.length) {
      throw new SaleError(
        'Esta venda já tem troca ou devolução. Use esses fluxos em vez de cancelar'
      );
    }
    if (sale.shipments.some((item) => item.status === 'shipped')) {
      throw new SaleError('Não é possível cancelar: o envio já foi despachado');
    }

    const cashPaid = cashAmountFromSale(sale);
    const originalSessionOpen = sale.cashSession?.status === 'open';
    if (cashPaid > 0.009 && !originalSessionOpen) {
      const current = await getOpenSessionForUnit(companyId, sale.unitId, user, { required: false }, tx);
      if (!current) {
        throw new SaleError('Abra o caixa para estornar o dinheiro deste cancelamento', 400);
      }
      await recordRefund(
        {
          session: current,
          amount: cashPaid,
          userId,
          reason: `Cancelamento da venda #${String(sale.number).padStart(4, '0')}`,
          referenceType: 'sale',
          referenceId: sale.id,
        },
        tx
      );
    }

    for (const item of sale.items) {
      if (!item.variantId) {
        throw new SaleError(
          `Item ${item.sku}: variação original indisponível para estornar o estoque`
        );
      }
      await applyMovement(
        {
          companyId,
          userId,
          variantId: item.variantId,
          unitId: sale.unitId,
          type: 'sale_cancel',
          quantity: item.quantity,
          reason: `Cancelamento da venda #${String(sale.number).padStart(4, '0')}`,
          reference: sale.id,
        },
        tx
      );
    }

    await tx.shipment.updateMany({
      where: { saleId: sale.id, companyId, status: 'pending' },
      data: { status: 'cancelled' },
    });

    await tx.sale.update({
      where: { id: sale.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason,
        cancelledById: userId,
      },
    });

    return tx.sale.findUnique({
      where: { id: sale.id },
      include: saleInclude,
    });
  });
}

module.exports = {
  SaleError,
  PAYMENT_METHODS,
  createSale,
  listSales,
  getSaleById,
  cancelSale,
  saleInclude,
};
