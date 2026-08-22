const { getSalesDashboard } = require('../services/report.service');
const {
  ReportError,
  listSalesReport,
  exportSalesReport,
  listClientsReport,
  exportClientsReport,
  listProductsReport,
  exportProductsReport,
  listStockReport,
  exportStockReport,
  listSellersReport,
  exportSellersReport,
  listCashReport,
  exportCashReport,
  listReportOptions,
} = require('../services/operationalReport.service');
const { isSeller, hasPermission } = require('../middlewares/permission.middleware');
const { isAdmin, resolveListUnitFilter, handleAccess, AccessError } = require('../lib/access');

function sendCsv(res, payload) {
  res.setHeader('Content-Type', payload.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${payload.filename}"`);
  return res.send(payload.csv);
}

function handleError(res, error) {
  if (handleAccess(res, error)) return;
  if (error instanceof ReportError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error('Erro ao montar relatório:', error);
  return res.status(500).json({ error: 'Erro ao carregar relatórios' });
}

function assertModuleAccess(req, { sellers = false } = {}) {
  const sellerOnly = isSeller(req.user);
  if (sellers) {
    if (sellerOnly || !hasPermission(req.user, 'reports.read')) {
      throw new AccessError('Sem permissão para esta ação', 403);
    }
    return { sellerOnly: false };
  }
  if (sellerOnly) {
    if (!hasPermission(req.user, 'dashboard.read')) {
      throw new AccessError('Sem permissão para esta ação', 403);
    }
    return { sellerOnly: true };
  }
  if (!hasPermission(req.user, 'reports.read')) {
    throw new AccessError('Sem permissão para esta ação', 403);
  }
  return { sellerOnly: false };
}

function reportParams(req, { sellers = false, allowSellerFilter = true } = {}) {
  const { sellerOnly } = assertModuleAccess(req, { sellers });
  const requested = req.query.unitId || req.headers['x-unit-id'];
  const unitFilter = resolveListUnitFilter(req.user, requested);
  return {
    companyId: req.companyId,
    user: req.user,
    unitFilter,
    sellerId: sellerOnly ? req.userId : allowSellerFilter ? req.query.sellerId || undefined : undefined,
    from: req.query.from,
    to: req.query.to,
    clientId: req.query.clientId,
    variantId: req.query.variantId,
    sku: req.query.sku,
    productId: req.query.productId,
    method: req.query.method,
    channel: req.query.channel,
    status: req.query.status,
    search: req.query.search,
    page: req.query.page,
    limit: req.query.limit,
  };
}

class ReportController {
  async dashboard(req, res) {
    try {
      const sellerOnly = isSeller(req.user);
      if (sellerOnly && !hasPermission(req.user, 'dashboard.read')) {
        return res.status(403).json({ error: 'Sem permissão para esta ação' });
      }
      if (!sellerOnly && !hasPermission(req.user, 'reports.read')) {
        return res.status(403).json({ error: 'Sem permissão para esta ação' });
      }

      const requested = req.query.unitId || req.headers['x-unit-id'];
      const unitFilter = resolveListUnitFilter(req.user, requested);
      const data = await getSalesDashboard({
        companyId: req.companyId,
        unitFilter,
        period: req.query.period || 'month',
        from: req.query.from,
        to: req.query.to,
        sellerId: sellerOnly ? req.userId : undefined,
        commissionRate: sellerOnly ? req.user?.commissionRate : undefined,
      });
      return res.json({
        ...data,
        scope: sellerOnly ? 'seller' : isAdmin(req.user) ? 'company' : 'units',
      });
    } catch (error) {
      return handleError(res, error);
    }
  }

  async options(req, res) {
    try {
      const params = reportParams(req, { allowSellerFilter: false });
      if (isSeller(req.user)) {
        return res.json({ sellers: [] });
      }
      const data = await listReportOptions(params);
      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async sales(req, res) {
    try {
      const data = await listSalesReport(reportParams(req));
      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async exportSales(req, res) {
    try {
      return sendCsv(res, await exportSalesReport(reportParams(req)));
    } catch (error) {
      return handleError(res, error);
    }
  }

  async clients(req, res) {
    try {
      const data = await listClientsReport(reportParams(req));
      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async exportClients(req, res) {
    try {
      return sendCsv(res, await exportClientsReport(reportParams(req)));
    } catch (error) {
      return handleError(res, error);
    }
  }

  async products(req, res) {
    try {
      const data = await listProductsReport(reportParams(req));
      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async exportProducts(req, res) {
    try {
      return sendCsv(res, await exportProductsReport(reportParams(req)));
    } catch (error) {
      return handleError(res, error);
    }
  }

  async stock(req, res) {
    try {
      const data = await listStockReport(reportParams(req));
      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async exportStock(req, res) {
    try {
      return sendCsv(res, await exportStockReport(reportParams(req)));
    } catch (error) {
      return handleError(res, error);
    }
  }

  async sellers(req, res) {
    try {
      const data = await listSellersReport(reportParams(req, { sellers: true }));
      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async exportSellers(req, res) {
    try {
      return sendCsv(res, await exportSellersReport(reportParams(req, { sellers: true })));
    } catch (error) {
      return handleError(res, error);
    }
  }

  async cash(req, res) {
    try {
      const data = await listCashReport(reportParams(req, { allowSellerFilter: false }));
      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  async exportCash(req, res) {
    try {
      return sendCsv(res, await exportCashReport(reportParams(req, { allowSellerFilter: false })));
    } catch (error) {
      return handleError(res, error);
    }
  }
}

module.exports = new ReportController();
