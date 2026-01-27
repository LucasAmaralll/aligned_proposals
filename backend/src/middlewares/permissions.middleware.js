const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware para verificar permissões baseadas no plano do usuário
 */

// Verifica se o usuário pode acessar o Dashboard
const canAccessDashboard = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { plan: true }
    });

    if (!user || !user.plan) {
      return res.status(403).json({ 
        error: 'Plano não encontrado',
        upgrade: true 
      });
    }

    // Plano Gratuito NÃO tem acesso ao Dashboard
    if (user.plan.name === 'Gratuito') {
      return res.status(403).json({ 
        error: 'Dashboard disponível apenas nos planos Básico e Pro',
        feature: 'dashboard',
        upgrade: true,
        message: 'Faça upgrade para acessar estatísticas e relatórios'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro ao verificar permissão de dashboard:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

// Verifica se o usuário pode acessar a Precificação Inteligente
const canAccessPricing = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { plan: true }
    });

    if (!user || !user.plan) {
      return res.status(403).json({ 
        error: 'Plano não encontrado',
        upgrade: true 
      });
    }

    // Plano Gratuito NÃO tem acesso à Precificação
    if (user.plan.name === 'Gratuito') {
      return res.status(403).json({ 
        error: 'Precificação Inteligente disponível apenas nos planos Básico e Pro',
        feature: 'pricing',
        upgrade: true,
        message: 'Faça upgrade para calcular custos e precificar seus produtos'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro ao verificar permissão de precificação:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

// Verifica limite de orçamentos do plano
const checkQuoteLimit = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { plan: true }
    });

    if (!user || !user.plan) {
      return res.status(403).json({ error: 'Plano não encontrado' });
    }

    // Se o plano tem limite ilimitado (-1), permite
    if (user.plan.quotesLimit === -1) {
      req.user = user;
      return next();
    }

    // Verifica se atingiu o limite mensal
    if (user.quotesThisMonth >= user.plan.quotesLimit) {
      return res.status(403).json({ 
        error: 'Limite de orçamentos atingido',
        limit: user.plan.quotesLimit,
        used: user.quotesThisMonth,
        upgrade: true,
        message: `Você atingiu o limite de ${user.plan.quotesLimit} orçamentos do plano ${user.plan.name}. Faça upgrade para continuar.`
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro ao verificar limite de orçamentos:', error);
    return res.status(500).json({ error: 'Erro ao verificar limite' });
  }
};

// Verifica se o plano tem recursos avançados (Plano Pro)
const requireProPlan = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { plan: true }
    });

    if (!user || !user.plan) {
      return res.status(403).json({ error: 'Plano não encontrado' });
    }

    if (user.plan.name !== 'Pro') {
      return res.status(403).json({ 
        error: 'Recurso disponível apenas no Plano Pro',
        upgrade: true,
        message: 'Este recurso avançado está disponível apenas no plano Pro'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro ao verificar plano Pro:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

module.exports = {
  canAccessDashboard,
  canAccessPricing,
  checkQuoteLimit,
  requireProPlan
};
