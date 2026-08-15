const { createSale, listSales, getSaleById, cancelSale, SaleError } = require('../services/sale.service');
const { createReturn, createExchange, AftersaleError } = require('../services/aftersale.service');
const { StockError } = require('../services/stock.service');
const { CashError } = require('../services/cash.service');
const { isSeller } = require('../middlewares/permission.middleware');
const { handleAccess } = require('../lib/access');

function handleError(res, error) {
  if (handleAccess(res, error)) return;
  if (
    error instanceof SaleError ||
    error instanceof StockError ||
    error instanceof AftersaleError ||
    error instanceof CashError
  ) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error('Erro de venda:', error);
  return res.status(500).json({ error: 'Erro ao processar venda' });
}

class SaleController {
  async list(req, res) {
    try {
      const unitId = req.query.unitId || req.headers['x-unit-id'];
      const result = await listSales({
        companyId: req.companyId,
        unitId: unitId || undefined,
        search: req.query.search || undefined,
        page: req.query.page,
        limit: req.query.limit,
        sellerId: isSeller(req.user) ? req.userId : undefined,
        channel: req.query.channel || undefined,
        origin: req.query.origin || undefined,
        user: req.user,
      });
      return res.json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async getById(req, res) {
    try {
      const sale = await getSaleById({
        companyId: req.companyId,
        id: req.params.id,
        sellerId: isSeller(req.user) ? req.userId : undefined,
        user: req.user,
      });
      return res.json(sale);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async create(req, res) {
    try {
      const unitId = req.body.unitId || req.headers['x-unit-id'];
      const sale = await createSale({
        companyId: req.companyId,
        userId: req.userId,
        user: req.user,
        unitId,
        clientId: req.body.clientId,
        items: req.body.items,
        payments: req.body.payments,
        discount: req.body.discount,
        notes: req.body.notes,
        origin: req.body.origin,
        channel: req.body.channel,
        quoteId: req.body.quoteId,
        ship: Boolean(req.body.ship),
        shipping: req.body.shipping || {},
      });
      return res.status(201).json(sale);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async createReturn(req, res) {
    try {
      const record = await createReturn({
        companyId: req.companyId,
        userId: req.userId,
        user: req.user,
        saleId: req.params.id,
        items: req.body.items,
        reason: req.body.reason,
        method: req.body.method,
        sellerId: isSeller(req.user) ? req.userId : undefined,
      });
      return res.status(201).json(record);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async createExchange(req, res) {
    try {
      const record = await createExchange({
        companyId: req.companyId,
        userId: req.userId,
        user: req.user,
        saleId: req.params.id,
        returnItems: req.body.returnItems,
        newItems: req.body.newItems,
        reason: req.body.reason,
        method: req.body.method,
        sellerId: isSeller(req.user) ? req.userId : undefined,
      });
      return res.status(201).json(record);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async cancel(req, res) {
    try {
      const sale = await cancelSale({
        companyId: req.companyId,
        userId: req.userId,
        id: req.params.id,
        reason: req.body.reason,
        user: req.user,
      });
      return res.json(sale);
    } catch (error) {
      return handleError(res, error);
    }
  }
}

module.exports = new SaleController();
