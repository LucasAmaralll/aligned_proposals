const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Cria um cliente Stripe para um usuário
 */
const createStripeCustomer = async (email, name, userId) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId
      }
    });
    
    // Salvar ID do cliente Stripe no banco
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id }
    });

    return customer;
  } catch (error) {
    console.error('Erro ao criar cliente Stripe:', error);
    throw error;
  }
};

/**
 * Cria uma sessão de checkout para assinatura
 */
const createCheckoutSession = async (userId, planId, options = {}) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Procurar o plano
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      throw new Error('Plano não encontrado');
    }

    if (!plan.stripePriceId) {
      throw new Error('Plano não tem Price ID do Stripe configurado');
    }

    // Criar ou obter cliente Stripe
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await createStripeCustomer(user.email, user.name, userId);
      stripeCustomerId = customer.id;
    }

    // URLs com fallback
    const successUrl = options.successUrl || `${process.env.FRONTEND_URL}/subscription-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = options.cancelUrl || `${process.env.FRONTEND_URL}/subscription-cancel`;

    // Criar sessão de checkout com suporte a embedded checkout (permite customização)
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'required',
      customer_update: {
        address: 'never',
        name: 'never'
      },
      // Suporte a UI embarcada (permite aplicar temas)
      ui_mode: 'hosted',
      // Variáveis de tema (Stripe respeita prefers-color-scheme automaticamente)
      locale: 'pt_BR'
    });

    return session;
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw error;
  }
};

/**
 * Recupera status de uma sessão de checkout
 */
const getCheckoutSession = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error('Erro ao recuperar sessão:', error);
    throw error;
  }
};

/**
 * Processa um evento de assinatura bem-sucedida
 */
const handleCheckoutSessionCompleted = async (session) => {
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  try {
    // Recuperar dados da assinatura
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Recuperar cliente Stripe para obter userId
    const customer = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata.userId;

    // Recuperar dados do preço para obter o plano
    const priceId = subscription.items.data[0].price.id;
    const plan = await prisma.plan.findUnique({
      where: { stripePriceId: priceId }
    });

    // Atualizar usuário com dados de assinatura
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'active',
        planId: plan?.id || null,
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
      }
    });

    console.log(`✅ Assinatura criada para usuário ${userId}`);
    return true;
  } catch (error) {
    console.error('Erro ao processar checkout:', error);
    throw error;
  }
};

/**
 * Processa um evento de fatura paga
 */
const handleInvoicePaid = async (invoice) => {
  const subscriptionId = invoice.subscription;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;

    // Atualizar status de assinatura
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'active',
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
      }
    });

    console.log(`✅ Fatura paga para usuário ${userId}`);
    return true;
  } catch (error) {
    console.error('Erro ao processar fatura paga:', error);
    throw error;
  }
};

/**
 * Processa um evento de falha de pagamento
 */
const handleInvoicePaymentFailed = async (invoice) => {
  const subscriptionId = invoice.subscription;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;

    // Atualizar status para past_due
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'past_due'
      }
    });

    console.log(`⚠️ Falha de pagamento para usuário ${userId}`);
    return true;
  } catch (error) {
    console.error('Erro ao processar falha de pagamento:', error);
    throw error;
  }
};

/**
 * Processa cancelamento de assinatura
 */
const handleSubscriptionDeleted = async (subscription) => {
  const customerId = subscription.customer;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata.userId;

    // Atualizar status para cancelled
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'cancelled',
        stripeSubscriptionId: null,
        subscriptionCancelledAt: new Date()
      }
    });

    console.log(`❌ Assinatura cancelada para usuário ${userId}`);
    return true;
  } catch (error) {
    console.error('Erro ao processar cancelamento:', error);
    throw error;
  }
};

/**
 * Cancela uma assinatura
 */
const cancelSubscription = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.stripeSubscriptionId) {
      throw new Error('Usuário não possui assinatura ativa');
    }

    // Cancelar assinatura na Stripe
    const subscription = await stripe.subscriptions.del(user.stripeSubscriptionId);

    // Atualizar no banco (webhook também processará)
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'cancelled_pending',
        subscriptionCancelledAt: new Date()
      }
    });

    return subscription;
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    throw error;
  }
};

/**
 * Atualiza uma assinatura (alteração de plano)
 */
const updateSubscription = async (userId, newPriceId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.stripeSubscriptionId) {
      throw new Error('Usuário não possui assinatura ativa');
    }

    // Recuperar assinatura atual
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    // Atualizar item da assinatura
    const updatedSubscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId
          }
        ],
        proration_behavior: 'create_prorations'
      }
    );

    // Obter novo plano
    const newPlan = await prisma.plan.findUnique({
      where: { stripePriceId: newPriceId }
    });

    // Atualizar usuário
    if (newPlan) {
      await prisma.user.update({
        where: { id: userId },
        data: { planId: newPlan.id }
      });
    }

    return updatedSubscription;
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    throw error;
  }
};

/**
 * Recupera informações de assinatura de um usuário
 */
const getSubscriptionInfo = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (!user.stripeSubscriptionId) {
      return {
        status: 'inactive',
        user,
        subscription: null
      };
    }

    // Recuperar dados de assinatura da Stripe
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    return {
      status: user.subscriptionStatus,
      user,
      subscription,
      plan: user.plan,
      endsAt: user.subscriptionEndsAt
    };
  } catch (error) {
    console.error('Erro ao recuperar informações de assinatura:', error);
    throw error;
  }
};

/**
 * Lista todos os planos disponíveis com informações de preço
 */
const listPlans = async () => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' }
    });

    // Enriquecer com dados da Stripe (apenas planos pagos)
    const enrichedPlans = await Promise.all(
      plans.map(async (plan) => {
        try {
          // Apenas enriquecer com dados Stripe se tiver stripePriceId
          if (plan.stripePriceId) {
            const price = await stripe.prices.retrieve(plan.stripePriceId);       
            return {
              ...plan,
              stripePriceDetails: price
            };
          }
          return plan;
        } catch {
          return plan;
        }
      })
    );

    return enrichedPlans;
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    throw error;
  }
};

module.exports = {
  createStripeCustomer,
  createCheckoutSession,
  getCheckoutSession,
  handleCheckoutSessionCompleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleSubscriptionDeleted,
  cancelSubscription,
  updateSubscription,
  getSubscriptionInfo,
  listPlans
};
