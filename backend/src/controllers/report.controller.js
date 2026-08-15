const { getSalesDashboard } = require('../services/report.service');
const { isSeller, hasPermission } = require('../middlewares/permission.middleware');
const { isAdmin, resolveListUnitFilter, handleAccess } = require('../lib/access');

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
      if (handleAccess(res, error)) return;
      console.error('Erro ao montar dashboard:', error);
      return res.status(500).json({ error: 'Erro ao carregar relatórios' });
    }
  }
}

module.exports = new ReportController();
