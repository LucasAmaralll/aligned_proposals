const { createSale, listSales, getSaleById, SaleError } = require('../services/sale.service');
const { createReturn, createExchange, AftersaleError } = require('../services/aftersale.service');
const { StockError } = require('../services/stock.service');

function handleError(res, error) {
  if (error instanceof SaleError || error instanceof StockError || error instanceof AftersaleError) {
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
        unitId,
        clientId: req.body.clientId,
        items: req.body.items,
        payments: req.body.payments,
        discount: req.body.discount,
        notes: req.body.notes,
        origin: req.body.origin,
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
        saleId: req.params.id,
        items: req.body.items,
        reason: req.body.reason,
        method: req.body.method,
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
        saleId: req.params.id,
        returnItems: req.body.returnItems,
        newItems: req.body.newItems,
        reason: req.body.reason,
        method: req.body.method,
      });
      return res.status(201).json(record);
    } catch (error) {
      return handleError(res, error);
    }
  }
}

module.exports = new SaleController();
