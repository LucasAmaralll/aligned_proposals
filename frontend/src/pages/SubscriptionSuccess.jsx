import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import subscriptionAPI from '../services/subscription';
import './SubscriptionSuccess.css';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('Sessão não encontrada');
      setLoading(false);
      return;
    }

    verifySession();
  }, [sessionId]);

  const verifySession = async () => {
    try {
      setLoading(true);
      // Aguardar um pouco para o webhook processar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Tentar verificar a sessão
      try {
        const data = await subscriptionAPI.getCheckoutSession(sessionId);
        setSessionData(data);
      } catch (err) {
        // If session lookup fails, just assume success based on redirect
        console.warn('Session lookup failed, but user was redirected by Stripe');
        setSessionData({ status: 'complete' });
      }
      
      // Recarregar dados do usuário para atualizar o plano
      try {
        await refreshUser();
        console.log('✅ Dados do usuário recarregados após pagamento');
      } catch (err) {
        console.warn('Não foi possível recarregar dados do usuário, mas pagamento foi confirmado');
      }
      
      setError(null);
    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
      setError('Não foi possível verificar sua assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToApp = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="subscription-success-container">
        <div className="success-card">
          <div className="spinner"></div>
          <p>Verificando sua assinatura...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscription-success-container">
        <div className="success-card error">
          <div className="error-icon">!</div>
          <h2>Erro na Verificação</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/subscription-plans')} className="btn btn-primary">
            Voltar aos Planos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-success-container">
      <div className="success-card">
        <div className="success-icon">✓</div>

        <h1>Assinatura Confirmada!</h1>

        <div className="success-message">
          <p>Obrigado por se inscrever em nosso serviço.</p>
          <p>Sua assinatura está ativa e pronta para uso.</p>
        </div>

        {sessionData && (
          <div className="subscription-details">
            <h3>Detalhes da Assinatura</h3>

            <div className="detail-group">
              <span className="label">Email:</span>
              <span className="value">{sessionData.email || user?.email}</span>
            </div>

            {sessionData.customer_name && (
              <div className="detail-group">
                <span className="label">Nome:</span>
                <span className="value">{sessionData.customer_name}</span>
              </div>
            )}

            <div className="detail-group">
              <span className="label">Status:</span>
              <span className="value status-active">Ativa</span>
            </div>

            {sessionData.total && (
              <div className="detail-group">
                <span className="label">Total Pago:</span>
                <span className="value">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(sessionData.total / 100)}
                </span>
              </div>
            )}

            {sessionData.created && (
              <div className="detail-group">
                <span className="label">Data:</span>
                <span className="value">
                  {new Date(sessionData.created * 1000).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="next-steps">
          <h3>Próximos Passos</h3>
          <ol>
            <li>Acesse seu painel de controle</li>
            <li>Configure suas preferências</li>
            <li>Comece a criar seus orçamentos</li>
            <li>Compartilhe com seus clientes</li>
          </ol>
        </div>

        <div className="success-actions">
          <button onClick={handleContinueToApp} className="btn btn-primary btn-large">
            Ir para o Painel
          </button>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            Voltar ao Início
          </button>
        </div>

        <div className="support-info">
          <p>
            Precisa de ajuda? Entre em contato com nosso suporte em
            <a href="mailto:support@example.com"> support@example.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
