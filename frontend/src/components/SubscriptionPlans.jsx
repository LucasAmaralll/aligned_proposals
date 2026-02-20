import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import subscriptionAPI from '../services/subscription';
import { useAuth } from '../context/AuthContext';
import './SubscriptionPlans.css';

const SubscriptionPlans = () => {
  const { user, token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    loadPlans();
    if (user?.id) {
      loadSubscriptionInfo();
    }
  }, [user?.id]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const plansData = await subscriptionAPI.listPlans();
      setPlans(plansData);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
      setError('Falha ao carregar planos de assinatura');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionInfo = async () => {
    try {
      const info = await subscriptionAPI.getSubscriptionInfo(user.id, token);
      if (info.subscription) {
        setCurrentSubscription(info);
      }
    } catch (err) {
      console.error('Erro ao carregar informações de assinatura:', err);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleCheckout = async (plan) => {
    if (!STRIPE_PUBLISHABLE_KEY) {
      setError('Chave Stripe publicável não configurada');
      return;
    }

    try {
      setProcessingPlan(plan.id);
      setError(null);

      // Criar sessão de checkout
      const sessionData = await subscriptionAPI.createCheckoutSession(
        user.id,
        plan.stripePriceId,
        token
      );

      // Redirecionar para Stripe Checkout
      const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
      await stripe.redirectToCheckout({ sessionId: sessionData.sessionId });
    } catch (err) {
      console.error('Erro durante checkout:', err);
      setError(err.response?.data?.error || 'Erro ao processar checkout');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar sua assinatura?')) {
      return;
    }

    try {
      setProcessingPlan('cancel');
      await subscriptionAPI.cancelSubscription(user.id, token);
      setCurrentSubscription(null);
      loadPlans();
    } catch (err) {
      console.error('Erro ao cancelar assinatura:', err);
      setError('Falha ao cancelar assinatura');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleUpgradePlan = async (newPlan) => {
    if (!window.confirm(`Deseja fazer upgrade para o plano ${newPlan.name}?`)) {
      return;
    }

    try {
      setProcessingPlan(newPlan.id);
      await subscriptionAPI.updateSubscription(
        user.id,
        newPlan.stripePriceId,
        token
      );
      loadSubscriptionInfo();
    } catch (err) {
      console.error('Erro ao atualizar assinatura:', err);
      setError('Falha ao atualizar assinatura');
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="subscription-loading">
        <div className="spinner"></div>
        <p>Carregando planos de assinatura...</p>
      </div>
    );
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatBillingInterval = (interval) => {
    const intervals = {
      month: 'mensal',
      year: 'anual',
      week: 'semanal',
      day: 'diário'
    };
    return intervals[interval] || interval;
  };

  return (
    <div className="subscription-plans-container">
      <div className="subscription-header">
        <h1>Planos de Assinatura</h1>
        <p>Escolha o plano que melhor atende às suas necessidades</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      {currentSubscription && currentSubscription.subscription && (
        <div className="current-subscription">
          <div className="subscription-info">
            <h3>Sua Assinatura Atual</h3>
            <p className="plan-name">
              {currentSubscription.plan?.name || 'Plano Ativo'}
            </p>
            <p className="plan-price">
              {formatPrice(currentSubscription.plan?.price || 0)}
              <span> / {formatBillingInterval(
                currentSubscription.subscription.items.data[0]?.price.recurring?.interval || 'month'
              )}</span>
            </p>
            <p className="renewal-date">
              Próxima renovação:{' '}
              {new Date(currentSubscription.endsAt).toLocaleDateString('pt-BR')}
            </p>
            <button
              onClick={handleCancelSubscription}
              disabled={processingPlan === 'cancel'}
              className="btn btn-secondary"
            >
              {processingPlan === 'cancel' ? 'Cancelando...' : 'Cancelar Assinatura'}
            </button>
          </div>
        </div>
      )}

      <div className="plans-grid">
        {plans.map((plan) => {
          const price = plan.stripePriceDetails
            ? plan.stripePriceDetails.unit_amount / 100
            : plan.price;
          const interval = plan.stripePriceDetails?.recurring?.interval || 'month';
          const isCurrentPlan = currentSubscription?.plan?.id === plan.id;
          const canUpgrade = currentSubscription && !isCurrentPlan;

          return (
            <div
              key={plan.id}
              className={`plan-card ${isCurrentPlan ? 'current' : ''} ${
                selectedPlan?.id === plan.id ? 'selected' : ''
              }`}
              onClick={() => handleSelectPlan(plan)}
            >
              {isCurrentPlan && <span className="badge-current">Plano Atual</span>}

              <div className="plan-header">
                <h3>{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
              </div>

              <div className="plan-price">
                <div className="price-amount">
                  {formatPrice(price)}
                  <span className="period">/{formatBillingInterval(interval)}</span>
                </div>
              </div>

              <div className="plan-features">
                <h4>Recursos incluídos:</h4>
                <ul>
                  {typeof plan.features === 'string' &&
                    JSON.parse(plan.features || '[]').map((feature, idx) => (
                      <li key={idx}>
                        <span className="check-icon">✓</span>
                        {feature}
                      </li>
                    ))}
                  {Array.isArray(plan.features) &&
                    plan.features.map((feature, idx) => (
                      <li key={idx}>
                        <span className="check-icon">✓</span>
                        {feature}
                      </li>
                    ))}
                  <li>
                    <span className="check-icon">✓</span>
                    Limite de orçamentos: {plan.quotesLimit === -1 ? 'Ilimitado' : plan.quotesLimit}
                  </li>
                  {plan.hasWatermark && (
                    <li>
                      <span className="x-icon">✕</span>
                      Marca d'água nos PDF
                    </li>
                  )}
                  {!plan.hasWatermark && (
                    <li>
                      <span className="check-icon">✓</span>
                      Sem marca d'água
                    </li>
                  )}
                </ul>
              </div>

              <div className="plan-actions">
                {isCurrentPlan ? (
                  <button disabled className="btn btn-primary">
                    Seu Plano Atual
                  </button>
                ) : canUpgrade ? (
                  <button
                    onClick={() => handleUpgradePlan(plan)}
                    disabled={processingPlan === plan.id}
                    className="btn btn-primary"
                  >
                    {processingPlan === plan.id ? 'Atualizando...' : 'Fazer Upgrade'}
                  </button>
                ) : user ? (
                  <button
                    onClick={() => handleCheckout(plan)}
                    disabled={processingPlan === plan.id}
                    className="btn btn-primary"
                  >
                    {processingPlan === plan.id ? 'Processando...' : 'Assinar Agora'}
                  </button>
                ) : (
                  <p className="login-required">Faça login para assinar</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!plans || plans.length === 0 && !loading && (
        <div className="no-plans">
          <p>Nenhum plano disponível no momento</p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
