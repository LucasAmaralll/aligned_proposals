import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Loading from '../components/Loading';
import Button from '../components/Button';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import {
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/users/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const quotesRemaining = () => {
    if (user?.plan?.quotesLimit === -1) {
      return 'Ilimitado';
    }
    const remaining = user.plan.quotesLimit - user.quotesThisMonth;
    return remaining > 0 ? remaining : 0;
  };

  const hasAccessToDashboard = () => {
    return user?.plan?.name !== 'Gratuito';
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`w-14 h-14 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <Loading fullScreen />;
  }

  // Se não tem acesso ao dashboard, mostra tela de bloqueio
  if (!hasAccessToDashboard()) {
    return (
      <Layout title="Dashboard">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-6 mb-6">
            <LockClosedIcon className="w-16 h-16 text-yellow-600 dark:text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Dashboard Bloqueado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            O Dashboard está disponível apenas nos planos Básico e Pro.
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8 max-w-md">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Com o Dashboard você terá:
            </h3>
            <ul className="text-left space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Estatísticas detalhadas de clientes e orçamentos</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Gráficos e análises de desempenho</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Acompanhamento de atividades recentes</span>
              </li>
            </ul>
          </div>
          <Button
            onClick={() => navigate('/plans')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Ver Planos e Fazer Upgrade
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-6 sm:p-8 mb-6 text-white">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">
          Olá, {user?.name}! 👋
        </h2>
        <p className="text-sm sm:text-base text-blue-100">
          Bem-vindo ao seu painel de controle. Aqui você pode gerenciar seus orçamentos e clientes.
        </p>
      </div>

          {/* Plan info */}
          <div className="bg-white dark:bg-gray-800 border-l-4 border-blue-600 dark:border-blue-400 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Plano {user?.plan?.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Orçamentos restantes este mês: <span className="font-semibold">{quotesRemaining()}</span>
                </p>
              </div>
              {user?.plan?.name === 'Gratuito' && (
                <a
                  href="/plans"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fazer Upgrade
                </a>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total de Clientes"
              value={stats?._count?.clients || 0}
              icon={UserGroupIcon}
              color="bg-blue-500"
            />
            <StatCard
              title="Total de Orçamentos"
              value={stats?._count?.quotes || 0}
              icon={DocumentTextIcon}
              color="bg-purple-500"
            />
            <StatCard
              title="Aprovados"
              value={stats?.quotesByStatus?.approved || 0}
              icon={CheckCircleIcon}
              color="bg-green-500"
            />
            <StatCard
              title="Pendentes"
              value={stats?.quotesByStatus?.pending || 0}
              icon={ClockIcon}
              color="bg-yellow-500"
            />
          </div>

          {/* Charts placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Orçamentos por Status</h3>
              <div className="flex items-center justify-center h-64">
                <ChartBarIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-400 dark:text-gray-500 ml-4">Gráfico em breve</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Atividade Recente</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stats?.quotesByStatus?.approved || 0} orçamentos aprovados
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stats?.quotesByStatus?.pending || 0} orçamentos pendentes
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stats?.quotesByStatus?.rejected || 0} orçamentos rejeitados
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </Layout>
  );
};

export default Dashboard;
