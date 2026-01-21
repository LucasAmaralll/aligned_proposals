const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const prisma = new PrismaClient();

class PaymentController {
  async createCheckoutSession(req, res) {
    try {
      const { planId } = req.body;

      const plan = await prisma.plan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        return res.status(404).json({ error: 'Plano não encontrado' });
      }

      if (!plan.stripePriceId) {
        return res.status(400).json({ error: 'Plano não disponível para assinatura' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId }
      });

      // Criar sessão de checkout do Stripe
      const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/plans`,
        metadata: {
          userId: user.id,
          planId: plan.id
        }
      });

      return res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      return res.status(500).json({ error: 'Erro ao criar sessão de pagamento' });
    }
  }

  async webhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Processar evento
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  async handleCheckoutCompleted(session) {
    const { userId, planId } = session.metadata;

    // Atualizar usuário com nova assinatura
    await prisma.user.update({
      where: { id: userId },
      data: {
        planId,
        subscriptionId: session.subscription,
        subscriptionStatus: 'active',
        subscriptionEndsAt: null,
        quotesThisMonth: 0,
        quotesResetAt: new Date()
      }
    });

    // Criar registro de pagamento
    const plan = await prisma.plan.findUnique({ where: { id: planId } });

    await prisma.payment.create({
      data: {
        userId,
        stripeSessionId: session.id,
        stripePaymentId: session.payment_intent,
        amount: session.amount_total / 100,
        currency: session.currency.toUpperCase(),
        status: 'completed',
        planName: plan.name
      }
    });
  }

  async handleSubscriptionUpdated(subscription) {
    const user = await prisma.user.findFirst({
      where: { subscriptionId: subscription.id }
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: subscription.status
        }
      });
    }
  }

  async handleSubscriptionDeleted(subscription) {
    const user = await prisma.user.findFirst({
      where: { subscriptionId: subscription.id }
    });

    if (user) {
      // Buscar plano gratuito
      const freePlan = await prisma.plan.findUnique({
        where: { name: 'Gratuito' }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          planId: freePlan.id,
          subscriptionStatus: 'canceled',
          subscriptionId: null
        }
      });
    }
  }

  async listPayments(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: { userId: req.userId },
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit)
        }),
        prisma.payment.count({ where: { userId: req.userId } })
      ]);

      return res.json({
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Erro ao listar pagamentos:', error);
      return res.status(500).json({ error: 'Erro ao listar pagamentos' });
    }
  }

  async cancelSubscription(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId }
      });

      if (!user.subscriptionId) {
        return res.status(400).json({ error: 'Nenhuma assinatura ativa' });
      }

      // Cancelar no Stripe
      await stripe.subscriptions.cancel(user.subscriptionId);

      return res.json({ message: 'Assinatura cancelada com sucesso' });
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      return res.status(500).json({ error: 'Erro ao cancelar assinatura' });
    }
  }
}

module.exports = new PaymentController();
