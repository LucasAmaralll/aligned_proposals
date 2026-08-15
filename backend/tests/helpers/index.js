const request = require('supertest');
const bcrypt = require('bcryptjs');
const prisma = require('../../src/lib/prisma');
const { ensureRoles } = require('../../src/services/tenant.service');
const app = require('../../src/app');

const PASSWORD = 'Test1234!';

function auth(token, extra = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

function asUser(token) {
  return {
    get: (path, query) => {
      const req = request(app).get(path).set(auth(token));
      return query ? req.query(query) : req;
    },
    post: (path, body) => request(app).post(path).set(auth(token)).send(body),
    put: (path, body) => request(app).put(path).set(auth(token)).send(body),
    del: (path) => request(app).delete(path).set(auth(token)),
  };
}

async function login(email, password = PASSWORD) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login falhou ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

async function wipeCompany(companyId) {
  if (!companyId) return;
  await prisma.cashMovement.deleteMany({ where: { companyId } });
  await prisma.cashSession.deleteMany({ where: { companyId } });
  await prisma.cashRegister.deleteMany({ where: { companyId } });
  await prisma.stockMovement.deleteMany({ where: { companyId } });
  await prisma.stock.deleteMany({ where: { companyId } });
  await prisma.saleReturnItem.deleteMany({ where: { saleReturn: { companyId } } });
  await prisma.exchangeItem.deleteMany({ where: { exchange: { companyId } } });
  await prisma.saleReturn.deleteMany({ where: { companyId } });
  await prisma.exchange.deleteMany({ where: { companyId } });
  await prisma.salePayment.deleteMany({ where: { sale: { companyId } } });
  await prisma.saleItem.deleteMany({ where: { sale: { companyId } } });
  await prisma.shipment.deleteMany({ where: { companyId } });
  await prisma.sale.deleteMany({ where: { companyId } });
  await prisma.expense.deleteMany({ where: { companyId } });
  await prisma.productVariant.deleteMany({ where: { companyId } });
  await prisma.product.deleteMany({ where: { companyId } });
  await prisma.category.deleteMany({ where: { companyId } });
  await prisma.quote.deleteMany({ where: { companyId } });
  await prisma.client.deleteMany({ where: { companyId } });
  await prisma.companyApiKey.deleteMany({ where: { companyId } });
  const users = await prisma.user.findMany({ where: { companyId }, select: { id: true } });
  const userIds = users.map((user) => user.id);
  if (userIds.length) {
    await prisma.payment.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userUnit.deleteMany({ where: { userId: { in: userIds } } });
  }
  await prisma.user.deleteMany({ where: { companyId } });
  await prisma.unit.deleteMany({ where: { companyId } });
  await prisma.company.delete({ where: { id: companyId } }).catch(() => {});
}

async function createUser({ email, name, company, role, units, commissionRate }) {
  const hashed = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      companyName: company.name,
      companyId: company.id,
      roleId: role.id,
      commissionRate: commissionRate ?? null,
      subscriptionStatus: 'active',
      units: {
        create: units.map((unit) => ({ unitId: unit.id })),
      },
    },
  });
}

