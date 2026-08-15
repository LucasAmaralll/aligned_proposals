const {
  isAdmin,
  allowedUnitIds,
  resolveListUnitFilter,
  AccessError,
} = require('../../src/lib/access');

const admin = { role: { name: 'admin' }, units: [] };
const manager = {
  role: { name: 'manager' },
  units: [{ id: 'loja-1' }, { id: 'loja-3' }],
};

describe('access helpers', () => {
  test('admin não tem lista fechada de unidades', () => {
    expect(isAdmin(admin)).toBe(true);
    expect(allowedUnitIds(admin)).toBeNull();
    expect(resolveListUnitFilter(admin, 'all')).toEqual({});
    expect(resolveListUnitFilter(admin, 'loja-2')).toEqual({ unitId: 'loja-2' });
  });

  test('gerente com all agrega só as unidades vinculadas', () => {
    expect(resolveListUnitFilter(manager, 'all')).toEqual({
      unitId: { in: ['loja-1', 'loja-3'] },
    });
    expect(resolveListUnitFilter(manager, undefined)).toEqual({
      unitId: { in: ['loja-1', 'loja-3'] },
    });
  });

  test('gerente não acessa unidade fora do vínculo', () => {
    expect(() => resolveListUnitFilter(manager, 'loja-2')).toThrow(AccessError);
  });
});
