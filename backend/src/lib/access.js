class AccessError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.status = status;
  }
}

function isAdmin(user) {
  return user?.role?.name === 'admin';
}

function allowedUnitIds(user) {
  if (isAdmin(user)) return null;
  return (user?.units || []).map((unit) => unit.id).filter(Boolean);
}

function hasUnitAccess(user, unitId) {
  if (!unitId) return false;
  if (isAdmin(user)) return true;
  return (user?.units || []).some((unit) => unit.id === unitId);
}

function assertUnitAccess(user, unitId) {
  if (!unitId) {
    throw new AccessError('Unidade é obrigatória', 400);
  }
  if (!hasUnitAccess(user, unitId)) {
    throw new AccessError('Sem acesso a esta unidade', 403);
  }
}

function assertUnitsAccess(user, unitIds = []) {
  for (const unitId of unitIds) {
    assertUnitAccess(user, unitId);
  }
}

function assertResourceUnitAccess(user, unitId) {
  if (!unitId) {
    if (isAdmin(user)) return;
    throw new AccessError('Sem acesso a este recurso', 403);
  }
  assertUnitAccess(user, unitId);
}

function resolveListUnitFilter(user, requestedUnitId) {
  const requested = requestedUnitId && requestedUnitId !== 'all' ? requestedUnitId : null;

  if (requested) {
    assertUnitAccess(user, requested);
    return { unitId: requested };
  }

  const allowed = allowedUnitIds(user);
  if (allowed === null) {
    return {};
  }

  return { unitId: { in: allowed } };
}

function catalogStockWhere(user) {
  const allowed = allowedUnitIds(user);
  if (allowed === null) return undefined;
  return { unitId: { in: allowed } };
}

function handleAccess(res, error) {
  if (error instanceof AccessError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

function collectRequestUnitIds(req) {
  const values = [
    req.body?.unitId,
    req.query?.unitId,
    req.headers?.['x-unit-id'],
    req.body?.fromUnitId,
    req.body?.toUnitId,
  ];
  return [...new Set(values.filter((id) => id && id !== 'all'))];
}

module.exports = {
  AccessError,
  isAdmin,
  allowedUnitIds,
  hasUnitAccess,
  assertUnitAccess,
  assertUnitsAccess,
  assertResourceUnitAccess,
  resolveListUnitFilter,
  catalogStockWhere,
  handleAccess,
  collectRequestUnitIds,
};
