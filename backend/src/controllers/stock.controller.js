const prisma = require('../lib/prisma');
const { applyMovement, transfer, listStock, StockError } = require('../services/stock.service');

function handleStockError(res, error) {
  if (error instanceof StockError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error('Erro de estoque:', error);
  return res.status(500).json({ error: 'Erro ao processar estoque' });
}

class StockController {
  async list(req, res) {
    try {
      const unitId = req.query.unitId || req.headers['x-unit-id'];
      const stocks = await listStock({
        companyId: req.companyId,
        unitId: unitId || undefined,
        search: req.query.search || undefined,
        limit: req.query.limit,
      });
      return res.json({ stocks });
    } catch (error) {
      return handleStockError(res, error);
    }
  }

  async movements(req, res) {
    try {
      const { unitId, variantId, type, page = 1, limit = 30 } = req.query;
      const where = {
        companyId: req.companyId,
        ...(unitId && { unitId }),
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
