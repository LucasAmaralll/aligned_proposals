const { setupTenancy, createProduct, addStock, sell, stockQty } = require('../helpers');

describe('devolução', () => {
  let world;
  let variant;

  beforeAll(async () => {
    world = await setupTenancy('return');
    const created = await createProduct(world.api.adminA, {
      name: 'Jaqueta',
      sku: `JKT-${world.suffix}`,
      size: 'M',
      salePrice: 200,
    });
    variant = created.variant;
    await addStock(world.api.adminA, {
      variantId: variant.id,
      unitId: world.lojaA.id,
      quantity: 15,
    });
  });

  afterAll(async () => {
    await world.wipe();
  });

  test('devolução total devolve estoque e impede nova devolução da mesma quantidade', async () => {
    const before = await stockQty(variant.id, world.lojaA.id);
    const sale = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: variant.id, quantity: 2, unitPrice: 200 }],
    });
    expect(sale.status).toBe(201);
    expect(await stockQty(variant.id, world.lojaA.id)).toBe(before - 2);

    const returned = await world.api.adminA.post(`/api/sales/${sale.body.id}/returns`, {
      items: [{ saleItemId: sale.body.items[0].id, quantity: 2 }],
      reason: 'desistência',
      method: 'cash',
    });
    expect(returned.status).toBe(201);
    expect(parseFloat(returned.body.refundAmount)).toBe(400);
    expect(await stockQty(variant.id, world.lojaA.id)).toBe(before);

    const again = await world.api.adminA.post(`/api/sales/${sale.body.id}/returns`, {
      items: [{ saleItemId: sale.body.items[0].id, quantity: 2 }],
      reason: 'segunda devolução',
      method: 'cash',
    });
    expect(again.status).toBe(400);
    expect(again.body.error).toMatch(/só restam/i);
  });

  test('devolução parcial devolve só a quantidade informada', async () => {
    const before = await stockQty(variant.id, world.lojaA.id);
    const sale = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: variant.id, quantity: 3, unitPrice: 200 }],
    });
    expect(sale.status).toBe(201);

    const returned = await world.api.adminA.post(`/api/sales/${sale.body.id}/returns`, {
      items: [{ saleItemId: sale.body.items[0].id, quantity: 1 }],
      reason: 'um item com defeito',
      method: 'cash',
    });
    expect(returned.status).toBe(201);
    expect(parseFloat(returned.body.refundAmount)).toBe(200);
    expect(await stockQty(variant.id, world.lojaA.id)).toBe(before - 2);

    const detail = await world.api.adminA.get(`/api/sales/${sale.body.id}`);
    expect(detail.status).toBe(200);
    expect(parseFloat(detail.body.items[0].remainingQuantity)).toBe(2);
  });
});
