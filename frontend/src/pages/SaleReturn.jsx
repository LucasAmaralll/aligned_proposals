import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import Button from '../components/Button';
import Input from '../components/Input';
import api from '../services/api';
import {
  formatCurrency,
  formatSaleNumber,
  PAYMENT_METHOD_LABELS,
} from '../utils/helpers';

const money = (value) => Math.round(parseFloat(value || 0) * 100) / 100;

const SaleReturn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qtyByItem, setQtyByItem] = useState({});
  const [reason, setReason] = useState('');
  const [method, setMethod] = useState('pix');
  const [saving, setSaving] = useState(false);

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

  const refund = useMemo(() => {
    if (!sale) return 0;
    return money(
      sale.items.reduce((sum, item) => {
        const quantity = money(qtyByItem[item.id] || 0);
        const unit = money(item.total) / parseFloat(item.quantity || 1);
        return sum + quantity * unit;
      }, 0)
    );
  }, [sale, qtyByItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const items = Object.entries(qtyByItem)
      .filter(([, quantity]) => parseFloat(quantity) > 0)
      .map(([saleItemId, quantity]) => ({ saleItemId, quantity: parseFloat(quantity) }));

    if (!items.length) {
      alert('Informe a quantidade a devolver');
      return;
    }

    try {
      setSaving(true);
      await api.post(`/sales/${id}/returns`, { items, reason, method });
      navigate(`/sales/${id}`);
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao devolver');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Devolução">
        <div className="flex items-center justify-center h-64">
          <Loading />
        </div>
      </Layout>
    );
  }

  if (!sale) return null;

  return (
    <Layout title="Devolução">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(`/sales/${id}`)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Voltar à venda
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Devolver venda #{formatSaleNumber(sale.number)}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          A venda original permanece. O estoque volta pela movimentação de devolução.
        </p>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          {sale.items.map((item) => {
            const remaining = parseFloat(item.remainingQuantity ?? item.quantity);
            return (
              <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-7">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.sku} · restam {remaining}
                  </p>
                </div>
                <div className="col-span-5">
                  <Input
                    label="Qtd a devolver"
                    type="number"
                    min="0"
                    max={remaining}
                    step="1"
                    value={qtyByItem[item.id] || ''}
                    onChange={(e) =>
                      setQtyByItem((current) => ({ ...current, [item.id]: e.target.value }))
                    }
                    disabled={remaining <= 0}
                  />
                </div>
              </div>
            );
          })}

          <Input
            label="Motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tamanho, defeito, desistência..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estorno
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center pt-2">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Estorno {formatCurrency(refund)}
            </p>
            <Button type="submit" disabled={saving || refund <= 0}>
              {saving ? 'Salvando...' : 'Confirmar devolução'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default SaleReturn;
