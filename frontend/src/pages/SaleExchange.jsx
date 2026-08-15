import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import Button from '../components/Button';
import Input from '../components/Input';
import Typeahead from '../components/Typeahead';
import { useCompany } from '../context/CompanyContext';
import api from '../services/api';
import {
  formatCurrency,
  formatSaleNumber,
  PAYMENT_METHOD_LABELS,
} from '../utils/helpers';

const money = (value) => Math.round(parseFloat(value || 0) * 100) / 100;

const SaleExchange = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUnit } = useCompany();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qtyByItem, setQtyByItem] = useState({});
  const [search, setSearch] = useState('');
  const [newItems, setNewItems] = useState([]);
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

  const credit = useMemo(() => {
    if (!sale) return 0;
    return money(
      sale.items.reduce((sum, item) => {
        const quantity = money(qtyByItem[item.id] || 0);
        const unit = money(item.total) / parseFloat(item.quantity || 1);
        return sum + quantity * unit;
      }, 0)
    );
  }, [sale, qtyByItem]);

  const debit = useMemo(
    () => money(newItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)),
    [newItems]
  );
  const difference = money(debit - credit);

  const searchProducts = useCallback(
    async (term) => {
      const unitId = sale?.unitId || currentUnit?.id;
      if (!unitId) return [];
      const response = await api.get('/stock', {
        params: { unitId, search: term, limit: 8 },
      });
      return response.data.stocks || [];
    },
    [sale?.unitId, currentUnit?.id]
  );

  const addNewItem = (row) => {
    const available = parseFloat(row.quantity || 0);
    if (available <= 0) {
      alert('Sem estoque nesta unidade');
      return;
    }
    setNewItems((current) => {
      const existing = current.find((item) => item.variantId === row.variantId);
      if (existing) {
        return current.map((item) =>
          item.variantId === row.variantId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...current,
        {
          variantId: row.variantId,
          sku: row.variant?.sku,
          productName: row.variant?.product?.name,
          unitPrice: parseFloat(row.variant?.salePrice || 0),
          quantity: 1,
        },
      ];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const returnItems = Object.entries(qtyByItem)
      .filter(([, quantity]) => parseFloat(quantity) > 0)
      .map(([saleItemId, quantity]) => ({ saleItemId, quantity: parseFloat(quantity) }));

    if (!returnItems.length || !newItems.length) {
      alert('Informe o que volta e o item novo');
      return;
    }

    try {
      setSaving(true);
      await api.post(`/sales/${id}/exchanges`, {
        returnItems,
        newItems: newItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        reason,
        method: Math.abs(difference) > 0.01 ? method : undefined,
      });
      navigate(`/sales/${id}`);
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao trocar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Troca">
        <div className="flex items-center justify-center h-64">
          <Loading />
        </div>
      </Layout>
    );
  }

  if (!sale) return null;

  return (
    <Layout title="Troca">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(`/sales/${id}`)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Voltar à venda
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Troca da venda #{formatSaleNumber(sale.number)}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          A venda original não é apagada. Entra o item antigo e sai o novo no estoque.
        </p>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Volta para a loja</h2>
            {sale.items.map((item) => {
              const remaining = parseFloat(item.remainingQuantity ?? item.quantity);
              return (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-7">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku} · restam {remaining}</p>
                  </div>
                  <div className="col-span-5">
                    <Input
                      label="Qtd"
                      type="number"
                      min="0"
                      max={remaining}
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
            <p className="text-sm text-gray-600 dark:text-gray-300">Crédito {formatCurrency(credit)}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Item novo</h2>
            <Typeahead
              value={search}
              onChange={setSearch}
              fetchOptions={searchProducts}
              onSelect={(row) => {
                addNewItem(row);
                setSearch('');
              }}
              placeholder="Digite SKU ou nome do produto"
              hint="Digite pelo menos 2 caracteres"
              emptyText="Nenhum produto encontrado"
              renderOption={(row) => (
                <p className="text-sm text-gray-900 dark:text-white">
                  {row.variant?.product?.name} · {row.variant?.sku} · {formatCurrency(row.variant?.salePrice)}
                </p>
              )}
            />
            {newItems.map((item) => (
              <div key={item.variantId} className="flex justify-between items-center text-sm text-gray-900 dark:text-white">
                <span>
                  {item.productName} · {item.sku} × {item.quantity}
                </span>
                <button type="button" onClick={() => setNewItems((current) => current.filter((row) => row.variantId !== item.variantId))}>
                  <TrashIcon className="h-4 w-4 text-red-600" />
                </button>
              </div>
            ))}
            <p className="text-sm text-gray-600 dark:text-gray-300">Novo {formatCurrency(debit)}</p>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <Input label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
            {Math.abs(difference) > 0.01 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {difference > 0 ? 'Cliente paga a diferença' : 'Estorno da diferença'}
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
            )}
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {difference > 0
                  ? `Diferença a pagar ${formatCurrency(difference)}`
                  : difference < 0
                    ? `Estorno ${formatCurrency(Math.abs(difference))}`
                    : 'Troca sem diferença'}
              </p>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Confirmar troca'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default SaleExchange;
