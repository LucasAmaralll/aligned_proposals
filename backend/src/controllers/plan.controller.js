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

  async seed(req, res) {
    try {
      // Criar planos padrão se não existirem
      const plans = [
        {
          name: 'Gratuito',
          price: 0,
          quotesLimit: 3,
          hasWatermark: true,
          features: JSON.stringify([
            'Até 3 orçamentos/mês',
            'PDF com marca d\'água',
            'Link público de visualização'
          ])
        },
        {
          name: 'Básico',
          price: 19.90,
          quotesLimit: 20,
          hasWatermark: false,
          stripePriceId: process.env.STRIPE_PRICE_BASIC,
          features: JSON.stringify([
            'Até 20 orçamentos/mês',
            'PDF sem marca d\'água',
            'Envio por email e WhatsApp',
            'Logo personalizada'
          ])
        },
        {
          name: 'Pro',
          price: 49.90,
          quotesLimit: -1,
          hasWatermark: false,
          stripePriceId: process.env.STRIPE_PRICE_PRO,
          features: JSON.stringify([
            'Orçamentos ilimitados',
            'Relatórios e métricas',
            'Envio automático',
            'Suporte prioritário',
            'Personalização avançada'
          ])
        }
      ];

      for (const planData of plans) {
        await prisma.plan.upsert({
          where: { name: planData.name },
          update: planData,
          create: planData
        });
      }

      const allPlans = await prisma.plan.findMany();
      return res.json({ 
        message: 'Planos criados/atualizados com sucesso',
        plans: allPlans
      });
    } catch (error) {
      console.error('Erro ao criar planos:', error);
      return res.status(500).json({ error: 'Erro ao criar planos' });
    }
  }
}

module.exports = new PlanController();
