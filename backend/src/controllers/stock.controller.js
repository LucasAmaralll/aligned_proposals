const prisma = require('../lib/prisma');
const { applyMovement, transfer, listStock, StockError, HTTP_TYPES } = require('../services/stock.service');
const { hasPermission } = require('../lib/roles');
const {
  assertUnitAccess,
  resolveListUnitFilter,
  handleAccess,
} = require('../lib/access');

function handleStockError(res, error) {
  if (handleAccess(res, error)) return;
  if (error instanceof StockError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error('Erro de estoque:', error);
  return res.status(500).json({ error: 'Erro ao processar estoque' });
}

function stockListArgs(user, requestedUnitId, { search, limit } = {}) {
  const filter = resolveListUnitFilter(user, requestedUnitId);
  if (typeof filter.unitId === 'string') {
    return { unitId: filter.unitId, search, limit };
  }
  if (filter.unitId?.in?.length === 1) {
    return { unitId: filter.unitId.in[0], search, limit };
  }
  if (filter.unitId?.in) {
    return { unitIds: filter.unitId.in, search, limit };
  }
  return { search, limit };
}

class StockController {
  async list(req, res) {
    try {
      const requested = req.query.unitId || req.headers['x-unit-id'];
      const stocks = await listStock({
        companyId: req.companyId,
        ...stockListArgs(req.user, requested, {
          search: req.query.search || undefined,
          limit: req.query.limit,
        }),
      });
      return res.json({ stocks });
    } catch (error) {
      return handleStockError(res, error);
    }
  }

  async movements(req, res) {
    try {
      const requested = req.query.unitId || req.headers['x-unit-id'];
      const { variantId, type, page = 1, limit = 30 } = req.query;
      const unitFilter = resolveListUnitFilter(req.user, requested);
      const where = {
        companyId: req.companyId,
        ...unitFilter,
        ...(variantId && { variantId }),
        ...(type && { type }),
      };

      const [movements, total] = await Promise.all([
        prisma.stockMovement.findMany({
          where,
          include: {
            unit: { select: { id: true, name: true, type: true } },
            createdBy: { select: { id: true, name: true } },
            variant: {
              include: { product: { select: { id: true, name: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.stockMovement.count({ where }),
      ]);

      return res.json({
        movements,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      return handleStockError(res, error);
    }
  }

  async createMovement(req, res) {
    try {
      const { type, variantId, unitId, quantity, reason } = req.body;
      const resolvedUnitId = unitId || req.headers['x-unit-id'];

      if (!type || !variantId || !resolvedUnitId) {
        return res.status(400).json({ error: 'Tipo, variação e unidade são obrigatórios' });
      }
      if (!HTTP_TYPES.has(type)) {
        return res.status(400).json({ error: 'Tipo de movimentação inválido' });
      }

      const permission = type === 'adjust' ? 'stock.adjust' : 'stock.manage';
      if (!hasPermission(req.user, permission)) {
        return res.status(403).json({ error: 'Sem permissão para esta ação' });
      }

      assertUnitAccess(req.user, resolvedUnitId);

      const result = await applyMovement({
        companyId: req.companyId,
        userId: req.userId,
        variantId,
        unitId: resolvedUnitId,
        type,
        quantity,
        reason,
      });

      return res.status(201).json(result);
    } catch (error) {
      return handleStockError(res, error);
    }
  }

  async createTransfer(req, res) {
    try {
      const { variantId, fromUnitId, toUnitId, quantity, reason } = req.body;
      if (!variantId || !fromUnitId || !toUnitId) {
        return res.status(400).json({ error: 'Variação e unidades de origem/destino são obrigatórias' });
      }

      const result = await transfer({
        companyId: req.companyId,
        userId: req.userId,
        user: req.user,
        variantId,
        fromUnitId,
        toUnitId,
        quantity,
        reason,
      });

      return res.status(201).json(result);
    } catch (error) {
      return handleStockError(res, error);
    }
  }
}

module.exports = new StockController();
