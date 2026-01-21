const express = require('express');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Webhook do Stripe (sem autenticação)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), paymentController.webhook);

// Rotas protegidas
router.use(authMiddleware);

router.post('/create-checkout', paymentController.createCheckoutSession);
router.get('/history', paymentController.listPayments);
router.post('/cancel-subscription', paymentController.cancelSubscription);

module.exports = router;
