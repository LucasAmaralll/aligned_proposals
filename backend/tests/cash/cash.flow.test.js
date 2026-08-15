const {
  setupTenancy,
  createProduct,
  addVariant,
  addStock,
  sell,
  stockQty,
  openCashSession,
  closeCashSession,
  currentCash,
  prisma,
} = require('../helpers');

function money(value) {
  return Math.round(parseFloat(value || 0) * 100) / 100;
}

describe('caixa', () => {
  let world;
  let product;
  let sizeM;
  let sizeGExpensive;
  let sizeGCheap;

  beforeAll(async () => {
    world = await setupTenancy('cash');
    const created = await createProduct(world.api.adminA, {
      name: 'Peça Caixa',
      sku: `CX-M-${world.suffix}`,
      size: 'M',
      salePrice: 100,
    });
    product = created.product;
    sizeM = created.variant;
    sizeGExpensive = await addVariant(world.api.adminA, product.id, {
      sku: `CX-G-${world.suffix}`,
      size: 'G',
      salePrice: 130,
    });
    sizeGCheap = await addVariant(world.api.adminA, product.id, {
      sku: `CX-G2-${world.suffix}`,
      size: 'G',
      color: 'Branco',
      salePrice: 80,
    });
    await addStock(world.api.adminA, { variantId: sizeM.id, unitId: world.lojaA.id, quantity: 50 });
    await addStock(world.api.adminA, {
      variantId: sizeGExpensive.id,
      unitId: world.lojaA.id,
      quantity: 20,
    });
    await addStock(world.api.adminA, { variantId: sizeGCheap.id, unitId: world.lojaA.id, quantity: 20 });
  });

  afterAll(async () => {
    await world.wipe();
  });

  async function preview(sessionId, api = world.api.adminA) {
    return api.get(`/api/cash/sessions/${sessionId}/preview`);
  }

  async function ensureOpen(unitId = world.lojaA.id) {
    const current = await currentCash(world.api.adminA, unitId);
    if (current.body.session) return current.body.session;
    return openCashSession(world.api.adminA, unitId, 100);
  }

  test('abrir sessão, vender em dinheiro, vincular cashSessionId e conferir preview', async () => {
    const session = await ensureOpen();
    const before = await stockQty(sizeM.id, world.lojaA.id);
    const sale = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    expect(sale.status).toBe(201);
    expect(sale.body.cashSessionId).toBe(session.id);
    expect(await stockQty(sizeM.id, world.lojaA.id)).toBe(before - 1);

    const shown = await preview(session.id);
    expect(shown.status).toBe(200);
    expect(shown.body.frozen).toBe(false);
    expect(money(shown.body.totals.salesByMethod.cash)).toBeGreaterThanOrEqual(100);
    expect(money(shown.body.totals.expectedCash)).toBe(
      money(shown.body.totals.openingAmount + shown.body.totals.salesByMethod.cash + shown.body.totals.supplies - shown.body.totals.bleeds - shown.body.totals.refunds + shown.body.totals.exchangesInByMethod.cash)
    );
  });

  test('segunda abertura no mesmo caixa retorna 400', async () => {
    await ensureOpen();
    const again = await world.api.adminA.post('/api/cash/sessions/open', {
      unitId: world.lojaA.id,
      openingAmount: 50,
    });
    expect(again.status).toBe(400);
    expect(again.body.error).toMatch(/já existe uma sessão aberta/i);
  });

  test('PDV sem sessão retorna 400; e-commerce sem sessão retorna 201', async () => {
    const current = await currentCash(world.api.adminA, world.lojaA.id);
    if (current.body.session) {
      const closed = await closeCashSession(
        world.api.adminA,
        current.body.session.id,
        money(current.body.totals.expectedCash)
      );
      expect(closed.status).toBe(200);
    }

    const pos = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    expect(pos.status).toBe(400);
    expect(pos.body.error).toMatch(/abra o caixa/i);

    const ecommerce = await world.api.adminA.post('/api/sales', {
      unitId: world.lojaA.id,
      origin: 'ecommerce',
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
      payments: [{ method: 'pix', amount: 100 }],
    });
    expect(ecommerce.status).toBe(201);
    expect(ecommerce.body.origin).toBe('ecommerce');
    expect(ecommerce.body.cashSessionId).toBeFalsy();

    await openCashSession(world.api.adminA, world.lojaA.id, 100);
  });

  test('venda mista cash+PIX: breakdown separado e esperado só o cash', async () => {
    const session = await ensureOpen();
    const before = await preview(session.id);
    const sale = await world.api.adminA.post('/api/sales', {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
      payments: [
        { method: 'cash', amount: 40 },
        { method: 'pix', amount: 60 },
      ],
    });
    expect(sale.status).toBe(201);

    const after = await preview(session.id);
    expect(money(after.body.totals.salesByMethod.cash)).toBe(money(before.body.totals.salesByMethod.cash + 40));
    expect(money(after.body.totals.salesByMethod.pix)).toBe(money(before.body.totals.salesByMethod.pix + 60));
    expect(money(after.body.totals.expectedCash)).toBe(money(before.body.totals.expectedCash + 40));
  });

  test('suprimento e sangria alteram o esperado', async () => {
    const session = await ensureOpen();
    const before = await preview(session.id);

    const supply = await world.api.adminA.post(`/api/cash/sessions/${session.id}/supply`, {
      amount: 50,
      reason: 'troco',
    });
    expect(supply.status).toBe(201);
    expect(money(supply.body.totals.expectedCash)).toBe(money(before.body.totals.expectedCash + 50));

    const bleed = await world.api.adminA.post(`/api/cash/sessions/${session.id}/bleed`, {
      amount: 20,
      reason: 'cofre',
    });
    expect(bleed.status).toBe(201);
    expect(money(bleed.body.totals.expectedCash)).toBe(money(before.body.totals.expectedCash + 50 - 20));
    expect(money(bleed.body.totals.bleeds)).toBe(money(before.body.totals.bleeds + 20));
    expect(money(bleed.body.totals.refunds)).toBe(money(before.body.totals.refunds));
  });

  test('cancelar na sessão aberta some do esperado e não gera refund', async () => {
    const session = await ensureOpen();
    const sale = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    const afterSale = await preview(session.id);

    const cancelled = await world.api.adminA.post(`/api/sales/${sale.body.id}/cancel`, {
      reason: 'desistiu na hora',
    });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe('cancelled');

    const afterCancel = await preview(session.id);
    expect(money(afterCancel.body.totals.expectedCash)).toBe(money(afterSale.body.totals.expectedCash - 100));
    expect(afterCancel.body.session.movements.filter((item) => item.type === 'refund')).toHaveLength(
      (afterSale.body.session.movements || []).filter((item) => item.type === 'refund').length
    );
  });

  test('devolução em dinheiro reduz esperado e impede devolver a mesma quantidade de novo', async () => {
    const session = await ensureOpen();
    const sale = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    const before = await preview(session.id);

    const returned = await world.api.adminA.post(`/api/sales/${sale.body.id}/returns`, {
      items: [{ saleItemId: sale.body.items[0].id, quantity: 1 }],
      reason: 'não serviu',
      method: 'cash',
    });
    expect(returned.status).toBe(201);
    expect(returned.body.cashSessionId).toBe(session.id);

    const after = await preview(session.id);
    expect(money(after.body.totals.expectedCash)).toBe(money(before.body.totals.expectedCash - 100));
    expect(money(after.body.totals.refunds)).toBe(money(before.body.totals.refunds + 100));
    expect(money(after.body.totals.returnsByMethod.cash)).toBe(money(before.body.totals.returnsByMethod.cash + 100));

    const refund = after.body.session.movements.find(
      (item) => item.type === 'refund' && item.referenceId === returned.body.id
    );
    expect(refund).toBeTruthy();
    expect(refund.referenceType).toBe('return');

    const again = await world.api.adminA.post(`/api/sales/${sale.body.id}/returns`, {
      items: [{ saleItemId: sale.body.items[0].id, quantity: 1 }],
      reason: 'segunda',
      method: 'cash',
    });
    expect(again.status).toBe(400);
    expect(again.body.error).toMatch(/só restam/i);
  });

  test('troca +30 cash entra no esperado; troca −20 cash sai como refund', async () => {
    const session = await ensureOpen();
    const saleIn = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    const beforeIn = await preview(session.id);
    const plus = await world.api.adminA.post(`/api/sales/${saleIn.body.id}/exchanges`, {
      returnItems: [{ saleItemId: saleIn.body.items[0].id, quantity: 1 }],
      newItems: [{ variantId: sizeGExpensive.id, quantity: 1, unitPrice: 130 }],
      reason: 'quer G',
      method: 'cash',
    });
    expect(plus.status).toBe(201);
    expect(parseFloat(plus.body.difference)).toBe(30);
    expect(plus.body.cashSessionId).toBe(session.id);
    const afterIn = await preview(session.id);
    expect(money(afterIn.body.totals.expectedCash)).toBe(money(beforeIn.body.totals.expectedCash + 30));
    expect(money(afterIn.body.totals.exchangesInByMethod.cash)).toBe(
      money(beforeIn.body.totals.exchangesInByMethod.cash + 30)
    );

    const saleOut = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    const beforeOut = await preview(session.id);
    const minus = await world.api.adminA.post(`/api/sales/${saleOut.body.id}/exchanges`, {
      returnItems: [{ saleItemId: saleOut.body.items[0].id, quantity: 1 }],
      newItems: [{ variantId: sizeGCheap.id, quantity: 1, unitPrice: 80 }],
      reason: 'quer mais barata',
      method: 'cash',
    });
    expect(minus.status).toBe(201);
    expect(parseFloat(minus.body.difference)).toBe(-20);
    const afterOut = await preview(session.id);
    expect(money(afterOut.body.totals.expectedCash)).toBe(money(beforeOut.body.totals.expectedCash - 20));
    expect(money(afterOut.body.totals.refunds)).toBe(money(beforeOut.body.totals.refunds + 20));
    const refund = afterOut.body.session.movements.find(
      (item) => item.type === 'refund' && item.referenceId === minus.body.id
    );
    expect(refund).toBeTruthy();
    expect(refund.referenceType).toBe('exchange');
  });

  test('fechamento grava snapshot; segundo close e PUT são recusados', async () => {
    const session = await ensureOpen();
    const live = await preview(session.id);
    const counted = money(live.body.totals.expectedCash + 5);
    const closed = await closeCashSession(world.api.adminA, session.id, counted);
    expect(closed.status).toBe(200);
    expect(closed.body.status).toBe('closed');
    expect(money(closed.body.countedCash)).toBe(counted);
    expect(money(closed.body.expectedCash)).toBe(money(live.body.totals.expectedCash));
    expect(money(closed.body.difference)).toBe(5);
    expect(closed.body.totals).toBeTruthy();
    expect(money(closed.body.totals.expectedCash)).toBe(money(live.body.totals.expectedCash));

    const again = await closeCashSession(world.api.adminA, session.id, counted);
    expect(again.status).toBe(400);

    const put = await world.api.adminA.put(`/api/cash/sessions/${session.id}`, { countedCash: 1 });
    expect(put.status).toBe(404);

    await openCashSession(world.api.adminA, world.lojaA.id, 100);
  });

  test('gerente não fecha caixa de outra unidade; outra empresa não lê a sessão; vendedora não altera fechado', async () => {
    const lojaB = await currentCash(world.api.adminA, world.lojaB.id);
    expect(lojaB.body.session).toBeTruthy();

    const managerClose = await world.api.managerA.post(
      `/api/cash/sessions/${lojaB.body.session.id}/close`,
      { countedCash: 100 }
    );
    expect(managerClose.status).toBe(403);

    const otherCompany = await world.api.adminB.get(`/api/cash/sessions/${lojaB.body.session.id}`);
    expect(otherCompany.status).toBe(404);

    const lojaA = await ensureOpen();
    const live = await preview(lojaA.id);
    const closed = await closeCashSession(world.api.adminA, lojaA.id, money(live.body.totals.expectedCash));
    expect(closed.status).toBe(200);

    const sellerSupply = await world.api.sellerA.post(`/api/cash/sessions/${lojaA.id}/supply`, {
      amount: 10,
      reason: 'não pode',
    });
    expect(sellerSupply.status).toBe(400);
    expect(sellerSupply.body.error).toMatch(/já está fechada/i);

    await openCashSession(world.api.adminA, world.lojaA.id, 100);
  });

  test('refund de cancelamento após fechamento da sessão original', async () => {
    const original = await ensureOpen();
    const sale = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    const live = await preview(original.id);
    const snapshotExpected = money(live.body.totals.expectedCash);
    const closed = await closeCashSession(world.api.adminA, original.id, snapshotExpected);
    expect(closed.status).toBe(200);

    const withoutTill = await world.api.adminA.post(`/api/sales/${sale.body.id}/cancel`, {
      reason: 'estorno depois de fechar',
    });
    expect(withoutTill.status).toBe(400);
    expect(withoutTill.body.error).toMatch(/abra o caixa/i);

    const current = await openCashSession(world.api.adminA, world.lojaA.id, 80);
    const cancelled = await world.api.adminA.post(`/api/sales/${sale.body.id}/cancel`, {
      reason: 'estorno depois de fechar',
    });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe('cancelled');

    const old = await preview(original.id);
    expect(old.body.frozen).toBe(true);
    expect(money(old.body.totals.expectedCash)).toBe(snapshotExpected);

    const now = await preview(current.id);
    expect(money(now.body.totals.refunds)).toBe(100);
    expect(money(now.body.totals.expectedCash)).toBe(money(80 - 100));
    const refund = now.body.session.movements.find((item) => item.type === 'refund');
    expect(refund).toBeTruthy();
    expect(refund.referenceType).toBe('sale');
    expect(refund.referenceId).toBe(sale.body.id);
    expect(refund.type).toBe('refund');
    expect(now.body.session.movements.some((item) => item.type === 'bleed')).toBe(false);
  });

  test('devolução em dinheiro no dia seguinte impacta só a sessão atual', async () => {
    const original = await ensureOpen();
    const sale = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    const live = await preview(original.id);
    const snapshot = money(live.body.totals.expectedCash);
    await closeCashSession(world.api.adminA, original.id, snapshot);

    const current = await openCashSession(world.api.adminA, world.lojaA.id, 50);
    const returned = await world.api.adminA.post(`/api/sales/${sale.body.id}/returns`, {
      items: [{ saleItemId: sale.body.items[0].id, quantity: 1 }],
      reason: 'devolveu no dia seguinte',
      method: 'cash',
    });
    expect(returned.status).toBe(201);
    expect(returned.body.cashSessionId).toBe(current.id);
    expect(returned.body.cashSessionId).not.toBe(original.id);

    const old = await preview(original.id);
    expect(old.body.frozen).toBe(true);
    expect(money(old.body.totals.expectedCash)).toBe(snapshot);

    const now = await preview(current.id);
    expect(money(now.body.totals.refunds)).toBe(100);
    expect(money(now.body.totals.expectedCash)).toBe(-50);
    const refund = now.body.session.movements.find((item) => item.referenceType === 'return');
    expect(refund.referenceId).toBe(returned.body.id);
  });

  test('troca em sessão diferente da venda original', async () => {
    const original = await ensureOpen();
    const sale = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    const live = await preview(original.id);
    const snapshot = money(live.body.totals.expectedCash);
    await closeCashSession(world.api.adminA, original.id, snapshot);

    const current = await openCashSession(world.api.adminA, world.lojaA.id, 40);
    const exchanged = await world.api.adminA.post(`/api/sales/${sale.body.id}/exchanges`, {
      returnItems: [{ saleItemId: sale.body.items[0].id, quantity: 1 }],
      newItems: [{ variantId: sizeGCheap.id, quantity: 1, unitPrice: 80 }],
      reason: 'trocou no outro dia',
      method: 'cash',
    });
    expect(exchanged.status).toBe(201);
    expect(exchanged.body.cashSessionId).toBe(current.id);
    expect(parseFloat(exchanged.body.difference)).toBe(-20);

    const old = await preview(original.id);
    expect(old.body.frozen).toBe(true);
    expect(money(old.body.totals.expectedCash)).toBe(snapshot);

    const now = await preview(current.id);
    expect(money(now.body.totals.refunds)).toBe(20);
    expect(money(now.body.totals.expectedCash)).toBe(20);
    const refund = now.body.session.movements.find((item) => item.referenceType === 'exchange');
    expect(refund.referenceId).toBe(exchanged.body.id);
    expect(refund.type).toBe('refund');
  });

  test('fechamento antigo permanece imutável depois de operação na sessão nova', async () => {
    const original = await ensureOpen();
    const sale = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    const live = await preview(original.id);
    const snapshot = {
      expectedCash: money(live.body.totals.expectedCash),
      salesTotal: money(live.body.totals.salesTotal),
      refunds: money(live.body.totals.refunds),
    };
    const closed = await closeCashSession(world.api.adminA, original.id, snapshot.expectedCash);
    expect(closed.status).toBe(200);

    const current = await openCashSession(world.api.adminA, world.lojaA.id, 10);
    await world.api.adminA.post(`/api/sales/${sale.body.id}/returns`, {
      items: [{ saleItemId: sale.body.items[0].id, quantity: 1 }],
      reason: 'não pode mudar o fechamento antigo',
      method: 'pix',
    });

    const frozen = await preview(original.id);
    expect(frozen.body.frozen).toBe(true);
    expect(money(frozen.body.totals.expectedCash)).toBe(snapshot.expectedCash);
    expect(money(frozen.body.totals.salesTotal)).toBe(snapshot.salesTotal);
    expect(money(frozen.body.totals.refunds)).toBe(snapshot.refunds);
    expect(money(frozen.body.session.expectedCash)).toBe(snapshot.expectedCash);

    const now = await preview(current.id);
    expect(money(now.body.totals.returnsByMethod.pix)).toBe(100);
    expect(money(now.body.totals.expectedCash)).toBe(10);
    expect(money(now.body.totals.refunds)).toBe(0);
  });

  test('refund aparece separado de bleed e a referência rastreia a origem', async () => {
    const session = await ensureOpen();
    await world.api.adminA.post(`/api/cash/sessions/${session.id}/bleed`, {
      amount: 15,
      reason: 'cofre do dia',
    });
    const sale = await sell(world.api.adminA, {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
    });
    const returned = await world.api.adminA.post(`/api/sales/${sale.body.id}/returns`, {
      items: [{ saleItemId: sale.body.items[0].id, quantity: 1 }],
      reason: 'estorno separado da sangria',
      method: 'cash',
    });
    expect(returned.status).toBe(201);

    const shown = await preview(session.id);
    expect(money(shown.body.totals.bleeds)).toBeGreaterThanOrEqual(15);
    expect(money(shown.body.totals.refunds)).toBeGreaterThanOrEqual(100);
    expect(shown.body.totals.bleeds).not.toBe(shown.body.totals.refunds);

    const bleed = shown.body.session.movements.find((item) => item.type === 'bleed' && money(item.amount) === 15);
    const refund = shown.body.session.movements.find(
      (item) => item.type === 'refund' && item.referenceId === returned.body.id
    );
    expect(bleed).toBeTruthy();
    expect(refund).toBeTruthy();
    expect(refund.referenceType).toBe('return');
    expect(refund.type).not.toBe('bleed');

    const stored = await prisma.cashMovement.findUnique({ where: { id: refund.id } });
    expect(stored.referenceType).toBe('return');
    expect(stored.referenceId).toBe(returned.body.id);
  });

  test('cancelamento só PIX/cartão não altera o dinheiro da gaveta', async () => {
    const session = await ensureOpen();
    const before = await preview(session.id);
    const sale = await world.api.adminA.post('/api/sales', {
      unitId: world.lojaA.id,
      items: [{ variantId: sizeM.id, quantity: 1, unitPrice: 100 }],
      payments: [{ method: 'pix', amount: 100 }],
    });
    expect(sale.status).toBe(201);
    const afterSale = await preview(session.id);
    expect(money(afterSale.body.totals.expectedCash)).toBe(money(before.body.totals.expectedCash));

    const cancelled = await world.api.adminA.post(`/api/sales/${sale.body.id}/cancel`, {
      reason: 'pix cancelado',
    });
    expect(cancelled.status).toBe(200);
    const afterCancel = await preview(session.id);
    expect(money(afterCancel.body.totals.expectedCash)).toBe(money(before.body.totals.expectedCash));
    expect(money(afterCancel.body.totals.refunds)).toBe(money(before.body.totals.refunds));
  });
});