async function openCashSession(api, unitId, openingAmount = 100) {
  const res = await api.post('/api/cash/sessions/open', { unitId, openingAmount });
  if (res.status !== 201) {
    throw new Error(`Abrir caixa falhou: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

async function closeCashSession(api, sessionId, countedCash) {
  const res = await api.post(`/api/cash/sessions/${sessionId}/close`, { countedCash });
  return res;
}

async function currentCash(api, unitId) {
  return api.get('/api/cash/sessions/current', { unitId });
}

async function setupTenancy(label, { openCash = true } = {}) {
  const suffix = `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const roles = await ensureRoles();

  const companyA = await prisma.company.create({
    data: {
      name: `Teste A ${suffix}`,
      slug: `teste-a-${suffix}`,
      units: {
        create: [
          { name: 'Loja A', type: 'store' },
          { name: 'Loja B', type: 'store' },
        ],
      },
    },
    include: { units: { orderBy: { name: 'asc' } } },
  });
  const lojaA = companyA.units.find((unit) => unit.name === 'Loja A');
  const lojaB = companyA.units.find((unit) => unit.name === 'Loja B');

  const companyB = await prisma.company.create({
    data: {
      name: `Teste B ${suffix}`,
      slug: `teste-b-${suffix}`,
      units: {
        create: [{ name: 'Fábrica', type: 'factory' }],
      },
    },
    include: { units: true },
  });
  const unitB = companyB.units[0];

  const adminA = await createUser({
    email: `admin.a.${suffix}@test.aligned`,
    name: 'Admin A',
    company: companyA,
    role: roles.admin,
    units: [lojaA, lojaB],
  });
  const managerA = await createUser({
    email: `manager.a.${suffix}@test.aligned`,
    name: 'Gerente A',
    company: companyA,
    role: roles.manager,
    units: [lojaA],
  });
  const sellerA = await createUser({
    email: `seller.a.${suffix}@test.aligned`,
    name: 'Vendedora A',
    company: companyA,
    role: roles.seller,
    units: [lojaA],
    commissionRate: 8,
  });
  const adminB = await createUser({
    email: `admin.b.${suffix}@test.aligned`,
    name: 'Admin B',
    company: companyB,
    role: roles.admin,
    units: [unitB],
  });

  const tokens = {
    adminA: await login(adminA.email),
    managerA: await login(managerA.email),
    sellerA: await login(sellerA.email),
    adminB: await login(adminB.email),
  };

  const api = {
    adminA: asUser(tokens.adminA),
    managerA: asUser(tokens.managerA),
    sellerA: asUser(tokens.sellerA),
    adminB: asUser(tokens.adminB),
  };

  let cashA;
  let cashB;
  let cashCompanyB;
  if (openCash) {
    cashA = await openCashSession(api.adminA, lojaA.id);
    cashB = await openCashSession(api.adminA, lojaB.id);
    cashCompanyB = await openCashSession(api.adminB, unitB.id);
  }

  return {
    suffix,
    roles,
    companyA,
    companyB,
    lojaA,
    lojaB,
    unitB,
    users: { adminA, managerA, sellerA, adminB },
    tokens,
    api,
    sessions: { lojaA: cashA, lojaB: cashB, unitB: cashCompanyB },
    wipe: async () => {
      await wipeCompany(companyA.id);
      await wipeCompany(companyB.id);
    },
  };
}

async function createProduct(api, { name, sku, size = 'M', color = 'Preto', salePrice = 100 }) {
  const product = await api.post('/api/catalog/products', { name });
  expect(product.status).toBe(201);
  const variant = await api.post(`/api/catalog/products/${product.body.id}/variants`, {
    sku,
    size,
    color,
    salePrice,
  });
  expect(variant.status).toBe(201);
  return { product: product.body, variant: variant.body };
}

async function addVariant(api, productId, { sku, size, color = 'Preto', salePrice }) {
  const variant = await api.post(`/api/catalog/products/${productId}/variants`, {
    sku,
    size,
    color,
    salePrice,
  });
  expect(variant.status).toBe(201);
  return variant.body;
}

async function addStock(api, { variantId, unitId, quantity, type = 'entry', reason }) {
  const res = await api.post('/api/stock/movements', {
    type,
    variantId,
    unitId,
    quantity,
    reason: reason || (type === 'adjust' ? 'ajuste de teste' : undefined),
  });
  return res;
}

async function stockQty(variantId, unitId) {
  const row = await prisma.stock.findUnique({
    where: { variantId_unitId: { variantId, unitId } },
  });
  return parseFloat(row?.quantity || 0);
}

function money(value) {
  return Math.round(parseFloat(value || 0) * 100) / 100;
}

async function sell(api, { unitId, items, discount = 0, ship = false, shipping }) {
  const subtotal = money(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const itemsDiscount = money(items.reduce((sum, item) => sum + (item.discount || 0), 0));
  const total = money(subtotal - itemsDiscount - discount);
  return api.post('/api/sales', {
    unitId,
    discount,
    items,
    payments: [{ method: 'cash', amount: total }],
    ship,
    shipping,
  });
}

module.exports = {
  app,
  prisma,
  request,
  PASSWORD,
  auth,
  asUser,
  login,
  wipeCompany,
  createUser,
  setupTenancy,
  openCashSession,
  closeCashSession,
  currentCash,
  createProduct,
  addVariant,
  addStock,
  stockQty,
  sell,
  money,
};
