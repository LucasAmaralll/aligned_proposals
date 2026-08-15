const { getSalesDashboard } = require('../services/report.service');
const { isSeller } = require('../middlewares/permission.middleware');

class ReportController {
  async dashboard(req, res) {
    try {
      const sellerOnly = isSeller(req.user);
      const unitId = sellerOnly
        ? req.headers['x-unit-id'] || req.query.unitId
        : req.query.unitId || req.headers['x-unit-id'] || 'all';
      const data = await getSalesDashboard({
        companyId: req.companyId,
        unitId,
        period: req.query.period || 'month',
        from: req.query.from,
        to: req.query.to,
        sellerId: sellerOnly ? req.userId : undefined,
        commissionRate: sellerOnly ? req.user?.commissionRate : undefined,
      });
      return res.json({ ...data, scope: sellerOnly ? 'seller' : 'company' });
    } catch (error) {
      console.error('Erro ao montar dashboard:', error);
      return res.status(500).json({ error: 'Erro ao carregar relatórios' });
    }
  }
}

module.exports = new ReportController();
