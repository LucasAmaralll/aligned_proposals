const { hasPermission } = require('../lib/roles');

function requirePermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ error: 'Sem permissão para esta ação' });
    }
    return next();
  };
}

function isSeller(user) {
  return user?.role?.name === 'seller';
}

module.exports = { requirePermission, isSeller };
