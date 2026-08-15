const prisma = require('../lib/prisma');
const { applyMovement, StockError } = require('./stock.service');
const { remainingBySaleItem } = require('./aftersale.service');

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
};

async function createSale({
  companyId,
  userId,
  unitId,
  clientId,
  items = [],
  payments = [],
  discount = 0,
  notes,
  origin = 'store',
}) {
  if (!unitId) {
    throw new SaleError('Unidade é obrigatória');
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new SaleError('Adicione pelo menos um item');
  }
  if (!Array.isArray(payments) || payments.length === 0) {
    throw new SaleError('Informe o pagamento');
  }

  const saleDiscount = money(discount || 0);
  if (Number.isNaN(saleDiscount) || saleDiscount < 0) {
    throw new SaleError('Desconto da venda inválido');
  }

  return prisma.$transaction(async (tx) => {
    const unit = await tx.unit.findFirst({
      where: { id: unitId, companyId, active: true },
    });
    if (!unit) {
      throw new SaleError('Unidade não encontrada', 404);
    }

    if (clientId) {
      const client = await tx.client.findFirst({
        where: { id: clientId, companyId, status: 1 },
      });
      if (!client) {
        throw new SaleError('Cliente não encontrado', 404);
      }
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

      const unitPrice = money(item.unitPrice ?? variant.salePrice);
      const itemDiscount = money(item.discount || 0);
      if (Number.isNaN(unitPrice) || unitPrice < 0) {
        throw new SaleError(`Item ${variant.sku}: preço inválido`);
      }
      if (Number.isNaN(itemDiscount) || itemDiscount < 0) {
        throw new SaleError(`Item ${variant.sku}: desconto inválido`);
      }

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
        origin: origin === 'ecommerce' ? 'ecommerce' : 'store',
        subtotal,
        discount: totalDiscount,
        total,
        notes: notes || null,
        companyId,
        unitId,
        clientId: clientId || null,
        sellerId: userId,
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

    return tx.sale.findUnique({
      where: { id: sale.id },
      include: saleInclude,
    });
  });
}

async function listSales({ companyId, unitId, search, page = 1, limit = 20, sellerId }) {
  const where = {
    companyId,
    ...(unitId && { unitId }),
    ...(sellerId && { sellerId }),
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

async function getSaleById({ companyId, id, sellerId }) {
  const sale = await prisma.sale.findFirst({
    where: { id, companyId, ...(sellerId && { sellerId }) },
    include: saleInclude,
  });

  if (!sale) {
    throw new SaleError('Venda não encontrada', 404);
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

module.exports = {
  SaleError,
  PAYMENT_METHODS,
  createSale,
  listSales,
  getSaleById,
  saleInclude,
};
