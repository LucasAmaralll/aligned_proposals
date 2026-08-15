const prisma = require('../lib/prisma');
const { onlyDigits } = require('../lib/saleChannel');
const { assertUnitAccess, assertResourceUnitAccess, resolveListUnitFilter } = require('../lib/access');

const STATUSES = new Set(['pending', 'shipped', 'cancelled']);
const ORIGINS = new Set(['sale', 'ecommerce', 'manual']);
const CARRIERS = new Set(['correios', 'motoboy', 'other']);

class ShipmentError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const shipmentInclude = {
  unit: { select: { id: true, name: true, type: true } },
  client: { select: { id: true, number: true, name: true, phone: true, document: true } },
  sale: {
    select: {
      id: true,
      number: true,
      total: true,
      channel: true,
      origin: true,
    },
  },
  createdBy: { select: { id: true, name: true } },
};

function cleanText(value) {
  const text = String(value || '').trim();
  return text || null;
}

function itemsNoteFromSale(sale) {
  if (!sale?.items?.length) return null;
  return sale.items
    .map((item) => {
      const qty = parseFloat(item.quantity);
      const detail = [item.size, item.color].filter(Boolean).join(' ');
      return `${qty}x ${item.productName}${detail ? ` (${detail})` : ''} · ${item.sku}`;
    })
    .join('\n');
}

