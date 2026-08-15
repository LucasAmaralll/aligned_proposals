const { getSalesDashboard } = require('../services/report.service');

class ReportController {
  async dashboard(req, res) {
    try {
      const unitId = req.query.unitId || req.headers['x-unit-id'] || 'all';
      const data = await getSalesDashboard({
        companyId: req.companyId,
        unitId,
        period: req.query.period || 'month',
        from: req.query.from,
        to: req.query.to,
      });
      return res.json(data);
    } catch (error) {
      console.error('Erro ao montar dashboard:', error);
      return res.status(500).json({ error: 'Erro ao carregar relatórios' });
    }
  }
}

module.exports = new ReportController();
