/**
 * Isolamento por empresa.
 * companyId vem sempre do usuário autenticado — nunca do body.
 */
const tenantMiddleware = (req, res, next) => {
  if (!req.companyId) {
    return res.status(403).json({
      error: 'Usuário sem empresa vinculada',
    });
  }

  if (req.body?.companyId && req.body.companyId !== req.companyId) {
    return res.status(403).json({
      error: 'Não é permitido informar outra empresa',
    });
  }

  next();
};

const requireUnitAccess = (req, res, next) => {
  const unitId = req.body?.unitId || req.query?.unitId || req.headers['x-unit-id'];

  if (!unitId) {
    return next();
  }

  const allowed = (req.user?.units || []).some((unit) => unit.id === unitId);
  const isAdmin = req.user?.role?.name === 'admin';

  if (!allowed && !isAdmin) {
    return res.status(403).json({
      error: 'Sem acesso a esta unidade',
    });
  }

  req.unitId = unitId;
  next();
};

module.exports = { tenantMiddleware, requireUnitAccess };
