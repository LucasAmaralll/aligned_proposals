import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import { useCompany } from '../context/CompanyContext';
import api from '../services/api';
import { formatDateTime } from '../utils/helpers';

const TYPE_LABELS = {
  entry: 'Entrada',
  exit: 'Saída',
  adjust: 'Ajuste',
  transfer_in: 'Transferência (entrada)',
  transfer_out: 'Transferência (saída)',
  sale: 'Venda',
  return: 'Devolução',
  exchange_in: 'Troca (entrada)',
  exchange_out: 'Troca (saída)',
  production: 'Produção',
};

const StockMovements = () => {
  const navigate = useNavigate();
  const { currentUnit } = useCompany();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  useEffect(() => {
    loadMovements();
  }, [currentUnit?.id, type, page]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stock/movements', {
        params: {
          unitId: currentUnit?.id,
          type: type || undefined,
          page,
          limit: 20,
        },
      });
      setMovements(response.data.movements || []);
      setPagination(response.data.pagination || { totalPages: 1, total: 0 });
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Movimentações">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/stock')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Voltar ao estoque
        </button>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Movimentações</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Histórico da unidade {currentUnit?.name || 'atual'}
            </p>
          </div>
          <select
            value={type}
            onChange={(e) => {
              setPage(1);
              setType(e.target.value);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <Loading />
        ) : movements.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma movimentação encontrada.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Qtd
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Motivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Usuário
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {movements.map((movement) => (
                    <tr key={movement.id}>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {formatDateTime(movement.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {TYPE_LABELS[movement.type] || movement.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <div>{movement.variant?.product?.name}</div>
                        <div className="text-gray-500">{movement.variant?.sku}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {parseFloat(movement.quantity || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {movement.reason || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {movement.createdBy?.name || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-3 border-t border-gray-200 dark:border-gray-700 text-sm">
                <span className="text-gray-500">{pagination.total} registros</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="px-3 py-1 border rounded-lg disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="px-3 py-1 border rounded-lg disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StockMovements;
