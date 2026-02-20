const express = require('express');
const subscriptionController = require('../controllers/subscription.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Rotas públicas
 */
router.get('/plans', subscriptionController.listPlans);
router.get('/session/:sessionId', subscriptionController.getCheckoutSession);

/**
 * Rotas protegidas
 */
router.post('/checkout-session', authMiddleware, subscriptionController.createCheckoutSession);
router.get('/info/:userId', authMiddleware, subscriptionController.getSubscriptionInfo);
router.post('/cancel', authMiddleware, subscriptionController.cancelSubscription);

// IMPORTANTE: updateSubscription é APENAS para webhook do Stripe, nunca exponha como endpoint público!
// O plano do usuário deve ser atualizado APENAS via webhook após pagamento confirmado

module.exports = router;
