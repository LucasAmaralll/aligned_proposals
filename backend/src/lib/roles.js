const ROLE_DEFINITIONS = [
  {
    name: 'admin',
    description: 'Acesso total à empresa',
    permissions: [
      'dashboard.read',
      'clients.manage',
      'products.manage',
      'quotes.manage',
      'sales.manage',
      'sales.discount',
      'sales.cancel',
      'stock.manage',
      'stock.adjust',
      'exchanges.manage',
      'returns.manage',
      'reports.read',
      'users.manage',
      'units.manage',
      'expenses.manage',
      'cash.read',
      'cash.open',
      'cash.operate',
      'cash.close',
    ],
  },
  {
    name: 'manager',
    description: 'Gestão operacional da loja',
    permissions: [
      'dashboard.read',
      'clients.manage',
      'products.manage',
      'quotes.manage',
      'sales.manage',
      'sales.discount',
      'sales.cancel',
      'stock.manage',
      'stock.adjust',
      'exchanges.manage',
      'returns.manage',
      'reports.read',
      'expenses.manage',
      'cash.read',
      'cash.open',
      'cash.operate',
      'cash.close',
    ],
  },
  {
    name: 'seller',
    description: 'Operação de caixa e atendimento',
    permissions: [
      'dashboard.read',
      'clients.manage',
      'products.read',
      'quotes.manage',
      'sales.manage',
      'exchanges.manage',
      'returns.manage',
      'cash.read',
      'cash.open',
      'cash.operate',
      'cash.close',
    ],
  },
];

function hasPermission(user, permission) {
  if (!user?.role) return false;
  if (user.role.name === 'admin') return true;
  const permissions = Array.isArray(user.role.permissions)
    ? user.role.permissions
    : [];
  return permissions.includes(permission);
}

module.exports = { ROLE_DEFINITIONS, hasPermission };
