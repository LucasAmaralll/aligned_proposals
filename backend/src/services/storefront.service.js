const prisma = require('../lib/prisma');
const { createSale, SaleError } = require('./sale.service');
const { nextClientNumber } = require('./client.service');
const { onlyDigits, resolveChannel } = require('../lib/saleChannel');

function publicCatalog(products) {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    type: product.type,
    gender: product.gender,
    variants: (product.variants || [])
      .filter((variant) => variant.active)
      .map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        salePrice: variant.salePrice,
        ncm: variant.ncm,
        ean: variant.ean,
        stocks: (variant.stocks || []).map((stock) => ({
          unitId: stock.unitId,
          unitName: stock.unit?.name,
          quantity: stock.quantity,
        })),
      })),
  }));
}

async function listStorefrontCatalog({ companyId, search, unitId, limit = 40 }) {
  const products = await prisma.product.findMany({
    where: {
      companyId,
      active: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } },
        ],
      }),
    },
    include: {
      variants: {
        where: { active: true },
        include: {
          stocks: {
            where: {
              ...(unitId && { unitId }),
            },
            include: { unit: { select: { id: true, name: true, type: true } } },
          },
        },
        orderBy: [{ color: 'asc' }, { size: 'asc' }],
      },
    },
    orderBy: { name: 'asc' },
    take: Number(limit),
  });

  return { products: publicCatalog(products) };
}

async function findOrCreateStorefrontClient({ companyId, userId, payload = {}, channel }) {
  const name = String(payload.name || '').trim();
  const document = onlyDigits(payload.document);
  const saleChannel = resolveChannel(channel, { document });

  if (saleChannel === 'wholesale' && !name && !document) {
    const error = new SaleError('Venda de atacado precisa de cliente com CNPJ');
    throw error;
  }

  if (document) {
    const existing = await prisma.client.findFirst({
      where: {
        companyId,
        status: 1,
        OR: [{ document }, { document: { contains: document } }],
      },
    });
    if (existing) return existing;
  }

  if (!name) return null;

  return prisma.$transaction(async (tx) => {
    const number = await nextClientNumber(companyId, tx);
    return tx.client.create({
      data: {
        number,
        name,
        email: payload.email || null,
        phone: onlyDigits(payload.phone) || null,
        document: document || null,
        address: payload.address || null,
        city: payload.city || null,
        state: payload.state || null,
        zipCode: onlyDigits(payload.zipCode) || null,
        status: 1,
        userId,
        companyId,
      },
    });
  });
}

async function createStorefrontOrder({ companyId, userId, body }) {
  const shipping = body.shipping || {};
  const clientPayload = {
    ...(body.client || {}),
    name: body.client?.name || shipping.recipientName,
    phone: body.client?.phone || shipping.phone,
    document: body.client?.document || shipping.document,
    address: body.client?.address || shipping.address,
    city: body.client?.city || shipping.city,
    state: body.client?.state || shipping.state,
    zipCode: body.client?.zipCode || shipping.zipCode,
  };

  const client = await findOrCreateStorefrontClient({
    companyId,
    userId,
    payload: clientPayload,
    channel: body.channel,
  });

  const skus = (body.items || []).map((item) => item.sku).filter(Boolean);
  const variants = await prisma.productVariant.findMany({
    where: { companyId, sku: { in: skus }, active: true, product: { active: true } },
  });
  const bySku = new Map(variants.map((variant) => [variant.sku, variant]));

  const items = (body.items || []).map((item, index) => {
    const variant = bySku.get(item.sku);
    if (!variant) {
      throw new SaleError(`Item ${index + 1}: SKU ${item.sku || 'vazio'} não encontrado`);
    }
    return {
      variantId: variant.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
    };
  });

  const wantsShip = body.fulfillment !== 'pickup';

  return createSale({
    companyId,
    userId,
    unitId: body.unitId,
    clientId: client?.id || body.clientId,
    items,
    payments: body.payments,
    discount: body.discount,
    notes: body.notes,
    origin: 'ecommerce',
    channel: body.channel,
    quoteId: body.quoteId,
    ship: wantsShip,
    shipping,
  });
}

module.exports = {
  listStorefrontCatalog,
  createStorefrontOrder,
};
