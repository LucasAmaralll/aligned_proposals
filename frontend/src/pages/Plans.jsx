import React, { useState, useEffect } from 'react';
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/solid';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Loading from '../components/Loading';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/helpers';

const Plans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/plans');
      setPlans(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      setUpgrading(true);
      
      // Aqui você integraria com Stripe ou outro gateway
      // Por enquanto, vamos simular a atualização do plano
      await api.post('/users/upgrade', { planId });
      
      alert('Plano atualizado com sucesso! Faça login novamente para ver as mudanças.');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
      alert(error.response?.data?.error || 'Erro ao fazer upgrade do plano');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Escolha seu Plano
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Seu plano atual: <span className="font-semibold text-blue-600 dark:text-blue-400">{user?.plan?.name}</span>
              </p>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrentPlan = user?.planId === plan.id;
                const isPro = plan.name === 'Pro';
                const isFree = plan.name === 'Gratuito';
                const canUpgrade = !isCurrentPlan && !isFree;

                return (
                  <div
                    key={plan.id}
                    className={`
                      relative bg-white dark:bg-gray-800 rounded-2xl border-2 p-8 flex flex-col
                      ${isPro 
                        ? 'border-gradient-to-br from-blue-500 to-purple-600 shadow-2xl scale-105' 
                        : isCurrentPlan
                          ? 'border-green-500 dark:border-green-400'
                          : 'border-gray-200 dark:border-gray-700'
                      }
                      ${isPro ? 'ring-4 ring-blue-500/20' : ''}
                    `}
                  >
                    {/* Badge */}
                    {isPro && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <SparklesIcon className="h-4 w-4" />
                        Mais Popular
                      </div>
                    )}
                    
                    {isCurrentPlan && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Plano Atual
                      </div>
                    )}

                    {/* Plan Name */}
                    <h3 className={`
                      text-2xl font-bold mb-2
                      ${isPro 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent' 
                        : 'text-gray-900 dark:text-white'
                      }
                    `}>
                      {plan.name}
                    </h3>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 mb-1">
                          /mês
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {plan.maxQuotes === -1 
                          ? 'Orçamentos ilimitados' 
                          : `Até ${plan.maxQuotes} orçamentos/mês`
                        }
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckIcon className={`
                            h-5 w-5 flex-shrink-0 mt-0.5
                            ${isPro ? 'text-purple-600 dark:text-purple-400' : 'text-green-600 dark:text-green-400'}
                          `} />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    {isCurrentPlan ? (
                      <Button
                        variant="secondary"
                        disabled
                        className="w-full"
                      >
                        Plano Atual
                      </Button>
                    ) : canUpgrade ? (
                      <Button
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={upgrading}
                        className={`
                          w-full
                          ${isPro 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                            : ''
                          }
                        `}
                      >
                        {upgrading ? 'Processando...' : 'Fazer Upgrade'}
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        disabled
                        className="w-full"
                      >
                        Plano Gratuito
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* FAQ/Info Section */}
            <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Informações sobre os Planos
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• Todos os planos incluem acesso completo às funcionalidades básicas</li>
                <li>• Você pode fazer upgrade ou downgrade a qualquer momento</li>
                <li>• O pagamento é processado de forma segura via Stripe</li>
                <li>• Cancele quando quiser, sem multas ou taxas adicionais</li>
                <li>• Suporte prioritário para planos pagos</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Plans;
