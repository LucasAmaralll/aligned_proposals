const { setupTenancy, createProduct, addVariant, addStock, sell, stockQty } = require('../helpers');

describe('troca', () => {
  let world;
  let product;
  let sizeM;
  let sizeGExpensive;
  let sizeGCheap;

  beforeAll(async () => {
    world = await setupTenancy('exchange');
    const created = await createProduct(world.api.adminA, {
      name: 'Camisa',
      sku: `CAM-M-${world.suffix}`,
      size: 'M',
      salePrice: 100,
    });
    product = created.product;
    sizeM = created.variant;
    sizeGExpensive = await addVariant(world.api.adminA, product.id, {
      sku: `CAM-G-${world.suffix}`,
      size: 'G',
      salePrice: 130,
    });
    sizeGCheap = await addVariant(world.api.adminA, product.id, {
      sku: `CAM-G2-${world.suffix}`,
      size: 'G',
      color: 'Branco',
      salePrice: 80,
    });

    await addStock(world.api.adminA, { variantId: sizeM.id, unitId: world.lojaA.id, quantity: 10 });
    await addStock(world.api.adminA, {
      variantId: sizeGExpensive.id,
      unitId: world.lojaA.id,
      quantity: 10,
    });
    await addStock(world.api.adminA, { variantId: sizeGCheap.id, unitId: world.lojaA.id, quantity: 10 });
  });

  afterAll(async () => {
    await world.wipe();
  });

  test('troca M → G mais cara: M entra, G sai e diferença é cobrada', async () => {
    const mBefore = await stockQty(sizeM.id, world.lojaA.id);
    const gBefore = await stockQty(sizeGExpensive.id, world.lojaA.id);

    const sale = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    expect(sale.status).toBe(201);

    const exchanged = await world.api.adminA.post(`/api/sales/${sale.body.id}/exchanges`, {
      returnItems: [{ saleItemId: sale.body.items[0].id, quantity: 1 }],
      newItems: [{ variantId: sizeGExpensive.id, quantity: 1, unitPrice: 130 }],
      reason: 'quer tamanho G',
      method: 'cash',
    });
    expect(exchanged.status).toBe(201);
    expect(parseFloat(exchanged.body.difference)).toBe(30);
    expect(await stockQty(sizeM.id, world.lojaA.id)).toBe(mBefore);
    expect(await stockQty(sizeGExpensive.id, world.lojaA.id)).toBe(gBefore - 1);

    const again = await world.api.adminA.post(`/api/sales/${sale.body.id}/exchanges`, {
      returnItems: [{ saleItemId: sale.body.items[0].id, quantity: 1 }],
      newItems: [{ variantId: sizeGExpensive.id, quantity: 1, unitPrice: 130 }],
      reason: 'segunda troca',
      method: 'cash',
    });
    expect(again.status).toBe(400);
    expect(again.body.error).toMatch(/só restam/i);
  });

  test('troca M → G mais barata: diferença negativa (crédito)', async () => {
    const mBefore = await stockQty(sizeM.id, world.lojaA.id);
    const gBefore = await stockQty(sizeGCheap.id, world.lojaA.id);

    const sale = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    expect(sale.status).toBe(201);

    const exchanged = await world.api.adminA.post(`/api/sales/${sale.body.id}/exchanges`, {
      returnItems: [{ saleItemId: sale.body.items[0].id, quantity: 1 }],
      newItems: [{ variantId: sizeGCheap.id, quantity: 1, unitPrice: 80 }],
      reason: 'quer peça mais barata',
      method: 'cash',
    });
    expect(exchanged.status).toBe(201);
    expect(parseFloat(exchanged.body.difference)).toBe(-20);
    expect(await stockQty(sizeM.id, world.lojaA.id)).toBe(mBefore);
    expect(await stockQty(sizeGCheap.id, world.lojaA.id)).toBe(gBefore - 1);
  });
});
