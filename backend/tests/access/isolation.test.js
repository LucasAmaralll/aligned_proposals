const {
  setupTenancy,
  createProduct,
  addStock,
  sell,
} = require('../helpers');

describe('isolamento entre empresas e lojas', () => {
  let world;
  let variantA;
  let productB;
  let variantB;
  let saleLojaB;
  let saleCompanyB;
  let expenseLojaB;
  let clientB;

  beforeAll(async () => {
    world = await setupTenancy('isolation');
    const createdA = await createProduct(world.api.adminA, {
      name: 'Peça Reveza',
      sku: `REV-${world.suffix}`,
      salePrice: 100,
    });
    variantA = createdA.variant;
    await addStock(world.api.adminA, {
      variantId: variantA.id,
      unitId: world.lojaA.id,
      quantity: 8,
    });
    await addStock(world.api.adminA, {
      variantId: variantA.id,
      unitId: world.lojaB.id,
      quantity: 5,
    });

    const createdB = await createProduct(world.api.adminB, {
      name: 'Peça Rezza',
      sku: `REZ-${world.suffix}`,
      salePrice: 70,
    });
    productB = createdB.product;
    variantB = createdB.variant;
    await addStock(world.api.adminB, {
      variantId: variantB.id,
      unitId: world.unitB.id,
      quantity: 4,
    });

    const saleB = await sell(world.api.adminA, {
      unitId: world.lojaB.id,
      items: [{ variantId: variantA.id, quantity: 1, unitPrice: 100 }],
    });
    expect(saleB.status).toBe(201);
    saleLojaB = saleB.body;

    const otherSale = await sell(world.api.adminB, {
      unitId: world.unitB.id,
      items: [{ variantId: variantB.id, quantity: 1, unitPrice: 70 }],
    });
    expect(otherSale.status).toBe(201);
    saleCompanyB = otherSale.body;

    const expense = await world.api.adminA.post('/api/expenses', {
      description: 'Aluguel Loja B',
      amount: 50,
      category: 'rent',
      unitId: world.lojaB.id,
    });
    expect(expense.status).toBe(201);
    expenseLojaB = expense.body;

    const client = await world.api.adminB.post('/api/clients', { name: 'Cliente Rezza' });
    expect(client.status).toBe(201);
    clientB = client.body;
  });

  afterAll(async () => {
    await world.wipe();
  });

  test('token da Reveza não consulta, altera, vende nem movimenta recurso da Rezza', async () => {
    const getProduct = await world.api.adminA.get(`/api/catalog/products/${productB.id}`);
    expect([403, 404]).toContain(getProduct.status);

    const alter = await world.api.adminA.put(`/api/catalog/products/${productB.id}`, { name: 'hack' });
    expect([403, 404]).toContain(alter.status);

    const sale = await world.api.adminA.get(`/api/sales/${saleCompanyB.id}`);
    expect([403, 404]).toContain(sale.status);

    const client = await world.api.adminA.get(`/api/clients/${clientB.id}`);
    expect([403, 404]).toContain(client.status);

    const sellOther = await sell(world.api.adminA, {
      unitId: world.unitB.id,
      items: [{ variantId: variantB.id, quantity: 1, unitPrice: 70 }],
    });
    expect([403, 404]).toContain(sellOther.status);

    const move = await addStock(world.api.adminA, {
      variantId: variantB.id,
      unitId: world.unitB.id,
      quantity: 1,
    });
    expect([403, 404]).toContain(move.status);

    const expenses = await world.api.adminA.get('/api/expenses');
    expect(expenses.status).toBe(200);
    expect((expenses.body.expenses || []).some((item) => item.description === 'Gasto Rezza')).toBe(false);
  });

  test('gerente acessa Loja A e é bloqueado na Loja B', async () => {
    const ownStock = await world.api.managerA.get('/api/stock', { unitId: world.lojaA.id });
    expect(ownStock.status).toBe(200);

    const otherStock = await world.api.managerA.get('/api/stock', { unitId: world.lojaB.id });
    expect(otherStock.status).toBe(403);

    const sellB = await sell(world.api.managerA, {
      unitId: world.lojaB.id,
      items: [{ variantId: variantA.id, quantity: 1, unitPrice: 100 }],
    });
    expect(sellB.status).toBe(403);

    const moveB = await addStock(world.api.managerA, {
      variantId: variantA.id,
      unitId: world.lojaB.id,
      quantity: 1,
    });
    expect(moveB.status).toBe(403);

    const transferFrom = await world.api.managerA.post('/api/stock/transfers', {
      variantId: variantA.id,
      fromUnitId: world.lojaB.id,
      toUnitId: world.lojaA.id,
      quantity: 1,
    });
    expect(transferFrom.status).toBe(403);

    const transferTo = await world.api.managerA.post('/api/stock/transfers', {
      variantId: variantA.id,
      fromUnitId: world.lojaA.id,
      toUnitId: world.lojaB.id,
      quantity: 1,
    });
    expect(transferTo.status).toBe(403);

    const sale = await world.api.managerA.get(`/api/sales/${saleLojaB.id}`);
    expect([403, 404]).toContain(sale.status);

    const expenses = await world.api.managerA.get('/api/expenses');
    expect(expenses.status).toBe(200);
    expect((expenses.body.expenses || []).map((item) => item.id)).not.toContain(expenseLojaB.id);

    const expenseB = await world.api.managerA.post('/api/expenses', {
      description: 'gasto ilegal',
      amount: 10,
      category: 'other',
      unitId: world.lojaB.id,
    });
    expect(expenseB.status).toBe(403);
  });

  test('admin opera as duas lojas da própria empresa', async () => {
    const saleA = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: variantA.id, quantity: 1, unitPrice: 100 }],
    });
    const saleB = await sell(world.api.adminA, {
      unitId: world.lojaB.id,
      items: [{ variantId: variantA.id, quantity: 1, unitPrice: 100 }],
    });
    expect(saleA.status).toBe(201);
    expect(saleB.status).toBe(201);

    const dashboard = await world.api.adminA.get('/api/reports/dashboard', {
      unitId: 'all',
      period: '30d',
    });
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.scope).toBe('company');
  });
});
