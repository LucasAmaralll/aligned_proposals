import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SubscriptionCancel.css';

const SubscriptionCancel = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/subscription-plans');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="subscription-cancel-container">
      <div className="cancel-card">
        <div className="cancel-icon">✕</div>

        <h1>Checkout Cancelado</h1>

        <div className="cancel-message">
          <p>Seu checkout foi cancelado.</p>
          <p>Você pode tentar novamente a qualquer momento.</p>
        </div>

        <div className="cancel-info">
          <p>Você será redirecionado para os planos em alguns segundos...</p>
        </div>

        <div className="cancel-actions">
          <button onClick={() => navigate('/subscription-plans')} className="btn btn-primary">
            Voltar aos Planos
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Ir para o Painel
          </button>
        </div>

        <div className="cancel-footer">
          <p>
            Tem alguma dúvida? <a href="mailto:support@example.com">Entre em contato com suporte</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCancel;
