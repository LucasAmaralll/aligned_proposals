import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import Button from '../components/Button';
import { useCompany } from '../context/CompanyContext';
import api from '../services/api';
import { formatCurrency, formatDateTime, formatSaleNumber, getSaleChannelLabel, getSaleOriginLabel, getSaleStatusLabel } from '../utils/helpers';

const Sales = () => {
  const { currentUnit } = useCompany();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  useEffect(() => {
    if (currentUnit?.id) {
      loadSales();
    }
  }, [currentUnit?.id, page, channelFilter]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sales', {
        params: {
          unitId: currentUnit.id,
          search: search || undefined,
          channel: channelFilter === 'all' ? undefined : channelFilter,
          page,
          limit: 20,
        },
      });
      setSales(response.data.sales || []);
      setPagination(response.data.pagination || { totalPages: 1, total: 0 });
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Vendas">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendas</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Varejo e atacado da unidade {currentUnit?.name || 'atual'}. O orçamento é só a proposta — a venda entra aqui.
            </p>
          </div>
          <Link
            to="/sales/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5" />
            Nova venda
          </Link>
        </div>

        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número da venda ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  loadSales();
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setPage(1);
              loadSales();
            }}
          >
            Buscar
          </Button>
          <select
            value={channelFilter}
            onChange={(e) => {
              setPage(1);
              setChannelFilter(e.target.value);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">Todas</option>
            <option value="retail">Varejo</option>
            <option value="wholesale">Atacado</option>
          </select>
        </div>

        {loading ? (
          <Loading />
        ) : sales.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhuma venda</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Abra o PDV para registrar a primeira venda desta unidade.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nº</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Canal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vendedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Itens</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium">
                      <Link to={`/sales/${sale.id}`} className="text-blue-600 dark:text-blue-400">
                        #{formatSaleNumber(sale.number)}
                      </Link>
                      {sale.status === 'cancelled' && (
                        <span className="ml-2 text-xs font-medium text-red-700 dark:text-red-300">
                          {getSaleStatusLabel(sale.status)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {sale.client?.name || 'Cliente avulso'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {getSaleChannelLabel(sale.channel)}
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {getSaleOriginLabel(sale.origin)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {sale.seller?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {sale._count?.items ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap space-x-3">
                      <Link to={`/sales/${sale.id}`} className="text-gray-700 dark:text-gray-300">
                        Ver
                      </Link>
                      {sale.status !== 'cancelled' && (
                        <>
                          <Link to={`/sales/${sale.id}/return`} className="text-red-600 dark:text-red-400">
                            Devolver
                          </Link>
                          <Link to={`/sales/${sale.id}/exchange`} className="text-blue-600 dark:text-blue-400">
                            Trocar
                          </Link>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-3 border-t border-gray-200 dark:border-gray-700 text-sm">
                <span className="text-gray-500 dark:text-gray-400">{pagination.total} vendas</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-200"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-200"
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

export default Sales;
