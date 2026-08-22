const {
  setupTenancy,
  createProduct,
  addStock,
  sell,
  stockQty,
  closeCashSession,
  openCashSession,
  currentCash,
} = require('../helpers');

function localYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function period() {
  const now = new Date();
  return {
    from: localYmd(now),
    to: localYmd(now),
  };
}

describe('relatórios operacionais', () => {
  let world;
  let variant;
  let client;
  const dates = period();

  beforeAll(async () => {
    world = await setupTenancy('reports');
    const created = await createProduct(world.api.adminA, {
      name: 'Peça Relatório',
      sku: `REL-${world.suffix}`,
      salePrice: 100,
    });
    variant = created.variant;
    await addStock(world.api.adminA, {
      variantId: variant.id,
      unitId: world.lojaA.id,
      quantity: 40,
    });
    await addStock(world.api.adminA, {
      variantId: variant.id,
      unitId: world.lojaB.id,
      quantity: 10,
    });
    const clientRes = await world.api.adminA.post('/api/clients', {
      name: 'Cliente Relatório',
      document: '12345678901',
      phone: '41999990000',
    });
    expect(clientRes.status).toBe(201);
    client = clientRes.body;
  });

  afterAll(async () => {
    await world.wipe();
  });

  function salesQuery(extra = {}) {
    return {
      from: dates.from,
      to: dates.to,
      unitId: world.lojaA.id,
      ...extra,
    };
  }

  test('isolamento: empresa A não lê vendas nem export da empresa B', async () => {
    const createdB = await createProduct(world.api.adminB, {
      name: 'Peça B',
      sku: `RELB-${world.suffix}`,
      salePrice: 70,
    });
    await addStock(world.api.adminB, {
      variantId: createdB.variant.id,
      unitId: world.unitB.id,
      quantity: 5,
    });
    const saleB = await sell(world.api.adminB, {
      unitId: world.unitB.id,
      items: [{ variantId: createdB.variant.id, quantity: 1, unitPrice: 70 }],
    });
    expect(saleB.status).toBe(201);

    const listed = await world.api.adminA.get('/api/reports/sales', salesQuery());
    expect(listed.status).toBe(200);
    expect((listed.body.rows || []).some((row) => row.id === saleB.body.id)).toBe(false);

    const exported = await world.api.adminA.get('/api/reports/sales/export', salesQuery());
    expect(exported.status).toBe(200);
    expect(exported.text).not.toContain(`RELB-${world.suffix}`);
    expect(exported.headers['content-type']).toMatch(/csv/);
    expect(exported.text.charCodeAt(0)).toBe(0xfeff);
    expect(exported.text.includes(';')).toBe(true);
  });

  test('gerente não vê a outra loja; unitId=all não inclui Loja B', async () => {
    const blocked = await world.api.managerA.get('/api/reports/sales', {
      ...salesQuery(),
      unitId: world.lojaB.id,
    });
    expect(blocked.status).toBe(403);

    await addStock(world.api.adminA, {
      variantId: variant.id,
      unitId: world.lojaB.id,
      quantity: 1,
    });
    const saleB = await sell(world.api.adminA, {
      unitId: world.lojaB.id,
      items: [{ variantId: variant.id, quantity: 1, unitPrice: 100 }],
    });
    expect(saleB.status).toBe(201);

    const all = await world.api.managerA.get('/api/reports/sales', {
      from: dates.from,
      to: dates.to,
      unitId: 'all',
    });
    expect(all.status).toBe(200);
    expect((all.body.rows || []).some((row) => row.id === saleB.body.id)).toBe(false);
  });

  test('vendedora só vê as próprias vendas e não consulta ranking de vendedores', async () => {
    const own = await sell(world.api.sellerA, {
      unitId: world.lojaA.id,
      items: [{ variantId: variant.id, quantity: 1, unitPrice: 100 }],
    });
    expect(own.status).toBe(201);
    const other = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: variant.id, quantity: 1, unitPrice: 100 }],
    });
    expect(other.status).toBe(201);

    const listed = await world.api.sellerA.get('/api/reports/sales', salesQuery());
    expect(listed.status).toBe(200);
    expect((listed.body.rows || []).some((row) => row.id === own.body.id)).toBe(true);
    expect((listed.body.rows || []).some((row) => row.id === other.body.id)).toBe(false);

    const ranking = await world.api.sellerA.get('/api/reports/sellers', salesQuery());
    expect(ranking.status).toBe(403);

    const rankingExport = await world.api.sellerA.get('/api/reports/sellers/export', salesQuery());
    expect(rankingExport.status).toBe(403);
  });

  test('venda cancelada é consultável e não entra no bruto', async () => {
    const created = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: variant.id, quantity: 1, unitPrice: 100 }],
    });
    expect(created.status).toBe(201);

    const before = await world.api.adminA.get('/api/reports/sales', salesQuery());
    expect(before.status).toBe(200);
    const grossBefore = parseFloat(before.body.summary.gross);

    const cancelled = await world.api.adminA.post(`/api/sales/${created.body.id}/cancel`, {
      reason: 'teste relatório',
    });
    expect(cancelled.status).toBe(200);

    const after = await world.api.adminA.get('/api/reports/sales', salesQuery());
    expect(after.status).toBe(200);
    expect(parseFloat(after.body.summary.gross)).toBe(grossBefore - 100);
    expect((after.body.rows || []).some((row) => row.id === created.body.id)).toBe(false);

    const all = await world.api.adminA.get('/api/reports/sales', {
      ...salesQuery(),
      status: 'all',
    });
    expect((all.body.rows || []).some((row) => row.id === created.body.id)).toBe(true);
    expect(parseFloat(all.body.summary.gross)).toBe(parseFloat(after.body.summary.gross));

    const onlyCancelled = await world.api.adminA.get('/api/reports/sales', {
      ...salesQuery(),
      status: 'cancelled',
    });
    expect((onlyCancelled.body.rows || []).some((row) => row.id === created.body.id)).toBe(true);
  });

  test('devolução no período reduz o líquido sem apagar a venda', async () => {
    const created = await world.api.adminA.post('/api/sales', {
      unitId: world.lojaA.id,
      clientId: client.id,
      items: [{ variantId: variant.id, quantity: 1, unitPrice: 100 }],
      payments: [{ method: 'cash', amount: 100 }],
    });
    expect(created.status).toBe(201);

    const before = await world.api.adminA.get('/api/reports/sales', salesQuery());
    const netBefore = parseFloat(before.body.summary.net);

    const returned = await world.api.adminA.post(`/api/sales/${created.body.id}/returns`, {
      items: [{ saleItemId: created.body.items[0].id, quantity: 1 }],
      reason: 'relatório',
      method: 'cash',
    });
    expect(returned.status).toBe(201);

    const after = await world.api.adminA.get('/api/reports/sales', salesQuery());
    expect(parseFloat(after.body.summary.net)).toBe(netBefore - 100);
    expect((after.body.rows || []).some((row) => row.id === created.body.id)).toBe(true);

    const sellers = await world.api.adminA.get('/api/reports/sellers', salesQuery());
    expect(sellers.status).toBe(200);
    expect(parseFloat(sellers.body.summary.net || sellers.body.summary.revenueNet)).toBe(
      parseFloat(after.body.summary.net)
    );
  });

  test('caixa fechado permanece no snapshot depois de refund posterior', async () => {
    const current = await currentCash(world.api.adminA, world.lojaA.id);
    expect(current.body.session).toBeTruthy();
    const live = await world.api.adminA.get(`/api/cash/sessions/${current.body.session.id}/preview`);
    const expected = parseFloat(live.body.totals.expectedCash);
    const closed = await closeCashSession(world.api.adminA, current.body.session.id, expected);
    expect(closed.status).toBe(200);

    const sale = await (async () => {
      await openCashSession(world.api.adminA, world.lojaA.id, 10);
      return sell(world.api.adminA, {
        unitId: world.lojaA.id,
        items: [{ variantId: variant.id, quantity: 1, unitPrice: 100 }],
      });
    })();
    expect(sale.status).toBe(201);
    await world.api.adminA.post(`/api/sales/${sale.body.id}/returns`, {
      items: [{ saleItemId: sale.body.items[0].id, quantity: 1 }],
      reason: 'depois do fechamento',
      method: 'cash',
    });

    const report = await world.api.adminA.get('/api/reports/cash', {
      from: dates.from,
      to: dates.to,
      unitId: world.lojaA.id,
      status: 'closed',
    });
    expect(report.status).toBe(200);
    const row = (report.body.rows || []).find((item) => item.id === closed.body.id);
    expect(row).toBeTruthy();
    expect(row.frozen).toBe(true);
    expect(parseFloat(row.expectedCash)).toBe(expected);
  });

  test('venda no pix entra nas vendas da sessão sem mexer no dinheiro esperado', async () => {
    const running = await currentCash(world.api.adminA, world.lojaB.id);
    if (running.body.session) {
      const preview = await world.api.adminA.get(
        `/api/cash/sessions/${running.body.session.id}/preview`
      );
      await closeCashSession(
        world.api.adminA,
        running.body.session.id,
        parseFloat(preview.body.totals.expectedCash)
      );
    }

    const opened = await openCashSession(world.api.adminA, world.lojaB.id, 500);

    await addStock(world.api.adminA, {
      variantId: variant.id,
      unitId: world.lojaB.id,
      quantity: 1,
    });
    const sale = await world.api.adminA.post('/api/sales', {
      unitId: world.lojaB.id,
      items: [{ variantId: variant.id, quantity: 1, unitPrice: 100 }],
      payments: [{ method: 'pix', amount: 100 }],
    });
    expect(sale.status).toBe(201);

    const closed = await closeCashSession(world.api.adminA, opened.id, 500);
    expect(closed.status).toBe(200);

    const report = await world.api.adminA.get('/api/reports/cash', {
      from: dates.from,
      to: dates.to,
      unitId: world.lojaB.id,
      status: 'closed',
    });
    expect(report.status).toBe(200);
    const row = (report.body.rows || []).find((item) => item.id === opened.id);
    expect(row).toBeTruthy();
    expect(parseFloat(row.salesTotal)).toBe(100);
    expect(parseFloat(row.salesCash)).toBe(0);
    expect(parseFloat(row.expectedCash)).toBe(500);
    expect(parseFloat(row.difference)).toBe(0);
    expect(row.closedBy).toBeTruthy();
  });

  test('resumo de vendas expõe as parcelas que formam o líquido', async () => {
    const listed = await world.api.adminA.get('/api/reports/sales', salesQuery());
    expect(listed.status).toBe(200);
    const { gross, refunds, exchangeDiff, net } = listed.body.summary;
    expect(parseFloat(net)).toBe(
      parseFloat(gross) - parseFloat(refunds) + parseFloat(exchangeDiff)
    );
    expect(listed.body.summary.returnsCount).toBeGreaterThanOrEqual(0);
    expect(listed.body.summary.exchangesCount).toBeGreaterThanOrEqual(0);
  });

  test('export usa os mesmos filtros da consulta e CSV com ponto e vírgula', async () => {
    const listed = await world.api.adminA.get('/api/reports/sales', salesQuery());
    expect(listed.status).toBe(200);
    const ids = (listed.body.rows || []).map((row) => row.id).sort();

    const exported = await world.api.adminA.get('/api/reports/sales/export', salesQuery());
    expect(exported.status).toBe(200);
    expect(exported.text).toContain(';');
    expect(exported.text).toMatch(/RESUMO/);
    for (const row of listed.body.rows || []) {
      expect(exported.text).toContain(String(row.number));
    }
    expect(ids.length).toBeGreaterThan(0);
  });

  test('summary permanece estável entre páginas', async () => {
    const page1 = await world.api.adminA.get('/api/reports/sales', { ...salesQuery(), page: 1, limit: 1 });
    const page2 = await world.api.adminA.get('/api/reports/sales', { ...salesQuery(), page: 2, limit: 1 });
    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    expect(page1.body.rows).toHaveLength(1);
    expect(parseFloat(page1.body.summary.gross)).toBe(parseFloat(page2.body.summary.gross));
    expect(page1.body.pagination.total).toBe(page2.body.pagination.total);
  });

  test('clientes, produtos, estoque e caixa respondem com paginação', async () => {
    const clients = await world.api.adminA.get('/api/reports/clients', salesQuery());
    expect(clients.status).toBe(200);
    expect(clients.body.pagination).toBeTruthy();
    expect((clients.body.rows || []).some((row) => row.id === client.id)).toBe(true);

    const products = await world.api.adminA.get('/api/reports/products', salesQuery());
    expect(products.status).toBe(200);
    expect(products.body.pagination).toBeTruthy();

    const stock = await world.api.adminA.get('/api/reports/stock', {
      unitId: world.lojaA.id,
      from: dates.from,
      to: dates.to,
    });
    expect(stock.status).toBe(200);
    expect(stock.body.rows.some((row) => row.sku === variant.sku)).toBe(true);
    expect(await stockQty(variant.id, world.lojaA.id)).toBeGreaterThanOrEqual(0);

    const cash = await world.api.adminA.get('/api/reports/cash', {
      from: dates.from,
      to: dates.to,
      unitId: world.lojaA.id,
    });
    expect(cash.status).toBe(200);
    expect(cash.body.pagination).toBeTruthy();
  });

  test('descontos de item e venda somam em número, não concatenam Decimal', async () => {
    const before = await world.api.adminA.get('/api/reports/sales', salesQuery());
    expect(before.status).toBe(200);
    const discountBefore = parseFloat(before.body.summary.discountTotal);

    const created = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      discount: 30,
      items: [{ variantId: variant.id, quantity: 1, unitPrice: 100, discount: 20 }],
    });
    expect(created.status).toBe(201);

    const after = await world.api.adminA.get('/api/reports/sales', salesQuery());
    expect(after.status).toBe(200);
    expect(parseFloat(after.body.summary.discountTotal)).toBe(discountBefore + 50);

    const today = localYmd(new Date());
    const sameDay = await world.api.adminA.get('/api/reports/sales', {
      from: today,
      to: today,
      unitId: world.lojaA.id,
    });
    expect(sameDay.status).toBe(200);
    expect((sameDay.body.rows || []).some((row) => row.id === created.body.id)).toBe(true);
  });

  test('dashboard existente continua disponível', async () => {
    const dashboard = await world.api.adminA.get('/api/reports/dashboard', {
      period: 'month',
      unitId: world.lojaA.id,
    });
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.summary).toBeTruthy();
    expect(dashboard.body.byDay).toBeTruthy();
  });
});
