export const ROLE_LABELS = {
  admin: 'Administrador',
  manager: 'Gerente',
  seller: 'Vendedora',
};

export const getRoleLabel = (role) => {
  const name = typeof role === 'string' ? role : role?.name;
  return ROLE_LABELS[name] || name || '—';
};

export const hasPermission = (role, permission) => {
  if (!role) return false;
  if (role.name === 'admin') return true;
  const permissions = Array.isArray(role.permissions) ? role.permissions : [];
  return permissions.includes(permission);
};

export const isSeller = (role) => role?.name === 'seller';
export const isAdmin = (role) => role?.name === 'admin';
