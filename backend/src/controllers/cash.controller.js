const {
  CashError,
  listRegisters,
  openSession,
  addTillMovement,
  closeSession,
  listSessions,
  currentSession,
  previewSession,
} = require('../services/cash.service');
const { handleAccess } = require('../lib/access');

function handleError(res, error) {
  if (handleAccess(res, error)) return;
  if (error instanceof CashError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error('Erro de caixa:', error);
  return res.status(500).json({ error: 'Erro ao processar caixa' });
}

class CashController {
  async registers(req, res) {
    try {
      const registers = await listRegisters({
        companyId: req.companyId,
        unitId: req.query.unitId || req.headers['x-unit-id'],
        user: req.user,
      });
      return res.json({ registers });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async current(req, res) {
    try {
      const result = await currentSession({
        companyId: req.companyId,
        user: req.user,
        unitId: req.query.unitId || req.headers['x-unit-id'],
      });
      return res.json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async list(req, res) {
    try {
      const result = await listSessions({
        companyId: req.companyId,
        user: req.user,
        unitId: req.query.unitId || req.headers['x-unit-id'],
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit,
      });
      return res.json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async getById(req, res) {
    try {
      const result = await previewSession({
        companyId: req.companyId,
        user: req.user,
        id: req.params.id,
      });
      return res.json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async preview(req, res) {
    try {
      const result = await previewSession({
        companyId: req.companyId,
        user: req.user,
        id: req.params.id,
      });
      return res.json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async open(req, res) {
    try {
      const session = await openSession({
        companyId: req.companyId,
        userId: req.userId,
        user: req.user,
        unitId: req.body.unitId || req.headers['x-unit-id'],
        openingAmount: req.body.openingAmount,
        registerId: req.body.registerId,
      });
      return res.status(201).json(session);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async supply(req, res) {
    try {
      const result = await addTillMovement({
        companyId: req.companyId,
        user: req.user,
        userId: req.userId,
        id: req.params.id,
        type: 'supply',
        amount: req.body.amount,
        reason: req.body.reason,
      });
      return res.status(201).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async bleed(req, res) {
    try {
      const result = await addTillMovement({
        companyId: req.companyId,
        user: req.user,
        userId: req.userId,
        id: req.params.id,
        type: 'bleed',
        amount: req.body.amount,
        reason: req.body.reason,
      });
      return res.status(201).json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async close(req, res) {
    try {
      const session = await closeSession({
        companyId: req.companyId,
        user: req.user,
        userId: req.userId,
        id: req.params.id,
        countedCash: req.body.countedCash,
      });
      return res.json(session);
    } catch (error) {
      return handleError(res, error);
    }
  }
}

module.exports = new CashController();
