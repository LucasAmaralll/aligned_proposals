const { app, request, login, auth, setupTenancy } = require('../helpers');

describe('auth', () => {
  let world;

  beforeAll(async () => {
    world = await setupTenancy('auth');
  });

  afterAll(async () => {
    await world.wipe();
  });

  test('login válido devolve token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: world.users.adminA.email, password: 'Test1234!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.companyId).toBe(world.companyA.id);
  });

  test('login inválido devolve 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: world.users.adminA.email, password: 'senha-errada' });
    expect(res.status).toBe(401);
  });

  test('/me devolve papel e unidades do usuário autenticado', async () => {
    const me = await request(app).get('/api/auth/me').set(auth(world.tokens.sellerA));
    expect(me.status).toBe(200);
    expect(me.body.role.name).toBe('seller');
    expect(me.body.units.map((unit) => unit.id)).toEqual([world.lojaA.id]);
  });

  test('vendedora demo está vinculada a uma unidade ativa da Reveza', async () => {
    const token = await login('nina.v@example.com', 'vendedora123');
    const res = await request(app).get('/api/companies/me').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Reveza');
    expect(res.body.units.length).toBeGreaterThan(0);
    expect(res.body.units.every((unit) => unit.active !== false)).toBe(true);
  });
});
