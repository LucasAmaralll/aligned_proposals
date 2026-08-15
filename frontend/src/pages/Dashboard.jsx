import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { formatCurrency, getPaymentMethodLabel } from '../utils/helpers';

const PERIODS = [
  { id: 'today', label: 'Hoje' },
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: 'month', label: 'Este mês' },
];

const StatCard = ({ title, value, hint }) => (
  <div className="surface p-5">
    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{title}</p>
    <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{value}</p>
    {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{hint}</p>}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { currentUnit, units, isSeller } = useCompany();
  const { darkMode } = useTheme();
  const [period, setPeriod] = useState('month');
  const [unitId, setUnitId] = useState('current');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUnit?.id && unitId === 'current') {
      loadDashboard();
    } else if (unitId !== 'current') {
      loadDashboard();
    }
  }, [period, unitId, currentUnit?.id]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const resolvedUnit = unitId === 'current' ? currentUnit?.id : unitId;
      const response = await api.get('/reports/dashboard', {
        params: {
          period,
          unitId: resolvedUnit || 'all',
        },
      });
      setData(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary || {};

  return (
    <Layout title={isSeller ? 'Meu desempenho' : 'Dashboard'}>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title={`Olá, ${user?.name?.split(' ')[0] || ''}`}
          description={
            isSeller
              ? 'Suas vendas e a comissão do período. O faturamento da empresa não aparece aqui.'
              : 'Faturamento, ticket e desempenho por loja e equipe'
          }
          actions={
          <div className="flex flex-wrap gap-3">
            {!isSeller && (
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="current">Unidade do header</option>
              <option value="all">Todas as unidades</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
            )}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              {PERIODS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPeriod(item.id)}
                  className={`px-3 py-2 text-sm ${
                    period === item.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          }
        />

        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title={isSeller ? 'Minhas vendas' : 'Faturamento'}
                value={formatCurrency(summary.gross || 0)}
                hint={isSeller ? `${summary.salesCount || 0} vendas` : `Líquido ${formatCurrency(summary.net || 0)}`}
              />
              {isSeller ? (
                <StatCard
                  title="Comissão"
                  value={
                    summary.commissionRate == null
                      ? 'Sem % definida'
                      : formatCurrency(summary.commission || 0)
                  }
                  hint={
                    summary.commissionRate == null
                      ? 'Peça ao admin para cadastrar sua comissão'
                      : `${summary.commissionRate}% sobre as vendas do período`
                  }
                />
              ) : (
                <StatCard
                  title="Vendas"
                  value={summary.salesCount || 0}
                  hint={`${summary.pieces || 0} peças`}
                />
              )}
              <StatCard
                title="Ticket médio"
                value={formatCurrency(summary.ticket || 0)}
              />
              <StatCard
                title="Devoluções / trocas"
                value={`${summary.returnsCount || 0} / ${summary.exchangesCount || 0}`}
                hint={`Estornos ${formatCurrency(summary.refunds || 0)}`}
              />
            </div>

            <div className="surface p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                {isSeller ? 'Suas vendas por dia' : 'Faturamento por dia'}
              </h2>
              {data?.byDay?.some((day) => day.total > 0) ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#4B5563' }}
                      />
                      <YAxis tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#4B5563' }} />
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                          borderColor: darkMode ? '#374151' : '#E5E7EB',
                          color: darkMode ? '#F9FAFB' : '#111827',
                        }}
                      />
                      <Bar dataKey="total" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma venda neste período.</p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="surface p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Por loja</h2>
                {(data?.byUnit || []).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sem dados.</p>
                ) : (
                  <table className="min-w-full text-sm">
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.byUnit.map((row) => (
                        <tr key={row.id || row.name}>
                          <td className="py-2 text-gray-900 dark:text-white">{row.name}</td>
                          <td className="py-2 text-gray-500 dark:text-gray-400">{row.count} vendas</td>
                          <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {!isSeller && (
              <div className="surface p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Por vendedor</h2>
                {(data?.bySeller || []).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sem dados.</p>
                ) : (
                  <table className="min-w-full text-sm">
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.bySeller.map((row) => (
                        <tr key={row.id}>
                          <td className="py-2 text-gray-900 dark:text-white">{row.name}</td>
                          <td className="py-2 text-gray-500 dark:text-gray-400">{row.count} vendas</td>
                          <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              )}
              <div className="surface p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Pagamentos</h2>
                {(data?.byPayment || []).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sem dados.</p>
                ) : (
                  <table className="min-w-full text-sm">
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.byPayment.map((row) => (
                        <tr key={row.method}>
                          <td className="py-2 text-gray-900 dark:text-white">
                            {getPaymentMethodLabel(row.method)}
                          </td>
                          <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="surface p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                  Produtos mais vendidos
                </h2>
                {(data?.topProducts || []).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sem dados.</p>
                ) : (
                  <table className="min-w-full text-sm">
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {data.topProducts.map((row) => (
                        <tr key={row.sku}>
                          <td className="py-2">
                            <div className="text-gray-900 dark:text-white">{row.productName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{row.sku}</div>
                          </td>
                          <td className="py-2 text-gray-500 dark:text-gray-400">{row.quantity} un</td>
                          <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {!isSeller && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{summary.clientsCount || 0} clientes cadastrados</span>
              <Link to="/quotes" className="text-blue-600 dark:text-blue-400">
                {summary.pendingQuotes || 0} orçamentos pendentes
              </Link>
            </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
