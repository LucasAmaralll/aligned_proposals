import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../services/subscription';
import Layout from '../components/Layout';
import '../pages/SubscriptionDashboard.css';

const SubscriptionDashboard = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    if (!user?.subscriptionId) {
      navigate('/subscription-plans');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subResponse, plansResponse] = await Promise.all([
        subscriptionService.getSubscription(),
        subscriptionService.getPlans(),
      ]);

      setSubscription(subResponse.data);
      setPlans(plansResponse.data || []);
    } catch (err) {
      setError('Erro ao carregar dados da subscrição');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar sua subscrição?')) {
      return;
    }

    try {
      setActionInProgress(true);
      setError(null);
      await subscriptionService.cancelSubscription();
      await refreshUser();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao cancelar subscrição');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleChangePlan = async (newPlanId) => {
    try {
      setActionInProgress(true);
      setError(null);

      const response = await subscriptionService.changePlan({
        newPlanId,
        cancelUrl: `${window.location.origin}/subscription-cancel`,
        successUrl: `${window.location.origin}/subscription-success`,
      });

      if (response.data?.sessionId) {
        const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
        stripe.redirectToCheckout({ sessionId: response.data.sessionId });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao mudar plano');
    } finally {
      setActionInProgress(false);
      setShowChangePlanModal(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="subscription-dashboard">
          <div className="loading-spinner">Carregando...</div>
        </div>
      </Layout>
    );
  }

  if (!subscription) {
    return (
      <Layout>
        <div className="subscription-dashboard">
          <div className="error-message">Nenhuma subscrição ativa</div>
          <button onClick={() => navigate('/subscription-plans')} className="btn btn-primary">
            Ver Planos
          </button>
        </div>
      </Layout>
    );
  }

  const currentPlan = plans.find((p) => p.id === user?.planId);

  return (
    <Layout>
      <div className="subscription-dashboard">
        <div className="dashboard-header">
          <h1>Sua Subscrição</h1>
          <p>Gerencie sua conta e plano</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="subscription-info">
          <div className="info-section">
            <h2>Plano Atual</h2>
            {currentPlan && (
              <div className="plan-info">
                <p>
                  <strong>{currentPlan.name}</strong> - R$ {parseFloat(currentPlan.price).toFixed(2)}/mês
                </p>
                <p className="plan-status">
                  Status: <strong>{subscription.status}</strong>
                </p>
                {subscription.currentPeriodEnd && (
                  <p className="renewal-date">
                    Próxima renovação:{' '}
                    <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="subscription-actions">
            <h2>Ações</h2>
            <div className="action-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => setShowChangePlanModal(true)}
                disabled={actionInProgress}
              >
                Mudar Plano
              </button>
              <button
                className="btn btn-danger"
                onClick={handleCancelSubscription}
                disabled={actionInProgress}
              >
                Cancelar Subscrição
              </button>
            </div>
          </div>
        </div>

        {/* Modal para mudar plano */}
        {showChangePlanModal && (
          <div className="modal-overlay" onClick={() => setShowChangePlanModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Escolha um Novo Plano</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowChangePlanModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="plans-selector">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`plan-option ${plan.id === currentPlan?.id ? 'current' : ''}`}
                  >
                    <div className="plan-option-info">
                      <h3>{plan.name}</h3>
                      <p>R$ {parseFloat(plan.price).toFixed(2)}/mês</p>
                    </div>
                    {plan.id !== currentPlan?.id && (
                      <button
                        className="btn btn-small"
                        onClick={() => handleChangePlan(plan.id)}
                        disabled={actionInProgress}
                      >
                        Selecionar
                      </button>
                    )}
                    {plan.id === currentPlan?.id && <span className="badge-current">Atual</span>}
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowChangePlanModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SubscriptionDashboard;
