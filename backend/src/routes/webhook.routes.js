const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const subscriptionService = require('../services/subscription.service');

const router = express.Router();

/**
 * Webhook handler para eventos da Stripe
 * POST /api/webhooks/stripe
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('⚠️  STRIPE_WEBHOOK_SECRET não configurado');
    return res.status(400).send('STRIPE_WEBHOOK_SECRET não configurado');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (error) {
    console.error('⚠️  Webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Log do evento
  console.log(`\n📨 Webhook recebido: ${event.type}`);

  try {
    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed':
        await subscriptionService.handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'invoice.paid':
        await subscriptionService.handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await subscriptionService.handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await subscriptionService.handleSubscriptionDeleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        console.log('📝 Assinatura atualizada:', event.data.object.id);
        break;

      default:
        console.log(`⏭️  Evento não tratado: ${event.type}`);
    }

    // Retornar sucesso ao Stripe
    res.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    // Retornar sucesso mesmo com erro para evitar retry do Stripe
    // (você pode implementar fila de processamento aqui)
    res.status(200).json({ received: true, error: error.message });
  }
});

/**
 * Health check para webhook
 * GET /api/webhooks/health
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

module.exports = router;
