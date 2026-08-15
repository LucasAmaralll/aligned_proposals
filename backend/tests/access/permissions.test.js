const {
  setupTenancy,
  createProduct,
  addVariant,
  addStock,
  sell,
  prisma,
} = require('../helpers');

describe('permissões por papel', () => {
  let world;
  let sizeM;
  let sizeG;

  beforeAll(async () => {
    world = await setupTenancy('permissions');
    const created = await createProduct(world.api.adminA, {
      name: 'Camisa Perm',
      sku: `PERM-M-${world.suffix}`,
      size: 'M',
      salePrice: 100,
    });
    sizeM = created.variant;
    sizeG = await addVariant(world.api.adminA, created.product.id, {
      sku: `PERM-G-${world.suffix}`,
      size: 'G',
      salePrice: 110,
    });
    await addStock(world.api.adminA, { variantId: sizeM.id, unitId: world.lojaA.id, quantity: 20 });
    await addStock(world.api.adminA, { variantId: sizeG.id, unitId: world.lojaA.id, quantity: 20 });
  });

  afterAll(async () => {
    await world.wipe();
  });

  test('vendedora pode vender, trocar, devolver e consultar estoque', async () => {
    const stock = await world.api.sellerA.get('/api/stock', { unitId: world.lojaA.id });
    expect(stock.status).toBe(200);

    const sale = await sell(world.api.sellerA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 2, unitPrice: 100 }],
    });
    expect(sale.status).toBe(201);

    const returned = await world.api.sellerA.post(`/api/sales/${sale.body.id}/returns`, {
      items: [{ saleItemId: sale.body.items[0].id, quantity: 1 }],
      reason: 'cliente devolveu um',
      method: 'cash',
    });
    expect(returned.status).toBe(201);

    const sale2 = await sell(world.api.sellerA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    expect(sale2.status).toBe(201);
    const exchanged = await world.api.sellerA.post(`/api/sales/${sale2.body.id}/exchanges`, {
      returnItems: [{ saleItemId: sale2.body.items[0].id, quantity: 1 }],
      newItems: [{ variantId: sizeG.id, quantity: 1, unitPrice: 110 }],
      reason: 'troca de tamanho',
      method: 'cash',
    });
    expect(exchanged.status).toBe(201);
  });

  test('vendedora não cancela, ajusta, transfere, dá desconto, altera produto nem acessa gastos', async () => {
    const sale = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    expect(sale.status).toBe(201);

    const cancel = await world.api.sellerA.post(`/api/sales/${sale.body.id}/cancel`, {
      reason: 'não pode',
    });
    expect(cancel.status).toBe(403);

    const adjust = await addStock(world.api.sellerA, {
      variantId: sizeM.id,
      unitId: world.lojaA.id,
      quantity: 1,
      type: 'adjust',
    });
    expect(adjust.status).toBe(403);

    const transfer = await world.api.sellerA.post('/api/stock/transfers', {
      variantId: sizeM.id,
      fromUnitId: world.lojaA.id,
      toUnitId: world.lojaB.id,
      quantity: 1,
    });
    expect(transfer.status).toBe(403);

    const discount = await sell(world.api.sellerA, {
      unitId: world.lojaA.id,
      discount: 10,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    expect(discount.status).toBe(403);

    const alter = await world.api.sellerA.put(`/api/catalog/variants/${sizeM.id}`, { salePrice: 1 });
    expect(alter.status).toBe(403);

    const expenses = await world.api.sellerA.get('/api/expenses');
    expect(expenses.status).toBe(403);
  });

  test('gerente pode dar desconto, ajustar, transferir entre unidades permitidas, cancelar e ver gastos da loja', async () => {
    const lojaC = await prisma.unit.create({
      data: {
        name: `Loja C ${world.suffix}`,
        type: 'store',
        companyId: world.companyA.id,
      },
    });
    await prisma.userUnit.create({
      data: { userId: world.users.managerA.id, unitId: lojaC.id },
    });

    const discounted = await sell(world.api.managerA, {
      unitId: world.lojaA.id,
      discount: 10,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    expect(discounted.status).toBe(201);
    expect(parseFloat(discounted.body.discount)).toBe(10);
    expect(parseFloat(discounted.body.total)).toBe(90);

    const adjust = await addStock(world.api.managerA, {
      variantId: sizeM.id,
      unitId: world.lojaA.id,
      quantity: 2,
      type: 'adjust',
    });
    expect(adjust.status).toBe(201);

    await addStock(world.api.adminA, {
      variantId: sizeM.id,
      unitId: world.lojaA.id,
      quantity: 3,
    });
    const transfer = await world.api.managerA.post('/api/stock/transfers', {
      variantId: sizeM.id,
      fromUnitId: world.lojaA.id,
      toUnitId: lojaC.id,
      quantity: 1,
    });
    expect(transfer.status).toBe(201);

    const transferBlocked = await world.api.managerA.post('/api/stock/transfers', {
      variantId: sizeM.id,
      fromUnitId: world.lojaA.id,
      toUnitId: world.lojaB.id,
      quantity: 1,
    });
    expect(transferBlocked.status).toBe(403);

    const cancelled = await world.api.managerA.post(`/api/sales/${discounted.body.id}/cancel`, {
      reason: 'gerente cancelou',
    });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe('cancelled');

    const expense = await world.api.managerA.post('/api/expenses', {
      description: 'luz da Loja A',
      amount: 25,
      category: 'utilities',
      unitId: world.lojaA.id,
    });
    expect(expense.status).toBe(201);

    const listed = await world.api.managerA.get('/api/expenses');
    expect(listed.status).toBe(200);
    expect((listed.body.expenses || []).some((item) => item.id === expense.body.id)).toBe(true);
  });

  test('admin opera Loja A e Loja B', async () => {
    await addStock(world.api.adminA, {
      variantId: sizeM.id,
      unitId: world.lojaB.id,
      quantity: 5,
    });
    const saleA = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    const saleB = await sell(world.api.adminA, {
      unitId: world.lojaB.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    expect(saleA.status).toBe(201);
    expect(saleB.status).toBe(201);
  });
});
