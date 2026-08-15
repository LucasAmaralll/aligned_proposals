import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import api from '../services/api';
import {
  formatClientNumber,
  formatCurrency,
  formatDate,
  formatDocument,
  formatPhone,
  getStatusColor,
  getStatusLabel,
} from '../utils/helpers';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clients/${id}`);
      setClient(response.data);
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      alert('Cliente não encontrado');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Cliente">
        <div className="flex items-center justify-center h-64">
          <Loading />
        </div>
      </Layout>
    );
  }

  if (!client) return null;

  const quotes = client.quotes || [];
  const sales = client.sales || [];

  return (
    <Layout title={client.name}>
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Voltar
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cliente #{formatClientNumber(client.number)}
              </p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
            </div>
            <Link
              to={`/clients/${client.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PencilIcon className="h-5 w-5" />
              Editar
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">CPF/CNPJ</p>
              <p className="text-gray-900 dark:text-white">{formatDocument(client.document) || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Nascimento</p>
              <p className="text-gray-900 dark:text-white">
                {client.birthDate ? formatDate(client.birthDate) : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Telefone</p>
              <p className="text-gray-900 dark:text-white">
                {client.phone ? formatPhone(client.phone) : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-gray-900 dark:text-white">{client.email || '—'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-gray-500 dark:text-gray-400">Endereço</p>
              <p className="text-gray-900 dark:text-white">
                {[client.address, client.city, client.state, client.zipCode]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Orçamentos</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {client.history?.quotesCount ?? quotes.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total em orçamentos</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(client.history?.quotesTotal || 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Vendas</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {client.history?.salesCount ?? 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatCurrency(client.history?.salesTotal || 0)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Histórico de orçamentos
          </h2>
          {quotes.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhum orçamento vinculado a este cliente.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    <th className="py-3 pr-4">Data</th>
                    <th className="py-3 pr-4">Título</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {quotes.map((quote) => (
                    <tr key={quote.id}>
                      <td className="py-3 pr-4 text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(quote.createdAt)}
                      </td>
                      <td className="py-3 pr-4 text-sm">
                        <Link
                          to={`/quotes/${quote.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {quote.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            quote.status
                          )}`}
                        >
                          {getStatusLabel(quote.status)}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-right text-gray-900 dark:text-white">
                        {formatCurrency(quote.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Histórico de vendas
          </h2>
          {sales.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma venda ainda. Orçamento não vira venda — o PDV grava o histórico aqui.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    <th className="py-3 pr-4">Data</th>
                    <th className="py-3 pr-4">Venda</th>
                    <th className="py-3 pr-4">Unidade</th>
                    <th className="py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="py-3 pr-4 text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(sale.createdAt)}
                      </td>
                      <td className="py-3 pr-4 text-sm">
                        <Link
                          to={`/sales/${sale.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          #{String(sale.number).padStart(4, '0')}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-700 dark:text-gray-300">
                        {sale.unit?.name || '—'}
                      </td>
                      <td className="py-3 text-sm text-right text-gray-900 dark:text-white">
                        {formatCurrency(sale.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ClientDetail;