async function nextShipmentNumber(companyId, db) {
  const last = await db.shipment.findFirst({
    where: { companyId },
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  return (last?.number || 0) + 1;
}

function resolveOrigin(origin) {
  if (ORIGINS.has(origin)) return origin;
  return 'manual';
}

function resolveCarrier(carrier) {
  if (CARRIERS.has(carrier)) return carrier;
  return 'correios';
}

async function createShipment(
  {
    companyId,
    userId,
    user,
    unitId,
    saleId,
    clientId,
    origin = 'manual',
    recipientName,
    phone,
    document,
    address,
    complement,
    neighborhood,
    city,
    state,
    zipCode,
    itemsNote,
    carrier,
    notes,
  },
  db = prisma
) {
  const name = cleanText(recipientName);
  if (!name) {
    throw new ShipmentError('Informe quem recebe o envio');
  }

  if (unitId) {
    const unit = await db.unit.findFirst({
      where: { id: unitId, companyId, active: true },
    });
    if (!unit) {
      throw new ShipmentError('Unidade não encontrada', 404);
    }
  }

  let sale = null;
  if (saleId) {
    sale = await db.sale.findFirst({
      where: { id: saleId, companyId },
      include: {
        items: true,
        client: true,
      },
    });
    if (!sale) {
      throw new ShipmentError('Venda não encontrada', 404);
    }
    if (sale.status === 'cancelled') {
      throw new ShipmentError('Não é possível criar envio de uma venda cancelada');
    }
  }

  const resolvedUnitId = sale?.unitId || unitId || null;
  if (user) {
    if (sale?.unitId) {
      assertUnitAccess(user, sale.unitId);
    } else {
      assertResourceUnitAccess(user, resolvedUnitId);
    }
  }

  let client = sale?.client || null;
  if (clientId && !client) {
    client = await db.client.findFirst({
      where: { id: clientId, companyId, status: 1 },
    });
    if (!client) {
      throw new ShipmentError('Cliente não encontrado', 404);
    }
  }

  const shipmentOrigin = sale?.origin === 'ecommerce' ? 'ecommerce' : resolveOrigin(origin);
  const number = await nextShipmentNumber(companyId, db);

  return db.shipment.create({
    data: {
      number,
      status: 'pending',
      origin: shipmentOrigin,
      recipientName: name,
      phone: onlyDigits(phone || client?.phone) || null,
      document: onlyDigits(document || client?.document) || null,
      address: cleanText(address) || client?.address || null,
      complement: cleanText(complement),
      neighborhood: cleanText(neighborhood),
      city: cleanText(city) || client?.city || null,
      state: cleanText(state) || client?.state || null,
      zipCode: onlyDigits(zipCode || client?.zipCode) || null,
      itemsNote: cleanText(itemsNote) || itemsNoteFromSale(sale),
      carrier: resolveCarrier(carrier),
      notes: cleanText(notes),
      companyId,
      unitId: sale?.unitId || unitId || null,
      saleId: sale?.id || null,
      clientId: client?.id || sale?.clientId || null,
      createdById: userId,
    },
    include: shipmentInclude,
  });
}

async function createShipmentFromSale({ sale, companyId, userId, unitId, shipping = {}, origin }, db) {
  return createShipment(
    {
      companyId,
      userId,
      unitId: unitId || sale.unitId,
      saleId: sale.id,
      clientId: sale.clientId,
      origin: origin || (sale.origin === 'ecommerce' ? 'ecommerce' : 'sale'),
      recipientName:
        shipping.recipientName ||
        sale.client?.name ||
        (sale.origin === 'ecommerce' || origin === 'ecommerce' ? 'Pedido do site' : null),
      phone: shipping.phone,
      document: shipping.document,
      address: shipping.address,
      complement: shipping.complement,
      neighborhood: shipping.neighborhood,
      city: shipping.city,
      state: shipping.state,
      zipCode: shipping.zipCode,
      itemsNote: shipping.itemsNote,
      carrier: shipping.carrier,
      notes: shipping.notes,
    },
    db
  );
}

async function listShipments({ companyId, status, origin, search, unitId, page = 1, limit = 50, user }) {
  const unitFilter = user ? resolveListUnitFilter(user, unitId) : { ...(unitId && { unitId }) };
  const where = {
    companyId,
    ...(STATUSES.has(status) && { status }),
    ...(ORIGINS.has(origin) && { origin }),
    ...unitFilter,
    ...(search && {
      OR: [
        { recipientName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { trackingCode: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { itemsNote: { contains: search, mode: 'insensitive' } },
        ...(Number(String(search).replace(/\D/g, ''))
          ? [{ number: Number(String(search).replace(/\D/g, '')) }]
          : []),
      ],
    }),
  };

  const [shipments, total, pendingCount] = await Promise.all([
    prisma.shipment.findMany({
      where,
      include: shipmentInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.shipment.count({ where }),
    prisma.shipment.count({ where: { companyId, status: 'pending', ...unitFilter } }),
  ]);

  return {
    shipments,
    pendingCount,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

async function getShipmentById({ companyId, id, user }) {
  const shipment = await prisma.shipment.findFirst({
    where: { id, companyId },
    include: shipmentInclude,
  });
  if (!shipment) {
    throw new ShipmentError('Envio não encontrado', 404);
  }
  if (user) {
    assertResourceUnitAccess(user, shipment.unitId);
  }
  return shipment;
}

function assertPending(shipment) {
  if (shipment.status !== 'pending') {
    throw new ShipmentError('Só dá para alterar envio que ainda está na fila');
  }
}

async function updateShipment({ companyId, id, payload = {}, user }) {
  const existing = await getShipmentById({ companyId, id, user });
  assertPending(existing);

  if (payload.unitId) {
    const unit = await prisma.unit.findFirst({
      where: { id: payload.unitId, companyId, active: true },
    });
    if (!unit) {
      throw new ShipmentError('Unidade não encontrada', 404);
    }
    if (user) {
      assertUnitAccess(user, payload.unitId);
    }
  }

  const name = payload.recipientName !== undefined ? cleanText(payload.recipientName) : existing.recipientName;
  if (!name) {
    throw new ShipmentError('Informe quem recebe o envio');
  }

  return prisma.shipment.update({
    where: { id: existing.id },
    data: {
      recipientName: name,
      ...(payload.phone !== undefined && { phone: onlyDigits(payload.phone) || null }),
      ...(payload.document !== undefined && { document: onlyDigits(payload.document) || null }),
      ...(payload.address !== undefined && { address: cleanText(payload.address) }),
      ...(payload.complement !== undefined && { complement: cleanText(payload.complement) }),
      ...(payload.neighborhood !== undefined && { neighborhood: cleanText(payload.neighborhood) }),
      ...(payload.city !== undefined && { city: cleanText(payload.city) }),
      ...(payload.state !== undefined && { state: cleanText(payload.state) }),
      ...(payload.zipCode !== undefined && { zipCode: onlyDigits(payload.zipCode) || null }),
      ...(payload.itemsNote !== undefined && { itemsNote: cleanText(payload.itemsNote) }),
      ...(payload.carrier !== undefined && { carrier: resolveCarrier(payload.carrier) }),
      ...(payload.notes !== undefined && { notes: cleanText(payload.notes) }),
      ...(payload.unitId !== undefined && { unitId: payload.unitId || null }),
    },
    include: shipmentInclude,
  });
}

async function markShipped({ companyId, id, trackingCode, carrier, user }) {
  const existing = await getShipmentById({ companyId, id, user });
  assertPending(existing);

  return prisma.shipment.update({
    where: { id: existing.id },
    data: {
      status: 'shipped',
      shippedAt: new Date(),
      trackingCode: cleanText(trackingCode) || existing.trackingCode,
      carrier: resolveCarrier(carrier || existing.carrier),
    },
    include: shipmentInclude,
  });
}

async function cancelShipment({ companyId, id, user }) {
  const existing = await getShipmentById({ companyId, id, user });
  assertPending(existing);

  return prisma.shipment.update({
    where: { id: existing.id },
    data: { status: 'cancelled' },
    include: shipmentInclude,
  });
}

module.exports = {
  ShipmentError,
  createShipment,
  createShipmentFromSale,
  listShipments,
  getShipmentById,
  updateShipment,
  markShipped,
  cancelShipment,
  itemsNoteFromSale,
};
