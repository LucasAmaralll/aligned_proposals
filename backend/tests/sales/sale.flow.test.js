const { setupTenancy, createProduct, addStock, sell, stockQty } = require('../helpers');

describe('vendas', () => {
  let world;
  let variant;

  beforeAll(async () => {
    world = await setupTenancy('sales');
    const created = await createProduct(world.api.adminA, {
      name: 'Camisa Polo',
      sku: `POLO-${world.suffix}`,
      size: 'M',
      color: 'Azul',
      salePrice: 120,
    });
    variant = created.variant;
  });

  afterAll(async () => {
    await world.wipe();
  });

  test('cria venda, baixa estoque e guarda snapshot de produto/preço', async () => {
    const entry = await addStock(world.api.adminA, {
      variantId: variant.id,
      unitId: world.lojaA.id,
      quantity: 10,
    });
    expect(entry.status).toBe(201);
    expect(await stockQty(variant.id, world.lojaA.id)).toBe(10);

    const res = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: variant.id, quantity: 2, unitPrice: 120 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('completed');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].sku).toBe(variant.sku);
    expect(res.body.items[0].productName).toBe('Camisa Polo');
    expect(res.body.items[0].size).toBe('M');
    expect(res.body.items[0].color).toBe('Azul');
    expect(parseFloat(res.body.items[0].unitPrice)).toBe(120);
    expect(parseFloat(res.body.total)).toBe(240);
    expect(await stockQty(variant.id, world.lojaA.id)).toBe(8);
  });

  test('estoque insuficiente não cria venda nem altera saldo', async () => {
    const before = await stockQty(variant.id, world.lojaA.id);
    const listed = await world.api.adminA.get('/api/sales');
    const countBefore = listed.body.pagination.total;

    const res = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: variant.id, quantity: before + 5, unitPrice: 120 }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/estoque insuficiente/i);

    const listedAfter = await world.api.adminA.get('/api/sales');
    expect(listedAfter.body.pagination.total).toBe(countBefore);
    expect(await stockQty(variant.id, world.lojaA.id)).toBe(before);
  });
});
