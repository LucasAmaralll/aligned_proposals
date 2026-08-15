/**
 * Isolamento por empresa.
 * companyId vem sempre do usuário autenticado — nunca do body.
 */
const {
  AccessError,
  collectRequestUnitIds,
  assertUnitAccess,
} = require('../lib/access');

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
  try {
    const ids = collectRequestUnitIds(req);
    for (const unitId of ids) {
      assertUnitAccess(req.user, unitId);
    }

    const primary = req.body?.unitId || req.query?.unitId || req.headers['x-unit-id'];
    if (primary && primary !== 'all') {
      req.unitId = primary;
    }

    return next();
  } catch (error) {
    if (error instanceof AccessError) {
      return res.status(error.status).json({ error: error.message });
    }
    return next(error);
  }
};

module.exports = { tenantMiddleware, requireUnitAccess };
