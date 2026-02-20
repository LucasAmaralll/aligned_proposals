import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import subscriptionAPI from '../services/subscription';
import './SubscriptionDashboard.css';

const SubscriptionDashboard = () => {
  const { user, token } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState(null);
  const [processingChange, setProcessingChange] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadSubscriptionData();
  }, [user?.id]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionAPI.getSubscriptionInfo(user.id, token);
      setSubscription(data);
    } catch (err) {
      console.error('Erro ao carregar assinatura:', err);
      setError('Falha ao carregar informações de assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeplan = async () => {
    try {
      setLoadingPlans(true);
      const plansData = await subscriptionAPI.listPlans();
      setPlans(plansData);
      setShowChangeModal(true);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
      setError('Falha ao carregar planos disponíveis');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleUpgradePlan = async (newPlan) => {
    if (!window.confirm(`Deseja fazer upgrade para o plano ${newPlan.name}?`)) {
      return;
    }

    try {
      setProcessingChange(true);
      setError(null);
      await subscriptionAPI.updateSubscription(user.id, newPlan.stripePriceId, token);
      setSuccessMessage(`Assinatura atualizada para ${newPlan.name} com sucesso!`);
      setShowChangeModal(false);
      setSelectedNewPlan(null);
      setTimeout(() => loadSubscriptionData(), 2000);
    } catch (err) {
      console.error('Erro ao atualizar assinatura:', err);
      setError('Falha ao atualizar assinatura');
    } finally {
      setProcessingChange(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !window.confirm(
        'Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos premium.'
      )
    ) {
      return;
    }

    try {
      setError(null);
      await subscriptionAPI.cancelSubscription(user.id, token);
      setSuccessMessage('Sua assinatura foi cancelada com sucesso.');
      setTimeout(() => loadSubscriptionData(), 2000);
    } catch (err) {
      console.error('Erro ao cancelar assinatura:', err);
      setError('Falha ao cancelar assinatura');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'badge-active';
      case 'past_due':
        return 'badge-past-due';
      case 'cancelled':
        return 'badge-cancelled';
      default:
        return 'badge-unknown';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'past_due':
        return 'Atrasada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconhecida';
    }
  };

  if (loading) {
    return (
      <div className="subscription-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando informações de assinatura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-dashboard">
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="close-btn">
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="close-btn">
            ×
          </button>
        </div>
      )}

      <div className="dashboard-header">
        <h2>Gerenciar Assinatura</h2>
        {subscription?.subscription && (
          <button
            onClick={loadSubscriptionData}
            className="btn-refresh"
            title="Recarregar"
          >
            ↻
          </button>
        )}
      </div>

      {!subscription?.subscription ? (
        <div className="no-subscription">
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Nenhuma Assinatura Ativa</h3>
            <p>Você não possui uma assinatura ativa no momento.</p>
            <a href="/subscription-plans" className="btn btn-primary">
              Ver Planos Disponíveis
            </a>
          </div>
        </div>
      ) : (
        <div className="subscription-content">
          <div className="subscription-card">
            <div className="card-header">
              <h3>Plano Atual</h3>
              <span className={`badge ${getStatusBadgeClass(subscription.subscription.status)}`}>
                {getStatusText(subscription.subscription.status)}
              </span>
            </div>

            <div className="card-body">
              <div className="plan-info">
                <div className="info-group">
                  <label>Plano:</label>
                  <span className="plan-name">{subscription.plan?.name || 'Desconhecido'}</span>
                </div>

                <div className="info-group">
                  <label>Preço:</label>
                  <span className="plan-price">
                    {formatPrice(subscription.plan?.price || 0)}/{subscription.subscription.items.data[0]?.price.recurring?.interval ? 'mês' : 'período'}
                  </span>
                </div>

                {subscription.subscription.current_period_end && (
                  <div className="info-group">
                    <label>Próxima Renovação:</label>
                    <span className="renewal-date">
                      {formatDate(
                        new Date(subscription.subscription.current_period_end * 1000)
                      )}
                    </span>
                  </div>
                )}

                {subscription.subscription.cancel_at && (
                  <div className="info-group warning">
                    <label>Data de Cancelamento:</label>
                    <span className="cancel-date">
                      {formatDate(new Date(subscription.subscription.cancel_at * 1000))}
                    </span>
                  </div>
                )}

                {subscription.subscription.description && (
                  <div className="info-group">
                    <label>Descrição:</label>
                    <span>{subscription.subscription.description}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="card-footer">
              <button
                onClick={handleChangeplan}
                className="btn btn-primary"
                disabled={loadingPlans}
              >
                {loadingPlans ? 'Carregando...' : 'Alterar Plano'}
              </button>
              {subscription.subscription.status !== 'cancelled' && (
                <button onClick={handleCancelSubscription} className="btn btn-danger">
                  Cancelar Assinatura
                </button>
              )}
            </div>
          </div>

          {subscription.items && subscription.items.length > 0 && (
            <div className="subscription-items">
              <h3>Detalhes dos Itens</h3>
              <div className="items-list">
                {subscription.items.map((item, index) => (
                  <div key={index} className="item-card">
                    <div className="item-info">
                      <h4>{item.price?.product?.name || 'Produto'}</h4>
                      <p>{item.price?.product?.description}</p>
                    </div>
                    <div className="item-pricing">
                      <span className="amount">
                        {formatPrice(item.price?.unit_amount / 100 || 0)}
                      </span>
                      <span className="quantity">Qty: {item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal para trocar plano */}
      {showChangeModal && (
        <div className="modal-overlay" onClick={() => setShowChangeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Alterar Plano de Assinatura</h3>
              <button
                onClick={() => setShowChangeModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>Selecione um novo plano para sua assinatura:</p>

              <div className="plans-selector">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`plan-option ${selectedNewPlan?.id === plan.id ? 'selected' : ''}`}
                    onClick={() => setSelectedNewPlan(plan)}
                  >
                    <div className="option-header">
                      <h4>{plan.name}</h4>
                      <span className="option-price">
                        {formatPrice(plan.price || 0)}/mês
                      </span>
                    </div>
                    {plan.description && <p>{plan.description}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowChangeModal(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpgradePlan(selectedNewPlan)}
                disabled={!selectedNewPlan || processingChange}
                className="btn btn-primary"
              >
                {processingChange ? 'Atualizando...' : 'Confirmar Mudança'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDashboard;
