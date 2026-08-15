const prisma = require('../lib/prisma');

class PlanController {
  async list(req, res) {
    try {
      const plans = await prisma.plan.findMany({
        orderBy: { price: 'asc' }
      });

      return res.json(plans);
    } catch (error) {
      console.error('Erro ao listar planos:', error);
      return res.status(500).json({ error: 'Erro ao listar planos' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;

      const plan = await prisma.plan.findUnique({
        where: { id }
      });

      if (!plan) {
        return res.status(404).json({ error: 'Plano não encontrado' });
      }

      return res.json(plan);
    } catch (error) {
      console.error('Erro ao buscar plano:', error);
      return res.status(500).json({ error: 'Erro ao buscar plano' });
    }
  }
}

module.exports = new PlanController();
