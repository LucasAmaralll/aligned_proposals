import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { useCompany } from '../context/CompanyContext';
import api from '../services/api';
import { formatCurrency } from '../utils/helpers';

const selectClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500';

const Stock = () => {
  const { currentUnit, units } = useCompany();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    quantity: '',
    reason: '',
    toUnitId: '',
  });

  useEffect(() => {
    if (currentUnit?.id) {
      loadStock();
    }
  }, [currentUnit?.id]);

  const loadStock = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stock', {
        params: { unitId: currentUnit.id, search },
      });
      setStocks(response.data.stocks || []);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, row) => {
    setSelected(row);
    setForm({
      quantity: '',
      reason: '',
      toUnitId: units.find((unit) => unit.id !== currentUnit.id)?.id || '',
    });
    setModal(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected || !form.quantity) {
      alert('Informe a quantidade');
      return;
    }

    try {
      setSaving(true);
      if (modal === 'transfer') {
        await api.post('/stock/transfers', {
          variantId: selected.variantId,
          fromUnitId: currentUnit.id,
          toUnitId: form.toUnitId,
          quantity: form.quantity,
          reason: form.reason || undefined,
        });
      } else {
        await api.post('/stock/movements', {
          type: modal,
          variantId: selected.variantId,
          unitId: currentUnit.id,
          quantity: modal === 'adjust' ? form.quantity : Math.abs(Number(form.quantity)),
          reason: form.reason || undefined,
        });
      }
      setModal(null);
      await loadStock();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao movimentar estoque');
    } finally {
      setSaving(false);
    }
  };

  const titles = {
    entry: 'Entrada de estoque',
    exit: 'Saída de estoque',
    adjust: 'Ajuste de estoque',
    transfer: 'Transferir entre unidades',
  };

  return (
    <Layout title="Estoque">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estoque</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Saldos da unidade {currentUnit?.name || 'atual'}
            </p>
          </div>
          <Link
            to="/stock/movements"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Histórico
          </Link>
        </div>

        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por produto, SKU, cor ou tamanho..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadStock()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <Button type="button" variant="secondary" onClick={loadStock}>
            Buscar
          </Button>
        </div>

        {loading ? (
          <Loading />
        ) : stocks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Nenhum item em estoque
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cadastre variações em Produtos para começar a controlar o estoque.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Variação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Preço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Saldo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Movimentar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stocks.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {row.variant?.product?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {row.variant?.product?.category?.name || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {row.variant?.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {[row.variant?.size, row.variant?.color].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {formatCurrency(row.variant?.salePrice)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {parseFloat(row.quantity || 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openModal('entry', row)}
                          className="text-green-600 dark:text-green-400"
                        >
                          Entrada
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal('exit', row)}
                          className="text-red-600 dark:text-red-400"
                        >
                          Saída
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal('adjust', row)}
                          className="text-blue-600 dark:text-blue-400"
                        >
                          Ajuste
                        </button>
                        {units.length > 1 && (
                          <button
                            type="button"
                            onClick={() => openModal('transfer', row)}
                            className="text-gray-700 dark:text-gray-300"
                          >
                            Transferir
                          </button>
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

      <Modal isOpen={Boolean(modal)} onClose={() => setModal(null)} title={titles[modal] || ''}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {selected?.variant?.product?.name} · {selected?.variant?.sku}
          </p>
          {modal === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destino
              </label>
              <select
                value={form.toUnitId}
                onChange={(e) => setForm({ ...form, toUnitId: e.target.value })}
                className={selectClass}
              >
                {units
                  .filter((unit) => unit.id !== currentUnit?.id)
                  .map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <Input
            label={modal === 'adjust' ? 'Quantidade (+ ou -)' : 'Quantidade *'}
            name="quantity"
            type="number"
            step="0.001"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            required
          />
          <Input
            label={modal === 'adjust' ? 'Motivo *' : 'Motivo'}
            name="reason"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required={modal === 'adjust'}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Stock;
