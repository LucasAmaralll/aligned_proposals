const { listStorefrontCatalog, createStorefrontOrder } = require('../services/storefront.service');
const { SaleError } = require('../services/sale.service');
const { StockError } = require('../services/stock.service');

function handleError(res, error) {
  if (error instanceof SaleError || error instanceof StockError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error('Erro na vitrine:', error);
  return res.status(500).json({ error: 'Erro na integração' });
}

class StorefrontController {
  async catalog(req, res) {
    try {
      const result = await listStorefrontCatalog({
        companyId: req.companyId,
        search: req.query.search,
        unitId: req.query.unitId,
        limit: req.query.limit,
      });
      return res.json(result);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async createOrder(req, res) {
    try {
      const sale = await createStorefrontOrder({
        companyId: req.companyId,
        userId: req.userId,
        body: req.body,
      });
      return res.status(201).json(sale);
    } catch (error) {
      return handleError(res, error);
    }
  }
}

module.exports = new StorefrontController();
