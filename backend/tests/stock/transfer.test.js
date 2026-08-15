const { setupTenancy, createProduct, addStock, stockQty } = require('../helpers');

describe('transferência de estoque', () => {
  let world;
  let variant;

  beforeAll(async () => {
    world = await setupTenancy('transfer');
    const created = await createProduct(world.api.adminA, {
      name: 'Moletom',
      sku: `MOL-${world.suffix}`,
      size: 'G',
      salePrice: 150,
    });
    variant = created.variant;
  });

  afterAll(async () => {
    await world.wipe();
  });

  test('transfere da Loja A para a Loja B e registra as duas movimentações', async () => {
    const entry = await addStock(world.api.adminA, {
      variantId: variant.id,
      unitId: world.lojaA.id,
      quantity: 10,
    });
    expect(entry.status).toBe(201);
    expect(await stockQty(variant.id, world.lojaA.id)).toBe(10);
    expect(await stockQty(variant.id, world.lojaB.id)).toBe(0);

    const transfer = await world.api.adminA.post('/api/stock/transfers', {
      variantId: variant.id,
      fromUnitId: world.lojaA.id,
      toUnitId: world.lojaB.id,
      quantity: 4,
      reason: 'reposicao',
    });
    expect(transfer.status).toBe(201);
    expect(await stockQty(variant.id, world.lojaA.id)).toBe(6);
    expect(await stockQty(variant.id, world.lojaB.id)).toBe(4);

    const outgoing = await world.api.adminA.get('/api/stock/movements', {
      unitId: world.lojaA.id,
      variantId: variant.id,
      type: 'transfer_out',
    });
    const incoming = await world.api.adminA.get('/api/stock/movements', {
      unitId: world.lojaB.id,
      variantId: variant.id,
      type: 'transfer_in',
    });
    expect(outgoing.status).toBe(200);
    expect(incoming.status).toBe(200);
    expect(outgoing.body.movements.some((item) => parseFloat(item.quantity) === 4)).toBe(true);
    expect(incoming.body.movements.some((item) => parseFloat(item.quantity) === 4)).toBe(true);
    expect(outgoing.body.movements[0].reference).toBe(incoming.body.movements[0].reference);
  });
});
