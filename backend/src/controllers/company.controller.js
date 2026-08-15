const prisma = require('../lib/prisma');

class CompanyController {
  async me(req, res) {
    try {
      const company = await prisma.company.findUnique({
        where: { id: req.companyId },
        include: {
          units: {
            where: { active: true },
            orderBy: { name: 'asc' },
          },
        },
      });

      if (!company) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      const isAdmin = req.user?.role?.name === 'admin';
      const allowedUnitIds = new Set((req.user?.units || []).map((unit) => unit.id));

      const units = isAdmin
        ? company.units
        : company.units.filter((unit) => allowedUnitIds.has(unit.id));

      return res.json({
        ...company,
        units,
        role: req.user?.role || null,
      });
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      return res.status(500).json({ error: 'Erro ao buscar empresa' });
    }
  }

  async listUnits(req, res) {
    try {
      const isAdmin = req.user?.role?.name === 'admin';
      const allowedUnitIds = (req.user?.units || []).map((unit) => unit.id);

      const units = await prisma.unit.findMany({
        where: {
          companyId: req.companyId,
          active: true,
          ...(!isAdmin && { id: { in: allowedUnitIds } }),
        },
        orderBy: { name: 'asc' },
      });

      return res.json({ units });
    } catch (error) {
      console.error('Erro ao listar unidades:', error);
      return res.status(500).json({ error: 'Erro ao listar unidades' });
    }
  }
}

module.exports = new CompanyController();
