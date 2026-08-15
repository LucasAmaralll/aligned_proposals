const { setupTenancy, createProduct, addStock, sell, stockQty } = require('../helpers');

describe('cancelamento de venda', () => {
  let world;
  let variant;

  beforeAll(async () => {
    world = await setupTenancy('cancel');
    const created = await createProduct(world.api.adminA, {
      name: 'Calça',
      sku: `CALCA-${world.suffix}`,
      size: 'M',
      salePrice: 80,
    });
    variant = created.variant;
    await addStock(world.api.adminA, {
      variantId: variant.id,
      unitId: world.lojaA.id,
      quantity: 20,
    });
  });

  afterAll(async () => {
    await world.wipe();
  });

  async function sellOne(options = {}) {
    return sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: variant.id, quantity: 1, unitPrice: 80 }],
      ...options,
    });
  }

  test('cancela venda, restaura estoque e registra motivo/usuário/data', async () => {
    const before = await stockQty(variant.id, world.lojaA.id);
    const created = await sellOne();
    expect(created.status).toBe(201);
    expect(await stockQty(variant.id, world.lojaA.id)).toBe(before - 1);

    const cancelled = await world.api.adminA.post(`/api/sales/${created.body.id}/cancel`, {
      reason: 'Cliente desistiu',
    });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe('cancelled');
    expect(cancelled.body.cancelReason).toBe('Cliente desistiu');
    expect(cancelled.body.cancelledById).toBe(world.users.adminA.id);
    expect(cancelled.body.cancelledAt).toBeTruthy();
    expect(await stockQty(variant.id, world.lojaA.id)).toBe(before);

    const stored = await world.api.adminA.get(`/api/sales/${created.body.id}`);
    expect(stored.status).toBe(200);
    expect(stored.body.status).toBe('cancelled');
    expect(stored.body.id).toBe(created.body.id);

    const movements = await world.api.adminA.get('/api/stock/movements', {
      unitId: world.lojaA.id,
      variantId: variant.id,
      type: 'sale_cancel',
    });
    expect(movements.status).toBe(200);
    expect(movements.body.movements.some((item) => item.reference === created.body.id)).toBe(true);

    const again = await world.api.adminA.post(`/api/sales/${created.body.id}/cancel`, {
      reason: 'segunda tentativa',
    });
    expect(again.status).toBe(400);
    expect(again.body.error).toMatch(/já está cancelada/i);
  });

  test('não cancela venda com devolução', async () => {
    const created = await sellOne();
    const returned = await world.api.adminA.post(`/api/sales/${created.body.id}/returns`, {
      items: [{ saleItemId: created.body.items[0].id, quantity: 1 }],
      reason: 'não serviu',
      method: 'cash',
    });
    expect(returned.status).toBe(201);

    const cancelled = await world.api.adminA.post(`/api/sales/${created.body.id}/cancel`, {
      reason: 'tentativa após devolução',
    });
    expect(cancelled.status).toBe(400);
    expect(cancelled.body.error).toMatch(/troca ou devolução/i);
    expect(cancelled.body.status).not.toBe('cancelled');
  });

  test('não cancela venda com troca', async () => {
    const other = await createProduct(world.api.adminA, {
      name: 'Calça G',
      sku: `CALCA-G-${world.suffix}`,
      size: 'G',
      salePrice: 90,
    });
    await addStock(world.api.adminA, {
      variantId: other.variant.id,
      unitId: world.lojaA.id,
      quantity: 5,
    });

    const created = await sellOne();
    const exchanged = await world.api.adminA.post(`/api/sales/${created.body.id}/exchanges`, {
      returnItems: [{ saleItemId: created.body.items[0].id, quantity: 1 }],
      newItems: [{ variantId: other.variant.id, quantity: 1, unitPrice: 90 }],
      reason: 'trocou tamanho',
      method: 'cash',
    });
    expect(exchanged.status).toBe(201);

    const cancelled = await world.api.adminA.post(`/api/sales/${created.body.id}/cancel`, {
      reason: 'tentativa após troca',
    });
    expect(cancelled.status).toBe(400);
    expect(cancelled.body.error).toMatch(/troca ou devolução/i);
  });

  test('não cancela venda com envio despachado', async () => {
    const created = await sellOne({
      ship: true,
      shipping: { recipientName: 'Maria Teste', city: 'Curitiba', state: 'PR' },
    });
    expect(created.status).toBe(201);
    const shipmentId = created.body.shipments[0].id;

    const shipped = await world.api.adminA.post(`/api/shipments/${shipmentId}/ship`, {
      trackingCode: 'BR123',
    });
    expect(shipped.status).toBe(200);
    expect(shipped.body.status).toBe('shipped');

    const cancelled = await world.api.adminA.post(`/api/sales/${created.body.id}/cancel`, {
      reason: 'já foi enviado',
    });
    expect(cancelled.status).toBe(400);
    expect(cancelled.body.error).toMatch(/envio já foi despachado/i);
  });
});
