import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon, TruckIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import api from '../services/api';
import {
  formatDateTime,
  formatSaleNumber,
  formatShipmentAddress,
  formatShipmentNumber,
  getShipmentCarrierLabel,
  getShipmentOriginLabel,
  getShipmentStatusLabel,
  SHIPMENT_CARRIER_LABELS,
} from '../utils/helpers';

const STATUS_CLASS = {
  pending: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
  shipped: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  cancelled: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};

const selectClass =
  'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white';

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('pending');
  const [origin, setOrigin] = useState('');
  const [shipping, setShipping] = useState(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [carrier, setCarrier] = useState('correios');
  const [saving, setSaving] = useState(false);

  const loadShipments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/shipments', {
        params: {
          search: search.trim() || undefined,
          status: status || undefined,
          origin: origin || undefined,
          limit: 80,
        },
      });
      setShipments(response.data.shipments || []);
      setPendingCount(response.data.pendingCount || 0);
    } catch (error) {
      console.error('Erro ao carregar envios:', error);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, origin]);

  useEffect(() => {
    const timer = setTimeout(() => loadShipments(), 280);
    return () => clearTimeout(timer);
  }, [loadShipments]);

  const openShip = (item) => {
    setShipping(item);
    setTrackingCode(item.trackingCode || '');
    setCarrier(item.carrier || 'correios');
  };

  const confirmShip = async () => {
    if (!shipping) return;
    try {
      setSaving(true);
      await api.post(`/shipments/${shipping.id}/ship`, { trackingCode, carrier });
      setShipping(null);
      await loadShipments();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao marcar como enviado');
    } finally {
      setSaving(false);
    }
  };

  const cancelShipment = async (item) => {
    if (!window.confirm(`Cancelar o envio #${formatShipmentNumber(item.number)}?`)) return;
    try {
      await api.post(`/shipments/${item.id}/cancel`);
      await loadShipments();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao cancelar envio');
    }
  };

  return (
    <Layout title="Envios">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Envios</h1>
            <p className="text-gray-600 dark:text-gray-400">
              O que precisa ir embora: site, atacado da loja ou quem comprou pessoalmente e pediu Correios.
            </p>
          </div>
          <Link
            to="/shipments/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5" />
            Novo envio
          </Link>
        </div>

        <div className="mb-6 grid sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar destinatário, cidade, rastreio ou número..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
            <option value="pending">A enviar</option>
            <option value="shipped">Enviados</option>
            <option value="cancelled">Cancelados</option>
            <option value="">Todos</option>
          </select>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)} className={selectClass}>
            <option value="">Todas as origens</option>
            <option value="ecommerce">E-commerce</option>
            <option value="sale">Loja</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {!loading && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {pendingCount} {pendingCount === 1 ? 'pedido' : 'pedidos'} na fila para programar Correios.
          </p>
        )}

        {loading ? (
          <Loading />
        ) : shipments.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nada na fila</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cadastre um envio manual ou marque “enviar” no PDV.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Envio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Destinatário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Endereço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Origem
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {shipments.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 align-top">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          #{formatShipmentNumber(item.number)}
                        </p>
                        <span
                          className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_CLASS[item.status]
                          }`}
                        >
                          {getShipmentStatusLabel(item.status)}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDateTime(item.createdAt)}
                        </p>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.recipientName}</p>
                        {item.itemsNote && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-line line-clamp-3">
                            {item.itemsNote}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                        {formatShipmentAddress(item) || 'Sem endereço ainda'}
                        {item.trackingCode && (
                          <p className="text-xs mt-1 font-mono text-gray-500 dark:text-gray-400">
                            {getShipmentCarrierLabel(item.carrier)} · {item.trackingCode}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                        <p>{getShipmentOriginLabel(item.origin)}</p>
                        {item.sale && (
                          <Link to={`/sales/${item.sale.id}`} className="text-xs text-blue-600 dark:text-blue-400">
                            Venda #{formatSaleNumber(item.sale.number)}
                          </Link>
                        )}
                        {item.unit?.name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.unit.name}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top text-right space-y-2">
                        {item.status === 'pending' && (
                          <>
                            <Button type="button" size="sm" className="w-full sm:w-auto" onClick={() => openShip(item)}>
                              Marcar enviado
                            </Button>
                            <div className="flex justify-end gap-3 text-sm">
                              <Link to={`/shipments/${item.id}/edit`} className="text-blue-600 dark:text-blue-400">
                                Editar
                              </Link>
                              <button
                                type="button"
                                className="text-red-600 dark:text-red-400"
                                onClick={() => cancelShipment(item)}
                              >
                                Cancelar
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(shipping)}
        onClose={() => setShipping(null)}
        title={shipping ? `Enviar #${formatShipmentNumber(shipping.number)}` : 'Enviar'}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {shipping?.recipientName} · {formatShipmentAddress(shipping) || 'sem endereço'}
          </p>
          <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className={`w-full ${selectClass}`}>
            {Object.entries(SHIPMENT_CARRIER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Input
            label="Código de rastreio (opcional)"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="AA123456789BR"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShipping(null)}>
              Fechar
            </Button>
            <Button type="button" onClick={confirmShip} disabled={saving}>
              {saving ? 'Salvando...' : 'Marcar enviado'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Shipments;
