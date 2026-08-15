import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useCompany } from '../context/CompanyContext';
import api from '../services/api';
import {
  formatClientNumber,
  formatCurrency,
  formatDateTime,
  formatSaleNumber,
  formatShipmentNumber,
  getPaymentMethodLabel,
  getSaleChannelLabel,
  getSaleOriginLabel,
  getSaleStatusLabel,
  getShipmentStatusLabel,
} from '../utils/helpers';

const SaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useCompany();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadSale();
  }, [id]);

  const loadSale = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sales/${id}`);
      setSale(response.data);
    } catch (error) {
      alert(error.response?.data?.error || 'Venda não encontrada');
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Venda">
        <div className="flex items-center justify-center h-64">
          <Loading />
        </div>
      </Layout>
    );
  }

  if (!sale) return null;

  const isCancelled = sale.status === 'cancelled';
  const hasAftersale = Boolean(sale.returns?.length || sale.exchanges?.length);
  const hasShipped = sale.shipments?.some((item) => item.status === 'shipped');
  const canCancel =
    can('sales.cancel') && sale.status === 'completed' && !hasAftersale && !hasShipped;

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Informe o motivo do cancelamento');
      return;
    }
    try {
      setCancelling(true);
      const response = await api.post(`/sales/${sale.id}/cancel`, {
        reason: cancelReason.trim(),
      });
      setSale(response.data);
      setCancelOpen(false);
      setCancelReason('');
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao cancelar venda');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Layout title={`Venda #${formatSaleNumber(sale.number)}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => navigate('/sales')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Voltar
          </button>
          <div className="flex gap-3 flex-wrap justify-end">
            {!isCancelled && (
              <>
                <Link
                  to={`/sales/${sale.id}/return`}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Devolver
                </Link>
                <Link
                  to={`/sales/${sale.id}/exchange`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Trocar
                </Link>
                {sale.shipments?.some((item) => item.status === 'pending') ? (
                  <Link
                    to="/shipments"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Ver envio
                  </Link>
                ) : (
                  <Link
                    to={`/shipments/new?saleId=${sale.id}`}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Criar envio
                  </Link>
                )}
              </>
            )}
            {canCancel && (
              <Button type="button" variant="danger" onClick={() => setCancelOpen(true)}>
                Cancelar venda
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Venda #{formatSaleNumber(sale.number)} · {getSaleStatusLabel(sale.status)}
              </p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(sale.total)}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(sale.createdAt)}</p>
              {isCancelled && (
                <p className="mt-3 text-sm text-red-700 dark:text-red-300">
                  Cancelada em {formatDateTime(sale.cancelledAt)}
                  {sale.cancelledBy?.name ? ` por ${sale.cancelledBy.name}` : ''}
                  {sale.cancelReason ? ` · ${sale.cancelReason}` : ''}
                </p>
              )}
            </div>
            <div className="text-right text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p>{sale.unit?.name}</p>
              <p>{getSaleChannelLabel(sale.channel)} · {getSaleOriginLabel(sale.origin)}</p>
              <p>Vendedor: {sale.seller?.name}</p>
            </div>
          </div>

          <div className="text-sm">
            <p className="text-gray-500 dark:text-gray-400">Cliente</p>
              {sale.client ? (
              <Link to={`/clients/${sale.client.id}`} className="text-blue-600 dark:text-blue-400">
                #{formatClientNumber(sale.client.number)} · {sale.client.name}
              </Link>
            ) : (
              <p className="text-gray-900 dark:text-white">Cliente avulso</p>
            )}
            {sale.quote && (
              <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
                Veio do orçamento{' '}
                <Link to={`/quotes/${sale.quote.id}`} className="underline">
                  {sale.quote.title}
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Itens</h2>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                <th className="py-2 pr-4">Produto</th>
                <th className="py-2 pr-4">Qtd</th>
                <th className="py-2 pr-4">Preço</th>
                <th className="py-2 pr-4">Desc.</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-4 text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">{item.productName}</div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {item.sku} · {[item.size, item.color].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-gray-900 dark:text-white">
                    {parseFloat(item.quantity)}
                    {item.remainingQuantity !== undefined && sale.status !== 'cancelled' && (
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        restam {parseFloat(item.remainingQuantity)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-sm text-gray-900 dark:text-white">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 pr-4 text-sm text-gray-900 dark:text-white">{formatCurrency(item.discount)}</td>
                  <td className="py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-sm space-y-1 text-right text-gray-700 dark:text-gray-300">
            <p>Subtotal {formatCurrency(sale.subtotal)}</p>
            <p>Descontos {formatCurrency(sale.discount)}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Total {formatCurrency(sale.total)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Pagamentos</h2>
          <div className="space-y-2">
            {sale.payments.map((payment) => (
              <div key={payment.id} className="flex justify-between text-sm text-gray-900 dark:text-white">
                <span>{getPaymentMethodLabel(payment.method)}</span>
                <span className="font-medium">{formatCurrency(payment.amount)}</span>
              </div>
            ))}
          </div>
          {sale.notes && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Obs.: {sale.notes}</p>
          )}
        </div>

        {(sale.shipments?.length > 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">Envios</h2>
            {sale.shipments.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Envio #{formatShipmentNumber(item.number)} · {getShipmentStatusLabel(item.status)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {item.recipientName}
                    {item.city ? ` · ${item.city}` : ''}
                    {item.trackingCode ? ` · ${item.trackingCode}` : ''}
                  </p>
                </div>
                {item.status === 'pending' && (
                  <Link to={`/shipments/${item.id}/edit`} className="text-blue-600 dark:text-blue-400">
                    Editar
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {(sale.returns?.length > 0 || sale.exchanges?.length > 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Trocas e devoluções</h2>
            {(sale.returns || []).map((record) => (
              <div key={record.id} className="text-sm">
                <p className="font-medium text-gray-900 dark:text-white">
                  Devolução #{String(record.number).padStart(4, '0')} · estorno {formatCurrency(record.refundAmount)}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {formatDateTime(record.createdAt)}
                  {record.reason ? ` · ${record.reason}` : ''}
                </p>
              </div>
            ))}
            {(sale.exchanges || []).map((record) => (
              <div key={record.id} className="text-sm">
                <p className="font-medium text-gray-900 dark:text-white">
                  Troca #{String(record.number).padStart(4, '0')} · diferença {formatCurrency(record.difference)}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {formatDateTime(record.createdAt)}
                  {record.reason ? ` · ${record.reason}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={cancelOpen}
        onClose={() => !cancelling && setCancelOpen(false)}
        title="Cancelar venda"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            A venda #{formatSaleNumber(sale.number)} permanece no histórico como cancelada.
            O estoque volta para {sale.unit?.name}. Envio ainda na fila também é cancelado.
            Isso não dá para desfazer.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motivo
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Ex.: lançamento duplicado no PDV"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCancelOpen(false)} disabled={cancelling}>
              Voltar
            </Button>
            <Button type="button" variant="danger" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Cancelando...' : 'Confirmar cancelamento'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default SaleDetail;
