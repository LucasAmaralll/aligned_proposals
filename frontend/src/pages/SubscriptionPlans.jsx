import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscriptionService } from '../services/subscription';
import Layout from '../components/Layout';
import '../pages/SubscriptionPlans.css';

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await subscriptionService.getPlans();
      setPlans(response.data || []);
    } catch (err) {
      setError('Erro ao carregar planos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (plan) => {
    // Plano Gratuito não precisa de checkout
    if (plan.price === 0) {
      setError('Você já está no plano Gratuito ou não precisa fazer pagamento');
      return;
    }

    setSelectedPlan(plan);
    setCheckingOut(true);
    setError(null);

    try {
      const response = await subscriptionService.createCheckoutSession({
        planId: plan.id,
        cancelUrl: `${window.location.origin}/subscription-cancel`,
        successUrl: `${window.location.origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      });

      if (response.data?.url) {
        // Redirecionar para a URL de checkout do Stripe
        window.location.href = response.data.url;
      } else if (response.data?.sessionId) {
        // Fallback para método antigo se ainda existir
        console.warn('Usando método deprecado stripe.redirectToCheckout()');
        const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
        stripe.redirectToCheckout({ sessionId: response.data.sessionId })
          .then(result => {
            if (result.error) {
              setError(result.error.message);
            }
          });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao iniciar checkout');
      console.error('Erro no checkout:', err);
    } finally {
      setCheckingOut(false);
      setSelectedPlan(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="subscription-plans">
          <div className="loading-spinner">Carregando planos...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="subscription-plans">
        <div className="plans-header">
          <h1>Planos de Subscrição</h1>
          <p>Escolha o plano perfeito para suas necessidades</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="plans-grid">
          {plans.map((plan) => (
            <div key={plan.id} className="plan-card">
              <h2 className="plan-name">{plan.name}</h2>
              
              <p className="plan-description">
                {plan.quotesLimit === -1 
                  ? 'Plano ilimitado' 
                  : `Até ${plan.quotesLimit} orçamentos por mês`}
              </p>

              <div className="plan-price">
                R$ {parseFloat(plan.price).toFixed(2)}
                <span className="plan-price-period">/mês</span>
              </div>

              <div className="plan-features">
                {Array.isArray(plan.features) ? (
                  <ul>
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                ) : (
                  <ul>
                    {JSON.parse(plan.features || '[]').map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                )}
              </div>

              {user?.planId === plan.id ? (
                <button className="plan-action" disabled>
                  ✓ Seu Plano Atual
                </button>
              ) : (
                <button
                  className="plan-action"
                  onClick={() => handleCheckout(plan)}
                  disabled={checkingOut && selectedPlan?.id === plan.id}
                >
                  {checkingOut && selectedPlan?.id === plan.id 
                    ? 'Processando...' 
                    : 'Escolher'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPlans;
