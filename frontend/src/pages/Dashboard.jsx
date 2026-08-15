import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      const clientsData = response.data?.clients || response.data || [];
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClients([]);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedClient]);

  const fetchStats = async () => {
    try {
      const url = selectedClient === 'all' 
        ? '/users/stats' 
        : `/users/stats?clientId=${selectedClient}`;
      const response = await api.get(url);
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
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

          {/* Cliente Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filtrar por Cliente</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
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
            <StatCard
              title="Reprovados"
              value={stats?.quotesByStatus?.rejected || 0}
              icon={XCircleIcon}
              color="bg-red-500"
            />
            <StatCard
              title="Sem Retorno"
              value={stats?.quotesByStatus?.no_return || 0}
              icon={NoSymbolIcon}
              color="bg-gray-500"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Orçamentos por Status</h3>
              <div className="flex items-center justify-center h-64">
                {stats?.quotesByStatus && (
                  stats.quotesByStatus.pending === 0 && 
                  stats.quotesByStatus.approved === 0 && 
                  stats.quotesByStatus.rejected === 0 && 
                  stats.quotesByStatus.no_return === 0
                ) ? (
                  <p className="text-gray-500 dark:text-gray-400">Nenhum orçamento cadastrado</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pendentes', value: stats?.quotesByStatus?.pending || 0, fill: '#FBBF24' },
                          { name: 'Aprovados', value: stats?.quotesByStatus?.approved || 0, fill: '#10B981' },
                          { name: 'Reprovados', value: stats?.quotesByStatus?.rejected || 0, fill: '#EF4444' },
                          { name: 'Sem Retorno', value: stats?.quotesByStatus?.no_return || 0, fill: '#9CA3AF' },
                        ]}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#FBBF24" />
                        <Cell fill="#10B981" />
                        <Cell fill="#EF4444" />
                        <Cell fill="#9CA3AF" />
                      </Pie>
                      <Tooltip 
                        formatter={(value) => `${value} orçamentos`}
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F3F4F6'
                        }} 
                      />
                      <Legend 
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry) => `${entry.payload.name}: ${entry.payload.value}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
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
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stats?.quotesByStatus?.rejected || 0} orçamentos rejeitados
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stats?.quotesByStatus?.no_return || 0} orçamentos sem retorno
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
