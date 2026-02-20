import api from './api';

export const subscriptionService = {
  /**
   * Listar todos os planos disponíveis
   */
  getPlans: async () => {
    const response = await api.get('/subscriptions/plans');
    return response;
  },

  /**
   * Criar uma sessão de checkout
   */
  createCheckoutSession: async (data) => {
    const { planId, cancelUrl, successUrl } = data;
    const response = await api.post(
      '/subscriptions/checkout-session',
      { planId, cancelUrl, successUrl }
    );
    return response;
  },

  /**
   * Obter informações de assinatura do usuário
   */
  getSubscription: async () => {
    const response = await api.get('/subscriptions/me');
    return response;
  },

  /**
   * Cancelar assinatura
   */
  cancelSubscription: async () => {
    const response = await api.delete('/subscriptions/cancel');
    return response;
  },

  /**
   * Mudar de plano
   */
  changePlan: async (data) => {
    const response = await api.post(
      '/subscriptions/change-plan',
      data
    );
    return response;
  }
};

export default subscriptionService;
