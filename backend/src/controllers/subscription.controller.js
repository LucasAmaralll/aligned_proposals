const subscriptionService = require('../services/subscription.service');

/**
 * POST /api/subscriptions/checkout-session
 * Cria uma sessão de checkout para assinatura
 */
const createCheckoutSession = async (req, res) => {
  try {
    const { planId, cancelUrl, successUrl } = req.body;
    const userId = req.user.id; // Do JWT token

    if (!planId) {
      return res.status(400).json({
        error: 'planId é obrigatório'
      });
    }

    const session = await subscriptionService.createCheckoutSession(userId, planId, { cancelUrl, successUrl });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/subscriptions/session/:sessionId
 * Recupera status de uma sessão de checkout
 */
const getCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await subscriptionService.getCheckoutSession(sessionId);

    res.json({
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email,
      subscriptionId: session.subscription
    });
  } catch (error) {
    console.error('Erro ao recuperar sessão:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/subscriptions/info/:userId
 * Recupera informações de assinatura do usuário
 */
const getSubscriptionInfo = async (req, res) => {
  try {
    const { userId } = req.params;

    const info = await subscriptionService.getSubscriptionInfo(userId);

    res.json(info);
  } catch (error) {
    console.error('Erro ao recuperar informações de assinatura:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/subscriptions/cancel
 * Cancela uma assinatura
 */
const cancelSubscription = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    const subscription = await subscriptionService.cancelSubscription(userId);

    res.json({
      message: 'Assinatura cancelada com sucesso',
      subscriptionId: subscription.id,
      status: subscription.status
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/subscriptions/update
 * Atualiza uma assinatura (troca de plano)
 */
const updateSubscription = async (req, res) => {
  try {
    const { userId, newPriceId } = req.body;

    if (!userId || !newPriceId) {
      return res.status(400).json({
        error: 'userId e newPriceId são obrigatórios'
      });
    }

    const subscription = await subscriptionService.updateSubscription(userId, newPriceId);

    res.json({
      message: 'Assinatura atualizada com sucesso',
      subscriptionId: subscription.id,
      status: subscription.status
    });
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/subscriptions/plans
 * Lista todos os planos disponíveis
 */
const listPlans = async (req, res) => {
  try {
    const plans = await subscriptionService.listPlans();
    res.json(plans);
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createCheckoutSession,
  getCheckoutSession,
  getSubscriptionInfo,
  cancelSubscription,
  updateSubscription,
  listPlans
};
