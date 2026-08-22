const { Prisma } = require('@prisma/client');
const prisma = require('../lib/prisma');
const { computeSessionTotals } = require('./cash.service');

const EXPORT_MAX = 20000;
const PAGE_DEFAULT = 50;
const PAGE_MAX = 100;
const METHODS = new Set(['cash', 'pix', 'debit', 'credit', 'other']);
const CHANNELS = new Set(['retail', 'wholesale']);
const SALE_STATUSES = new Set(['completed', 'cancelled', 'all']);
const SESSION_STATUSES = new Set(['open', 'closed', 'all']);
const ENTRY_TYPES = ['entry', 'return', 'sale_cancel', 'exchange_in', 'transfer_in', 'production'];
const EXIT_TYPES = ['exit', 'sale', 'exchange_out', 'transfer_out'];

class ReportError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function money(value) {
  return Math.round(parseFloat(value || 0) * 100) / 100;
}

function qty(value) {
  return parseFloat(value || 0);
}

function parseBound(value, end) {
  if (!value) return null;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split('-').map(Number);
    return new Date(
      year,
      month - 1,
      day,
      end ? 23 : 0,
      end ? 59 : 0,
      end ? 59 : 0,
      end ? 999 : 0
    );
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new ReportError('Período inválido');
  }
  return date;
}

function requirePeriod(fromParam, toParam) {
  const from = parseBound(fromParam, false);
  const to = parseBound(toParam, true);
  if (!from || !to) {
    throw new ReportError('Informe o período inicial e final');
  }
  if (from > to) {
    throw new ReportError('Período inicial deve ser anterior ao final');
  }
  return { from, to };
}

function optionalPeriod(fromParam, toParam) {
  if (!fromParam && !toParam) return null;
  return requirePeriod(fromParam, toParam);
}

function paginationOf(page, limit, total) {
  const safeLimit = Math.min(PAGE_MAX, Math.max(1, Number(limit) || PAGE_DEFAULT));
  const safePage = Math.max(1, Number(page) || 1);
  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit) || 1),
    skip: (safePage - 1) * safeLimit,
  };
}

function dateFilter(range) {
  if (!range) return {};
  return { createdAt: { gte: range.from, lte: range.to } };
}

function sqlUnit(alias, unitFilter) {
  if (!unitFilter?.unitId) return Prisma.empty;
  if (typeof unitFilter.unitId === 'string') {
    return Prisma.sql`AND ${Prisma.raw(`${alias}."unitId"`)} = ${unitFilter.unitId}`;
  }
  const ids = unitFilter.unitId.in || [];
  if (!ids.length) return Prisma.sql`AND 1=0`;
  return Prisma.sql`AND ${Prisma.raw(`${alias}."unitId"`)} IN (${Prisma.join(ids)})`;
}

function sqlSeller(alias, sellerId) {
  if (!sellerId) return Prisma.empty;
  return Prisma.sql`AND ${Prisma.raw(`${alias}."sellerId"`)} = ${sellerId}`;
}

function csvEscape(value) {
  if (value == null) return '';
  const str = String(value);
  if (/[;"\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(headers, rows, summaryRows = []) {
  const lines = [];
  for (const row of summaryRows) {
    lines.push(row.map(csvEscape).join(';'));
  }
  if (summaryRows.length) lines.push('');
  lines.push(headers.map(csvEscape).join(';'));
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(';'));
  }
  return `\uFEFF${lines.join('\r\n')}`;
}

function csvResponse(filename, csv) {
  return {
    filename,
    csv,
    contentType: 'text/csv; charset=utf-8',
  };
}

function assertExportSize(count) {
  if (count > EXPORT_MAX) {
    throw new ReportError('A exportação ultrapassa 20.000 linhas. Estreite os filtros.', 400);
  }
}

function saleWhere({ companyId, unitFilter, range, sellerId, clientId, channel, method, variantId, sku, productId, search, status }) {
  const where = {
    companyId,
    ...unitFilter,
    ...(range ? dateFilter(range) : {}),
    ...(sellerId && { sellerId }),
    ...(clientId && { clientId }),
    ...(CHANNELS.has(channel) && { channel }),
  };

  if (status && status !== 'all' && SALE_STATUSES.has(status)) {
    where.status = status;
  }

  if (METHODS.has(method)) {
    where.payments = { some: { method } };
  }

  const itemSome = {};
  if (variantId) itemSome.variantId = variantId;
  if (sku) itemSome.sku = { contains: sku, mode: 'insensitive' };
  if (productId) itemSome.variant = { productId };
  if (Object.keys(itemSome).length) {
    where.items = { some: itemSome };
  }

  const term = String(search || '').trim();
  if (term) {
    const or = [
      { client: { name: { contains: term, mode: 'insensitive' } } },
    ];
    if (/^\d+$/.test(term)) {
      or.push({ number: Number(term) });
    }
    where.AND = [...(where.AND || []), { OR: or }];
  }

  return where;
}

function completedWhere(params) {
  return { ...saleWhere({ ...params, status: 'completed' }), status: 'completed' };
}

