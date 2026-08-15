const prisma = require('../lib/prisma');

function money(value) {
  return Math.round(parseFloat(value || 0) * 100) / 100;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function resolvePeriod(period, fromParam, toParam) {
  if (fromParam && toParam) {
    return { from: new Date(fromParam), to: new Date(toParam) };
  }

  const to = new Date();
  const from = startOfDay(new Date());

  if (period === 'today') {
    return { from, to };
  }
  if (period === '7d') {
    from.setDate(from.getDate() - 6);
    return { from, to };
  }
  if (period === '30d') {
    from.setDate(from.getDate() - 29);
    return { from, to };
  }

  from.setDate(1);
  return { from, to };
}

function dayKey(date) {
  return new Date(date).toLocaleDateString('en-CA');
}

async function getSalesDashboard({ companyId, unitFilter = {}, period, from, to, sellerId, commissionRate }) {
  const range = resolvePeriod(period, from, to);
  const dateFilter = { gte: range.from, lte: range.to };
  const saleScope = {
    companyId,
    createdAt: dateFilter,
    status: { not: 'cancelled' },
    ...unitFilter,
    ...(sellerId && { sellerId }),
  };
  const aftersaleScope = {
    companyId,
    createdAt: dateFilter,
    ...unitFilter,
    ...(sellerId && { sale: { sellerId } }),
  };

  const [sales, returns, exchanges, clientsCount, pendingQuotes] = await Promise.all([
    prisma.sale.findMany({
      where: saleScope,
      include: {
        seller: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.saleReturn.findMany({
      where: aftersaleScope,
      select: { refundAmount: true },
    }),
    prisma.exchange.findMany({
      where: aftersaleScope,
      select: { difference: true },
    }),
    prisma.client.count({ where: { companyId, status: 1 } }),
    prisma.quote.count({
      where: { companyId, deletionStatus: 1, status: 'pending' },
    }),
  ]);

  const gross = money(sales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0));
  const refunds = money(returns.reduce((sum, item) => sum + parseFloat(item.refundAmount || 0), 0));
  const exchangeDiff = money(
    exchanges.reduce((sum, item) => sum + parseFloat(item.difference || 0), 0)
  );
  const net = money(gross - refunds + exchangeDiff);
  const salesCount = sales.length;
  const ticket = salesCount ? money(gross / salesCount) : 0;
  const pieces = sales.reduce(
    (sum, sale) => sum + sale.items.reduce((acc, item) => acc + parseFloat(item.quantity || 0), 0),
    0
  );

  const byDayMap = {};
  const byUnitMap = {};
  const bySellerMap = {};
  const byPaymentMap = {};
  const byChannelMap = {};
  const bySkuMap = {};

  for (const sale of sales) {
    const day = dayKey(sale.createdAt);
    byDayMap[day] = money((byDayMap[day] || 0) + parseFloat(sale.total || 0));

    const unitName = sale.unit?.name || 'Sem unidade';
    if (!byUnitMap[sale.unitId || unitName]) {
      byUnitMap[sale.unitId || unitName] = { id: sale.unitId, name: unitName, total: 0, count: 0 };
    }
    byUnitMap[sale.unitId || unitName].total = money(
      byUnitMap[sale.unitId || unitName].total + parseFloat(sale.total || 0)
    );
    byUnitMap[sale.unitId || unitName].count += 1;

    const sellerKey = sale.sellerId;
    if (!bySellerMap[sellerKey]) {
      bySellerMap[sellerKey] = { id: sale.sellerId, name: sale.seller?.name || '—', total: 0, count: 0 };
    }
    bySellerMap[sellerKey].total = money(bySellerMap[sellerKey].total + parseFloat(sale.total || 0));
    bySellerMap[sellerKey].count += 1;

    const channel = sale.channel || 'retail';
    byChannelMap[channel] = money((byChannelMap[channel] || 0) + parseFloat(sale.total || 0));

    for (const payment of sale.payments) {
      byPaymentMap[payment.method] = money(
        (byPaymentMap[payment.method] || 0) + parseFloat(payment.amount || 0)
      );
    }

    for (const item of sale.items) {
      if (!bySkuMap[item.sku]) {
        bySkuMap[item.sku] = {
          sku: item.sku,
          productName: item.productName,
          quantity: 0,
          total: 0,
        };
      }
      bySkuMap[item.sku].quantity += parseFloat(item.quantity || 0);
      bySkuMap[item.sku].total = money(bySkuMap[item.sku].total + parseFloat(item.total || 0));
    }
  }

  const days = [];
  const cursor = startOfDay(range.from);
  const end = startOfDay(range.to);
  while (cursor <= end) {
    const key = dayKey(cursor);
    days.push({ date: key, total: byDayMap[key] || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    period: { from: range.from, to: range.to },
    summary: {
      gross,
      refunds,
      exchangeDiff,
      net,
      salesCount,
      ticket,
      pieces,
      returnsCount: returns.length,
      exchangesCount: exchanges.length,
      clientsCount,
      pendingQuotes,
      commissionRate: commissionRate == null ? null : parseFloat(commissionRate),
      commission: commissionRate == null ? null : money(gross * (parseFloat(commissionRate) / 100)),
    },
    byDay: days,
    byUnit: Object.values(byUnitMap).sort((a, b) => b.total - a.total),
    bySeller: Object.values(bySellerMap).sort((a, b) => b.total - a.total),
    byPayment: Object.entries(byPaymentMap).map(([method, total]) => ({ method, total })),
    byChannel: Object.entries(byChannelMap).map(([channel, total]) => ({ channel, total })),
    topProducts: Object.values(bySkuMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8),
  };
}

module.exports = { getSalesDashboard };