function aftersaleWhere({ companyId, unitFilter, range, sellerId }) {
  return {
    companyId,
    ...unitFilter,
    ...(range ? dateFilter(range) : {}),
    ...(sellerId && { sale: { sellerId } }),
  };
}

async function financialSummary(params) {
  const completed = completedWhere(params);
  const aftersale = aftersaleWhere(params);

  const [salesAgg, itemAgg, returnsAgg, exchangesAgg, cancelledCount] = await Promise.all([
    prisma.sale.aggregate({
      where: completed,
      _sum: { total: true, discount: true },
      _count: { _all: true },
    }),
    prisma.saleItem.aggregate({
      where: { sale: completed },
      _sum: { quantity: true, discount: true },
    }),
    prisma.saleReturn.aggregate({
      where: aftersale,
      _sum: { refundAmount: true },
      _count: { _all: true },
    }),
    prisma.exchange.aggregate({
      where: aftersale,
      _sum: { difference: true },
      _count: { _all: true },
    }),
    prisma.sale.count({ where: saleWhere({ ...params, status: 'cancelled' }) }),
  ]);

  const gross = money(salesAgg._sum.total);
  const refunds = money(returnsAgg._sum.refundAmount);
  const exchangeDiff = money(exchangesAgg._sum.difference);
  return {
    salesCount: salesAgg._count._all,
    cancelledCount,
    pieces: qty(itemAgg._sum.quantity),
    discountTotal: money(salesAgg._sum.discount),
    gross,
    refunds,
    exchangeDiff,
    net: money(gross - refunds + exchangeDiff),
    returnsCount: returnsAgg._count._all,
    exchangesCount: exchangesAgg._count._all,
  };
}

async function listSalesReport(params) {
  const range = requirePeriod(params.from, params.to);
  const status = SALE_STATUSES.has(params.status) ? params.status : 'completed';
  const filters = { ...params, range, status };
  const where = saleWhere(filters);
  const total = await prisma.sale.count({ where });
  const paging = paginationOf(params.page, params.limit, total);

  const [rows, summary] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        client: { select: { id: true, number: true, name: true } },
        seller: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        items: { orderBy: { productName: 'asc' } },
        payments: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      skip: paging.skip,
      take: paging.limit,
    }),
    financialSummary({ ...params, range }),
  ]);

  return {
    rows,
    summary,
    pagination: paging,
    period: range,
  };
}

async function exportSalesReport(params) {
  const range = requirePeriod(params.from, params.to);
  const status = SALE_STATUSES.has(params.status) ? params.status : 'completed';
  const filters = { ...params, range, status };
  const where = saleWhere(filters);
  const count = await prisma.saleItem.count({ where: { sale: where } });
  assertExportSize(count);

  const [items, summary] = await Promise.all([
    prisma.saleItem.findMany({
      where: { sale: where },
      include: {
        sale: {
          include: {
            client: { select: { number: true, name: true } },
            seller: { select: { name: true } },
            unit: { select: { name: true } },
            payments: true,
          },
        },
      },
      orderBy: [{ sale: { createdAt: 'desc' } }, { productName: 'asc' }],
      take: EXPORT_MAX,
    }),
    financialSummary({ ...params, range }),
  ]);

  const headers = [
    'numero',
    'data',
    'status',
    'canal',
    'cliente',
    'vendedor',
    'unidade',
    'sku',
    'produto',
    'cor',
    'tamanho',
    'quantidade',
    'desconto_item',
    'total_item',
    'desconto_venda',
    'total_venda',
    'pagamentos',
  ];
  const rows = items.map((item) => ({
    numero: item.sale.number,
    data: item.sale.createdAt.toISOString(),
    status: item.sale.status,
    canal: item.sale.channel,
    cliente: item.sale.client?.name || '',
    vendedor: item.sale.seller?.name || '',
    unidade: item.sale.unit?.name || '',
    sku: item.sku,
    produto: item.productName,
    cor: item.color || '',
    tamanho: item.size || '',
    quantidade: qty(item.quantity),
    desconto_item: money(item.discount),
    total_item: money(item.total),
    desconto_venda: money(item.sale.discount),
    total_venda: money(item.sale.total),
    pagamentos: (item.sale.payments || [])
      .map((payment) => `${payment.method}:${money(payment.amount)}`)
      .join(' | '),
  }));

  const csv = toCsv(headers, rows, [
    ['RESUMO', 'vendas_completed', 'bruto', 'estornos', 'trocas', 'liquido', 'pecas'],
    [
      '',
      summary.salesCount,
      summary.gross,
      summary.refunds,
      summary.exchangeDiff,
      summary.net,
      summary.pieces,
    ],
  ]);
  return csvResponse('relatorio-vendas.csv', csv);
}

async function listClientsReport(params) {
  const range = optionalPeriod(params.from, params.to);
  const search = String(params.search || '').trim();
  const unitSql = sqlUnit('s', params.unitFilter);
  const sellerSql = sqlSeller('s', params.sellerId);
  const periodSql = range
    ? Prisma.sql`AND s."createdAt" >= ${range.from} AND s."createdAt" <= ${range.to}`
    : Prisma.empty;
  const joinType = range || params.unitFilter?.unitId || params.sellerId ? Prisma.sql`INNER JOIN` : Prisma.sql`LEFT JOIN`;
  const searchSql = search
    ? Prisma.sql`AND (
        c.name ILIKE ${`%${search}%`}
        OR COALESCE(c.document, '') ILIKE ${`%${search}%`}
        OR COALESCE(c.phone, '') ILIKE ${`%${search}%`}
        OR CAST(c.number AS TEXT) ILIKE ${`%${search}%`}
      )`
    : Prisma.empty;

  const countRows = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS total
    FROM (
      SELECT c.id
      FROM clients c
      ${joinType} sales s
        ON s."clientId" = c.id
        AND s."companyId" = c."companyId"
        AND s.status = 'completed'
        ${periodSql}
        ${unitSql}
        ${sellerSql}
      WHERE c."companyId" = ${params.companyId}
        AND c.status = 1
        ${searchSql}
      GROUP BY c.id
    ) counted
  `;
  const total = countRows[0]?.total || 0;
  const paging = paginationOf(params.page, params.limit, total);

  const rows = await prisma.$queryRaw`
    SELECT
      c.id,
      c.number,
      c.name,
      c.document,
      c.phone,
      COUNT(s.id)::int AS "salesCount",
      COALESCE(SUM(s.total), 0)::decimal AS "totalSpent",
      MAX(s."createdAt") AS "lastPurchaseAt"
    FROM clients c
    ${joinType} sales s
      ON s."clientId" = c.id
      AND s."companyId" = c."companyId"
      AND s.status = 'completed'
      ${periodSql}
      ${unitSql}
      ${sellerSql}
    WHERE c."companyId" = ${params.companyId}
      AND c.status = 1
      ${searchSql}
    GROUP BY c.id
    ORDER BY MAX(s."createdAt") DESC NULLS LAST, c.name ASC
    LIMIT ${paging.limit}
    OFFSET ${paging.skip}
  `;

  const summaryRows = await prisma.$queryRaw`
    SELECT
      COUNT(*)::int AS "clientsCount",
      COALESCE(SUM("totalSpent"), 0)::decimal AS "totalSpent"
    FROM (
      SELECT c.id, COALESCE(SUM(s.total), 0) AS "totalSpent"
      FROM clients c
      ${joinType} sales s
        ON s."clientId" = c.id
        AND s."companyId" = c."companyId"
        AND s.status = 'completed'
        ${periodSql}
        ${unitSql}
        ${sellerSql}
      WHERE c."companyId" = ${params.companyId}
        AND c.status = 1
        ${searchSql}
      GROUP BY c.id
    ) totals
  `;

  return {
    rows: rows.map((row) => ({
      id: row.id,
      number: row.number,
      name: row.name,
      document: row.document,
      phone: row.phone,
      salesCount: row.salesCount,
      totalSpent: money(row.totalSpent),
      lastPurchaseAt: row.lastPurchaseAt,
    })),
    summary: {
      clientsCount: summaryRows[0]?.clientsCount || 0,
      totalSpent: money(summaryRows[0]?.totalSpent),
    },
    pagination: paging,
    period: range,
  };
}

async function exportClientsReport(params) {
  const result = await listClientsReport({ ...params, page: 1, limit: EXPORT_MAX });
  assertExportSize(result.pagination.total);
  if (result.pagination.total > result.rows.length) {
    const full = await listClientsReport({ ...params, page: 1, limit: EXPORT_MAX });
    result.rows = full.rows;
  }
  const headers = ['numero', 'nome', 'documento', 'telefone', 'compras', 'total_comprado', 'ultima_compra'];
  const rows = result.rows.map((row) => ({
    numero: row.number,
    nome: row.name,
    documento: row.document || '',
    telefone: row.phone || '',
    compras: row.salesCount,
    total_comprado: row.totalSpent,
    ultima_compra: row.lastPurchaseAt ? new Date(row.lastPurchaseAt).toISOString() : '',
  }));
  const csv = toCsv(headers, rows, [
    ['RESUMO', 'clientes', 'total_comprado'],
    ['', result.summary.clientsCount, result.summary.totalSpent],
  ]);
  return csvResponse('relatorio-clientes.csv', csv);
}

function productFiltersSql(params) {
  const search = String(params.search || '').trim();
  const chunks = [];
  if (params.variantId) chunks.push(Prisma.sql`AND v.id = ${params.variantId}`);
  if (params.sku) chunks.push(Prisma.sql`AND v.sku ILIKE ${`%${params.sku}%`}`);
  if (params.productId) chunks.push(Prisma.sql`AND p.id = ${params.productId}`);
  if (search) {
    chunks.push(Prisma.sql`AND (p.name ILIKE ${`%${search}%`} OR v.sku ILIKE ${`%${search}%`})`);
  }
  if (!chunks.length) return Prisma.empty;
  return Prisma.join(chunks, ' ');
}

async function listProductsReport(params) {
  const range = requirePeriod(params.from, params.to);
  const unitSql = sqlUnit('st', params.unitFilter);
  const sellerSql = sqlSeller('s', params.sellerId);
  const extra = productFiltersSql(params);

  const countRows = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS total
    FROM stocks st
    JOIN product_variants v ON v.id = st."variantId"
    JOIN products p ON p.id = v."productId"
    WHERE st."companyId" = ${params.companyId}
      ${unitSql}
      ${extra}
  `;
  const total = countRows[0]?.total || 0;
  const paging = paginationOf(params.page, params.limit, total);

  const rows = await prisma.$queryRaw`
    SELECT
      st.id,
      st.quantity AS "stockQty",
      v.id AS "variantId",
      v.sku,
      v.color,
      v.size,
      p.id AS "productId",
      p.name AS product,
      u.id AS "unitId",
      u.name AS unit,
      COALESCE(sold.qty, 0)::decimal AS "qtySoldGross",
      COALESCE(sold.revenue, 0)::decimal AS "revenueGross",
      COALESCE(ret.qty, 0)::decimal AS "qtyReturned",
      COALESCE(ret.amount, 0)::decimal AS refunds,
      COALESCE(exin.qty, 0)::decimal AS "qtyExchangeIn",
      COALESCE(exout.qty, 0)::decimal AS "qtyExchangeOut",
      COALESCE(exout.amount, 0)::decimal - COALESCE(exin.amount, 0)::decimal AS "exchangeDiff"
    FROM stocks st
    JOIN product_variants v ON v.id = st."variantId"
    JOIN products p ON p.id = v."productId"
    JOIN units u ON u.id = st."unitId"
    LEFT JOIN (
      SELECT si."variantId", s."unitId", SUM(si.quantity) AS qty, SUM(si.total) AS revenue
      FROM sale_items si
      JOIN sales s ON s.id = si."saleId"
      WHERE s."companyId" = ${params.companyId}
        AND s.status = 'completed'
        AND s."createdAt" >= ${range.from}
        AND s."createdAt" <= ${range.to}
        ${sqlUnit('s', params.unitFilter)}
        ${sellerSql}
      GROUP BY si."variantId", s."unitId"
    ) sold ON sold."variantId" = st."variantId" AND sold."unitId" = st."unitId"
    LEFT JOIN (
      SELECT COALESCE(ri."variantId", si."variantId") AS "variantId", r."unitId",
        SUM(ri.quantity) AS qty, SUM(ri.total) AS amount
      FROM return_items ri
      JOIN returns r ON r.id = ri."returnId"
      JOIN sale_items si ON si.id = ri."saleItemId"
      JOIN sales s ON s.id = r."saleId"
      WHERE r."companyId" = ${params.companyId}
        AND r."createdAt" >= ${range.from}
        AND r."createdAt" <= ${range.to}
        ${sqlUnit('r', params.unitFilter)}
        ${sellerSql}
      GROUP BY COALESCE(ri."variantId", si."variantId"), r."unitId"
    ) ret ON ret."variantId" = st."variantId" AND ret."unitId" = st."unitId"
    LEFT JOIN (
      SELECT ei."variantId", e."unitId", SUM(ei.quantity) AS qty, SUM(ei.total) AS amount
      FROM exchange_items ei
      JOIN exchanges e ON e.id = ei."exchangeId"
      JOIN sales s ON s.id = e."saleId"
      WHERE e."companyId" = ${params.companyId}
        AND ei.direction = 'in'
        AND e."createdAt" >= ${range.from}
        AND e."createdAt" <= ${range.to}
        ${sqlUnit('e', params.unitFilter)}
        ${sellerSql}
      GROUP BY ei."variantId", e."unitId"
    ) exin ON exin."variantId" = st."variantId" AND exin."unitId" = st."unitId"
    LEFT JOIN (
      SELECT ei."variantId", e."unitId", SUM(ei.quantity) AS qty, SUM(ei.total) AS amount
      FROM exchange_items ei
      JOIN exchanges e ON e.id = ei."exchangeId"
      JOIN sales s ON s.id = e."saleId"
      WHERE e."companyId" = ${params.companyId}
        AND ei.direction = 'out'
        AND e."createdAt" >= ${range.from}
        AND e."createdAt" <= ${range.to}
        ${sqlUnit('e', params.unitFilter)}
        ${sellerSql}
      GROUP BY ei."variantId", e."unitId"
    ) exout ON exout."variantId" = st."variantId" AND exout."unitId" = st."unitId"
    WHERE st."companyId" = ${params.companyId}
      ${unitSql}
      ${extra}
    ORDER BY p.name ASC, v.sku ASC, u.name ASC
    LIMIT ${paging.limit}
    OFFSET ${paging.skip}
  `;

  const mapped = rows.map((row) => {
    const qtySoldGross = qty(row.qtySoldGross);
    const qtySoldNet = qtySoldGross - qty(row.qtyReturned) - qty(row.qtyExchangeIn) + qty(row.qtyExchangeOut);
    const revenueGross = money(row.revenueGross);
    const revenueNet = money(revenueGross - money(row.refunds) + money(row.exchangeDiff));
    return {
      variantId: row.variantId,
      productId: row.productId,
      unitId: row.unitId,
      product: row.product,
      sku: row.sku,
      color: row.color,
      size: row.size,
      unit: row.unit,
      stockQty: qty(row.stockQty),
      qtySoldGross,
      qtySoldNet,
      revenueGross,
      revenueNet,
    };
  });

  const summaryAgg = await financialSummary({ ...params, range });
  const stockSum = await prisma.stock.aggregate({
    where: { companyId: params.companyId, ...params.unitFilter },
    _sum: { quantity: true },
    _count: { _all: true },
  });

  return {
    rows: mapped,
    summary: {
      skuCount: stockSum._count._all,
      stockQty: qty(stockSum._sum.quantity),
      qtySoldNet: summaryAgg.pieces,
      revenueGross: summaryAgg.gross,
      refunds: summaryAgg.refunds,
      exchangeDiff: summaryAgg.exchangeDiff,
      revenueNet: summaryAgg.net,
    },
    pagination: paging,
    period: range,
  };
}

async function exportProductsReport(params) {
  const counted = await listProductsReport({ ...params, page: 1, limit: 1 });
  assertExportSize(counted.pagination.total);
  const full = await listProductsReport({ ...params, page: 1, limit: EXPORT_MAX });
  const headers = [
    'produto',
    'sku',
    'cor',
    'tamanho',
    'unidade',
    'estoque_atual',
    'qtd_vendida_bruta',
    'qtd_vendida_liquida',
    'faturamento_bruto',
    'faturamento_liquido',
  ];
  const rows = full.rows.map((row) => ({
    produto: row.product,
    sku: row.sku,
    cor: row.color || '',
    tamanho: row.size || '',
    unidade: row.unit,
    estoque_atual: row.stockQty,
    qtd_vendida_bruta: row.qtySoldGross,
    qtd_vendida_liquida: row.qtySoldNet,
    faturamento_bruto: row.revenueGross,
    faturamento_liquido: row.revenueNet,
  }));
  const csv = toCsv(headers, rows, [
    ['RESUMO', 'skus', 'estoque', 'liquido'],
    ['', full.summary.skuCount, full.summary.stockQty, full.summary.revenueNet],
  ]);
  return csvResponse('relatorio-produtos.csv', csv);
}

async function listStockReport(params) {
  const range = optionalPeriod(params.from, params.to);
  const search = String(params.search || '').trim();
  const where = {
    companyId: params.companyId,
    ...params.unitFilter,
    ...(params.variantId && { variantId: params.variantId }),
    ...((search || params.sku) && {
      variant: {
        ...(params.sku && { sku: { contains: params.sku, mode: 'insensitive' } }),
        ...(search && {
          OR: [
            { sku: { contains: search, mode: 'insensitive' } },
            { product: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }),
      },
    }),
  };

  const total = await prisma.stock.count({ where });
  const paging = paginationOf(params.page, params.limit, total);
  const rows = await prisma.stock.findMany({
    where,
    include: {
      variant: { select: { sku: true, color: true, size: true, product: { select: { name: true } } } },
      unit: { select: { id: true, name: true } },
    },
    orderBy: [{ variant: { sku: 'asc' } }],
    skip: paging.skip,
    take: paging.limit,
  });

  let movementMap = {};
  if (range && rows.length) {
    const keys = rows.map((row) => ({ variantId: row.variantId, unitId: row.unitId }));
    const movements = await prisma.stockMovement.groupBy({
      by: ['variantId', 'unitId', 'type'],
      where: {
        companyId: params.companyId,
        createdAt: { gte: range.from, lte: range.to },
        OR: keys,
      },
      _sum: { quantity: true },
    });
    for (const item of movements) {
      const key = `${item.variantId}:${item.unitId}`;
      if (!movementMap[key]) movementMap[key] = { entries: 0, exits: 0 };
      const amount = qty(item._sum.quantity);
      if (ENTRY_TYPES.includes(item.type)) movementMap[key].entries += amount;
      if (EXIT_TYPES.includes(item.type)) movementMap[key].exits += amount;
    }
  }

  const mapped = rows.map((row) => {
    const key = `${row.variantId}:${row.unitId}`;
    const movement = movementMap[key] || { entries: null, exits: null };
    return {
      product: row.variant.product.name,
      sku: row.variant.sku,
      color: row.variant.color,
      size: row.variant.size,
      unit: row.unit.name,
      unitId: row.unitId,
      variantId: row.variantId,
      stockQty: qty(row.quantity),
      entries: range ? movement.entries || 0 : null,
      exits: range ? movement.exits || 0 : null,
    };
  });

  const stockSum = await prisma.stock.aggregate({
    where,
    _sum: { quantity: true },
  });

  let entries = null;
  let exits = null;
  if (range) {
    const [entryAgg, exitAgg] = await Promise.all([
      prisma.stockMovement.aggregate({
        where: {
          companyId: params.companyId,
          ...params.unitFilter,
          createdAt: { gte: range.from, lte: range.to },
          type: { in: ENTRY_TYPES },
        },
        _sum: { quantity: true },
      }),
      prisma.stockMovement.aggregate({
        where: {
          companyId: params.companyId,
          ...params.unitFilter,
          createdAt: { gte: range.from, lte: range.to },
          type: { in: EXIT_TYPES },
        },
        _sum: { quantity: true },
      }),
    ]);
    entries = qty(entryAgg._sum.quantity);
    exits = qty(exitAgg._sum.quantity);
  }

  return {
    rows: mapped,
    summary: {
      skuCount: total,
      stockQty: qty(stockSum._sum.quantity),
      entries,
      exits,
    },
    pagination: paging,
    period: range,
  };
}

async function exportStockReport(params) {
  const counted = await listStockReport({ ...params, page: 1, limit: 1 });
  assertExportSize(counted.pagination.total);
  const full = await listStockReport({ ...params, page: 1, limit: EXPORT_MAX });
  const headers = ['produto', 'sku', 'cor', 'tamanho', 'unidade', 'estoque_atual', 'entradas', 'saidas'];
  const rows = full.rows.map((row) => ({
    produto: row.product,
    sku: row.sku,
    cor: row.color || '',
    tamanho: row.size || '',
    unidade: row.unit,
    estoque_atual: row.stockQty,
    entradas: row.entries == null ? '' : row.entries,
    saidas: row.exits == null ? '' : row.exits,
  }));
  const csv = toCsv(headers, rows, [
    ['RESUMO', 'skus', 'estoque', 'entradas', 'saidas'],
    ['', full.summary.skuCount, full.summary.stockQty, full.summary.entries ?? '', full.summary.exits ?? ''],
  ]);
  return csvResponse('relatorio-estoque.csv', csv);
}

async function listSellersReport(params) {
  const range = requirePeriod(params.from, params.to);
  const unitSql = sqlUnit('s', params.unitFilter);
  const sellerSql = sqlSeller('s', params.sellerId);
  const periodSql = Prisma.sql`AND s."createdAt" >= ${range.from} AND s."createdAt" <= ${range.to}`;

  const rows = await prisma.$queryRaw`
    SELECT
      s."sellerId",
      s."unitId",
      u.name AS seller,
      un.name AS unit,
      COUNT(s.id)::int AS "salesCount",
      COALESCE(SUM(s.total), 0)::decimal AS gross,
      COALESCE(SUM(s.discount), 0)::decimal AS "saleDiscount",
      COALESCE(pieces.qty, 0)::decimal AS "piecesGross",
      COALESCE(ref.refunds, 0)::decimal AS refunds,
      COALESCE(ex.diff, 0)::decimal AS "exchangeDiff",
      COALESCE(retqty.qty, 0)::decimal AS "qtyReturned",
      COALESCE(exin.qty, 0)::decimal AS "qtyExchangeIn",
      COALESCE(exout.qty, 0)::decimal AS "qtyExchangeOut"
    FROM sales s
    JOIN users u ON u.id = s."sellerId"
    JOIN units un ON un.id = s."unitId"
    LEFT JOIN (
      SELECT s2."sellerId", s2."unitId", SUM(si.quantity) AS qty
      FROM sale_items si
      JOIN sales s2 ON s2.id = si."saleId"
      WHERE s2."companyId" = ${params.companyId} AND s2.status = 'completed'
        AND s2."createdAt" >= ${range.from} AND s2."createdAt" <= ${range.to}
        ${sqlUnit('s2', params.unitFilter)} ${sqlSeller('s2', params.sellerId)}
      GROUP BY s2."sellerId", s2."unitId"
    ) pieces ON pieces."sellerId" = s."sellerId" AND pieces."unitId" = s."unitId"
    LEFT JOIN (
      SELECT s2."sellerId", r."unitId", SUM(r."refundAmount") AS refunds
      FROM returns r
      JOIN sales s2 ON s2.id = r."saleId"
      WHERE r."companyId" = ${params.companyId}
        AND r."createdAt" >= ${range.from} AND r."createdAt" <= ${range.to}
        ${sqlUnit('r', params.unitFilter)} ${sqlSeller('s2', params.sellerId)}
      GROUP BY s2."sellerId", r."unitId"
    ) ref ON ref."sellerId" = s."sellerId" AND ref."unitId" = s."unitId"
    LEFT JOIN (
      SELECT s2."sellerId", e."unitId", SUM(e.difference) AS diff
      FROM exchanges e
      JOIN sales s2 ON s2.id = e."saleId"
      WHERE e."companyId" = ${params.companyId}
        AND e."createdAt" >= ${range.from} AND e."createdAt" <= ${range.to}
        ${sqlUnit('e', params.unitFilter)} ${sqlSeller('s2', params.sellerId)}
      GROUP BY s2."sellerId", e."unitId"
    ) ex ON ex."sellerId" = s."sellerId" AND ex."unitId" = s."unitId"
    LEFT JOIN (
      SELECT s2."sellerId", r."unitId", SUM(ri.quantity) AS qty
      FROM return_items ri
      JOIN returns r ON r.id = ri."returnId"
      JOIN sales s2 ON s2.id = r."saleId"
      WHERE r."companyId" = ${params.companyId}
        AND r."createdAt" >= ${range.from} AND r."createdAt" <= ${range.to}
        ${sqlUnit('r', params.unitFilter)} ${sqlSeller('s2', params.sellerId)}
      GROUP BY s2."sellerId", r."unitId"
    ) retqty ON retqty."sellerId" = s."sellerId" AND retqty."unitId" = s."unitId"
    LEFT JOIN (
      SELECT s2."sellerId", e."unitId", SUM(ei.quantity) AS qty
      FROM exchange_items ei
      JOIN exchanges e ON e.id = ei."exchangeId"
      JOIN sales s2 ON s2.id = e."saleId"
      WHERE e."companyId" = ${params.companyId} AND ei.direction = 'in'
        AND e."createdAt" >= ${range.from} AND e."createdAt" <= ${range.to}
        ${sqlUnit('e', params.unitFilter)} ${sqlSeller('s2', params.sellerId)}
      GROUP BY s2."sellerId", e."unitId"
    ) exin ON exin."sellerId" = s."sellerId" AND exin."unitId" = s."unitId"
    LEFT JOIN (
      SELECT s2."sellerId", e."unitId", SUM(ei.quantity) AS qty
      FROM exchange_items ei
      JOIN exchanges e ON e.id = ei."exchangeId"
      JOIN sales s2 ON s2.id = e."saleId"
      WHERE e."companyId" = ${params.companyId} AND ei.direction = 'out'
        AND e."createdAt" >= ${range.from} AND e."createdAt" <= ${range.to}
        ${sqlUnit('e', params.unitFilter)} ${sqlSeller('s2', params.sellerId)}
      GROUP BY s2."sellerId", e."unitId"
    ) exout ON exout."sellerId" = s."sellerId" AND exout."unitId" = s."unitId"
    WHERE s."companyId" = ${params.companyId}
      AND s.status = 'completed'
      ${periodSql}
      ${unitSql}
      ${sellerSql}
    GROUP BY s."sellerId", s."unitId", u.name, un.name,
      pieces.qty, ref.refunds, ex.diff, retqty.qty, exin.qty, exout.qty
    ORDER BY COALESCE(SUM(s.total), 0) DESC
  `;

  const mapped = rows.map((row) => {
    const gross = money(row.gross);
    const refunds = money(row.refunds);
    const exchangeDiff = money(row.exchangeDiff);
    const piecesGross = qty(row.piecesGross);
    const piecesNet = piecesGross - qty(row.qtyReturned) - qty(row.qtyExchangeIn) + qty(row.qtyExchangeOut);
    return {
      sellerId: row.sellerId,
      unitId: row.unitId,
      seller: row.seller,
      unit: row.unit,
      salesCount: row.salesCount,
      piecesNet,
      revenueGross: gross,
      revenueNet: money(gross - refunds + exchangeDiff),
      discountTotal: money(row.saleDiscount),
    };
  });

  const total = mapped.length;
  const paging = paginationOf(params.page, params.limit, total);
  const pageRows = mapped.slice(paging.skip, paging.skip + paging.limit);
  const summary = await financialSummary({ ...params, range });

  return {
    rows: pageRows,
    summary: {
      salesCount: summary.salesCount,
      piecesNet: pageRows.length === mapped.length
        ? mapped.reduce((sum, row) => sum + row.piecesNet, 0)
        : mapped.reduce((sum, row) => sum + row.piecesNet, 0),
      revenueNet: summary.net,
      discountTotal: summary.discountTotal,
      gross: summary.gross,
      refunds: summary.refunds,
      exchangeDiff: summary.exchangeDiff,
    },
    pagination: paging,
    period: range,
  };
}

async function exportSellersReport(params) {
  const full = await listSellersReport({ ...params, page: 1, limit: EXPORT_MAX });
  assertExportSize(full.pagination.total);
  const headers = ['vendedor', 'unidade', 'vendas', 'pecas_liquidas', 'faturamento_liquido', 'descontos'];
  const rows = full.rows.map((row) => ({
    vendedor: row.seller,
    unidade: row.unit,
    vendas: row.salesCount,
    pecas_liquidas: row.piecesNet,
    faturamento_liquido: row.revenueNet,
    descontos: row.discountTotal,
  }));
  const csv = toCsv(headers, rows, [
    ['RESUMO', 'vendas', 'liquido', 'descontos'],
    ['', full.summary.salesCount, full.summary.revenueNet, full.summary.discountTotal],
  ]);
  return csvResponse('relatorio-vendedores.csv', csv);
}

function mapCashRow(session, totals, frozen) {
  return {
    id: session.id,
    register: session.register?.name,
    unit: session.unit?.name,
    openedBy: session.openedBy?.name,
    closedBy: session.closedBy?.name || null,
    openedAt: session.openedAt,
    closedAt: session.closedAt,
    status: session.status,
    salesCount: totals?.salesCount || 0,
    salesTotal: money(totals?.salesTotal),
    salesCash: money(totals?.salesByMethod?.cash),
    supplies: money(totals?.supplies),
    bleeds: money(totals?.bleeds),
    refunds: money(totals?.refunds),
    expectedCash: money(totals?.expectedCash ?? session.expectedCash),
    countedCash: session.countedCash == null ? null : money(session.countedCash),
    difference: session.difference == null ? null : money(session.difference),
    frozen,
  };
}

async function listCashReport(params) {
  const range = optionalPeriod(params.from, params.to);
  const status = SESSION_STATUSES.has(params.status) ? params.status : 'all';
  const search = String(params.search || '').trim();
  const where = {
    companyId: params.companyId,
    ...params.unitFilter,
    ...(status !== 'all' && { status }),
    ...(range && { openedAt: { gte: range.from, lte: range.to } }),
    ...(search && {
      openedBy: { name: { contains: search, mode: 'insensitive' } },
    }),
  };

  const total = await prisma.cashSession.count({ where });
  const paging = paginationOf(params.page, params.limit, total);
  const sessions = await prisma.cashSession.findMany({
    where,
    include: {
      register: { select: { name: true } },
      unit: { select: { name: true } },
      openedBy: { select: { name: true } },
      closedBy: { select: { name: true } },
    },
    orderBy: { openedAt: 'desc' },
    skip: paging.skip,
    take: paging.limit,
  });

  const rows = [];
  for (const session of sessions) {
    if (session.status === 'closed') {
      rows.push(mapCashRow(session, session.totals || {}, true));
    } else {
      const totals = await computeSessionTotals(session.id);
      rows.push(mapCashRow(session, totals, false));
    }
  }

  const closedAgg = await prisma.cashSession.aggregate({
    where: { ...where, status: 'closed' },
    _sum: { expectedCash: true, countedCash: true, difference: true },
    _count: { _all: true },
  });

  return {
    rows,
    summary: {
      sessions: total,
      closedCount: closedAgg._count._all,
      expectedCash: money(closedAgg._sum.expectedCash),
      countedCash: money(closedAgg._sum.countedCash),
      difference: money(closedAgg._sum.difference),
    },
    pagination: paging,
    period: range,
  };
}

async function exportCashReport(params) {
  const counted = await listCashReport({ ...params, page: 1, limit: 1 });
  assertExportSize(counted.pagination.total);
  const full = await listCashReport({ ...params, page: 1, limit: EXPORT_MAX });
  const headers = [
    'sessao',
    'caixa',
    'unidade',
    'abriu',
    'fechou',
    'abertura',
    'fechamento',
    'status',
    'vendas',
    'vendas_em_dinheiro',
    'suprimentos',
    'sangrias',
    'refunds',
    'esperado',
    'contado',
    'diferenca',
    'fechamento_imutavel',
  ];
  const rows = full.rows.map((row) => ({
    sessao: row.id,
    caixa: row.register || '',
    unidade: row.unit || '',
    abriu: row.openedBy || '',
    fechou: row.closedBy || '',
    abertura: row.openedAt ? new Date(row.openedAt).toISOString() : '',
    fechamento: row.closedAt ? new Date(row.closedAt).toISOString() : '',
    status: row.status,
    vendas: row.salesTotal,
    vendas_em_dinheiro: row.salesCash,
    suprimentos: row.supplies,
    sangrias: row.bleeds,
    refunds: row.refunds,
    esperado: row.expectedCash,
    contado: row.countedCash == null ? '' : row.countedCash,
    diferenca: row.difference == null ? '' : row.difference,
    fechamento_imutavel: row.frozen ? 'sim' : 'nao',
  }));
  const csv = toCsv(headers, rows, [
    ['RESUMO', 'sessoes', 'esperado_fechado', 'contado', 'diferenca'],
    [
      '',
      full.summary.sessions,
      full.summary.expectedCash,
      full.summary.countedCash,
      full.summary.difference,
    ],
  ]);
  return csvResponse('relatorio-caixa.csv', csv);
}

async function listReportOptions({ companyId, unitFilter }) {
  const sellers = await prisma.user.findMany({
    where: {
      companyId,
      active: true,
      ...(unitFilter?.unitId
        ? {
            units: {
              some: { unitId: unitFilter.unitId },
            },
          }
        : {}),
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return { sellers };
}

module.exports = {
  ReportError,
  EXPORT_MAX,
  listSalesReport,
  exportSalesReport,
  listClientsReport,
  exportClientsReport,
  listProductsReport,
  exportProductsReport,
  listStockReport,
  exportStockReport,
  listSellersReport,
  exportSellersReport,
  listCashReport,
  exportCashReport,
  listReportOptions,
};
