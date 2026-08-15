import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Input from '../components/Input';
import Typeahead from '../components/Typeahead';
import { useCompany } from '../context/CompanyContext';
import api from '../services/api';
import {
  formatClientNumber,
  formatCurrency,
  formatDocument,
  formatPhone,
  formatZipCode,
  getPaymentMethodLabel,
  getSaleChannelLabel,
  inferClientKind,
  PAYMENT_METHOD_LABELS,
} from '../utils/helpers';

const money = (value) => Math.round(parseFloat(value || 0) * 100) / 100;

const Pos = () => {
  const navigate = useNavigate();
  const { currentUnit } = useCompany();
  const [search, setSearch] = useState('');
  const [cashSession, setCashSession] = useState(undefined);
  const [cart, setCart] = useState([]);
  const [clientQuery, setClientQuery] = useState('');
  const [client, setClient] = useState(null);
  const [channel, setChannel] = useState('retail');
  const [saleDiscount, setSaleDiscount] = useState('0');
  const [payments, setPayments] = useState([{ method: 'pix', amount: '' }]);
  const [notes, setNotes] = useState('');
  const [ship, setShip] = useState(false);
  const [shipping, setShipping] = useState({
    recipientName: '',
    phone: '',
    document: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const subtotal = money(
      cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    );
    const itemsDiscount = money(cart.reduce((sum, item) => sum + money(item.discount), 0));
    const extraDiscount = money(saleDiscount);
    const discount = money(itemsDiscount + extraDiscount);
    const total = money(Math.max(0, subtotal - discount));
    return { subtotal, discount, total };
  }, [cart, saleDiscount]);

  useEffect(() => {
    setPayments((current) => {
      if (current.length === 1) {
        return [{ ...current[0], amount: totals.total ? String(totals.total) : '' }];
      }
      return current;
    });
  }, [totals.total]);

  useEffect(() => {
    if (!currentUnit?.id) {
      setCashSession(null);
      return;
    }
    let cancelled = false;
    api
      .get('/cash/sessions/current', { params: { unitId: currentUnit.id } })
      .then((response) => {
        if (!cancelled) setCashSession(response.data.session || null);
      })
      .catch(() => {
        if (!cancelled) setCashSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUnit?.id]);

  const searchProducts = useCallback(
    async (term) => {
      if (!currentUnit?.id) return [];
      const response = await api.get('/stock', {
        params: { unitId: currentUnit.id, search: term, limit: 8 },
      });
      return response.data.stocks || [];
    },
    [currentUnit?.id]
  );

  const searchClients = useCallback(async (term) => {
    const response = await api.get('/clients', { params: { search: term, limit: 8 } });
    return response.data.clients || [];
  }, []);

  const addToCart = (row) => {
    const available = parseFloat(row.quantity || 0);
    if (available <= 0) {
      alert('Sem estoque nesta unidade');
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.variantId === row.variantId);
      if (existing) {
        const nextQty = existing.quantity + 1;
        if (nextQty > available) {
          alert(`Estoque insuficiente. Saldo: ${available}`);
          return current;
        }
        return current.map((item) =>
          item.variantId === row.variantId ? { ...item, quantity: nextQty } : item
        );
      }

      return [
        ...current,
        {
          variantId: row.variantId,
          sku: row.variant?.sku,
          productName: row.variant?.product?.name,
          size: row.variant?.size,
          color: row.variant?.color,
          unitPrice: parseFloat(row.variant?.salePrice || 0),
          quantity: 1,
          discount: 0,
          available,
        },
      ];
    });
  };

  const updateCart = (variantId, field, value) => {
    setCart((current) =>
      current.map((item) => {
        if (item.variantId !== variantId) return item;
        const next = { ...item, [field]: field === 'quantity' || field === 'discount' || field === 'unitPrice' ? parseFloat(value || 0) : value };
        if (field === 'quantity' && next.quantity > item.available) {
          alert(`Estoque insuficiente. Saldo: ${item.available}`);
          return item;
        }
        return next;
      })
    );
  };

  const removeFromCart = (variantId) => {
    setCart((current) => current.filter((item) => item.variantId !== variantId));
  };

  const paid = money(payments.reduce((sum, payment) => sum + money(payment.amount), 0));

  const fillShippingFromClient = (item) => ({
    recipientName: item?.name || '',
    phone: formatPhone(item?.phone),
    document: formatDocument(item?.document),
    address: item?.address || '',
    city: item?.city || '',
    state: item?.state || '',
    zipCode: formatZipCode(item?.zipCode),
  });

  const handleSubmit = async () => {
    if (!currentUnit?.id) {
      alert('Selecione uma unidade');
      return;
    }
    if (!cashSession) {
      alert('Abra o caixa para continuar');
      return;
    }
    if (!cart.length) {
      alert('Adicione um item');
      return;
    }
    if (channel === 'wholesale' && !client) {
      alert('Atacado precisa de um cliente pessoa jurídica');
      return;
    }
    if (channel === 'wholesale' && inferClientKind(client.document) !== 'company') {
      alert('Atacado precisa de um cliente com CNPJ');
      return;
    }
    if (Math.abs(paid - totals.total) > 0.01) {
      alert(`Pagamentos devem fechar ${formatCurrency(totals.total)}`);
      return;
    }
    if (ship && !shipping.recipientName.trim()) {
      alert('Para enviar pelos Correios, informe quem recebe');
      return;
    }

    try {
      setSaving(true);
      const response = await api.post('/sales', {
        unitId: currentUnit.id,
        clientId: client?.id || null,
        channel,
        origin: 'store',
        discount: money(saleDiscount),
        notes: notes || undefined,
        ship,
        shipping: ship ? shipping : undefined,
        items: cart.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
        payments: payments
          .filter((payment) => money(payment.amount) > 0)
          .map((payment) => ({
            method: payment.method,
            amount: money(payment.amount),
          })),
      });
      navigate(`/sales/${response.data.id}`);
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao finalizar venda');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="PDV">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/sales')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Voltar às vendas
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nova venda</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Unidade: {currentUnit?.name || 'selecione no header'} · {getSaleChannelLabel(channel)}
            </p>
          </div>
        </div>

        {cashSession === null && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            O caixa desta unidade está fechado.{' '}
            <Link to="/cash" className="font-semibold underline">
              Abrir caixa
            </Link>{' '}
            para finalizar vendas no PDV.
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <Typeahead
                value={search}
                onChange={setSearch}
                fetchOptions={searchProducts}
                onSelect={(row) => {
                  addToCart(row);
                  setSearch('');
                }}
                placeholder="Digite SKU, produto, cor ou tamanho"
                hint="Digite pelo menos 2 caracteres para buscar"
                emptyText="Nenhum produto encontrado"
                disabled={!currentUnit?.id}
                renderOption={(row) => (
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {row.variant?.product?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {row.variant?.sku} · {[row.variant?.size, row.variant?.color].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(row.variant?.salePrice)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Estoque {parseFloat(row.quantity || 0)}
                      </p>
                    </div>
                  </div>
                )}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                A lista não abre inteira. Busque o SKU ou o nome do produto.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Carrinho</h2>
              {cart.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum item ainda.</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.variantId} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku}</p>
                      </div>
                      <div className="col-span-2">
                        <Input
                          label="Qtd"
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateCart(item.variantId, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          label="Preço"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateCart(item.variantId, 'unitPrice', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          label="Desc."
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => updateCart(item.variantId, 'discount', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 text-sm font-medium text-gray-900 dark:text-white pb-2">
                        {formatCurrency(item.quantity * item.unitPrice - item.discount)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.variantId)}
                        className="col-span-1 text-red-600 pb-2"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Tipo da venda</h2>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setChannel('retail')}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    channel === 'retail'
                      ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                      : 'border-gray-200 text-gray-700 dark:border-zinc-700 dark:text-gray-300'
                  }`}
                >
                  Varejo · PF
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('wholesale')}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    channel === 'wholesale'
                      ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                      : 'border-gray-200 text-gray-700 dark:border-zinc-700 dark:text-gray-300'
                  }`}
                >
                  Atacado · PJ
                </button>
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Cliente</h2>
              <Typeahead
                value={clientQuery}
                onChange={setClientQuery}
                fetchOptions={searchClients}
                onSelect={(item) => {
                  setClient(item);
                  setChannel(inferClientKind(item.document) === 'company' ? 'wholesale' : 'retail');
                  setShipping(fillShippingFromClient(item));
                  setClientQuery('');
                }}
                selected={client}
                selectedLabel={
                  <div>
                    <p className="font-medium">{client?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      #{formatClientNumber(client?.number)}
                      {client?.document ? ` · ${formatDocument(client.document)}` : ''}
                    </p>
                  </div>
                }
                onClear={() => {
                  setClient(null);
                  setChannel('retail');
                }}
                placeholder={channel === 'wholesale' ? 'Buscar loja / CNPJ' : 'Buscar cliente ou deixar avulso'}
                hint="Digite nome, número, CPF, CNPJ ou telefone"
                emptyText="Nenhum cliente encontrado"
                renderOption={(item) => (
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      #{formatClientNumber(item.number)} · {item.name}
                    </p>
                    {item.document && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDocument(item.document)}
                      </p>
                    )}
                  </div>
                )}
              />
              {channel === 'wholesale' && (
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
                  Atacado pode entrar pelo PDV, pelo site ou depois de um orçamento. O orçamento em si não é a venda.
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <Input
                label="Desconto da venda"
                type="number"
                min="0"
                step="0.01"
                value={saleDiscount}
                onChange={(e) => setSaleDiscount(e.target.value)}
              />
              <div className="text-sm space-y-1">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Descontos</span>
                  <span>{formatCurrency(totals.discount)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-gray-900 dark:text-white">Pagamento</h2>
                <button
                  type="button"
                  className="text-sm text-blue-600"
                  onClick={() => setPayments((current) => [...current, { method: 'cash', amount: '' }])}
                >
                  + forma
                </button>
              </div>
              {payments.map((payment, index) => (
                <div key={index} className="grid grid-cols-2 gap-2">
                  <select
                    value={payment.method}
                    onChange={(e) =>
                      setPayments((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, method: e.target.value } : item
                        )
                      )
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payment.amount}
                    onChange={(e) =>
                      setPayments((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, amount: e.target.value } : item
                        )
                      )
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              ))}
              <p className={`text-sm ${Math.abs(paid - totals.total) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                Pago {formatCurrency(paid)} · {getPaymentMethodLabel(payments[0]?.method)}
              </p>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observação (opcional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ship}
                  onChange={(e) => setShip(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-semibold text-gray-900 dark:text-white">Enviar pelos Correios</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Entra na fila de Envios. Deixe desmarcado se a pessoa leva agora.
                  </span>
                </span>
              </label>
              {ship && (
                <div className="space-y-3 pt-2">
                  <Input
                    label="Quem recebe"
                    value={shipping.recipientName}
                    onChange={(e) => setShipping((current) => ({ ...current, recipientName: e.target.value }))}
                  />
                  <Input
                    label="Telefone"
                    value={shipping.phone}
                    onChange={(e) => setShipping((current) => ({ ...current, phone: formatPhone(e.target.value) }))}
                  />
                  <Input
                    label="Endereço"
                    value={shipping.address}
                    onChange={(e) => setShipping((current) => ({ ...current, address: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Cidade"
                      value={shipping.city}
                      onChange={(e) => setShipping((current) => ({ ...current, city: e.target.value }))}
                    />
                    <Input
                      label="UF"
                      value={shipping.state}
                      onChange={(e) =>
                        setShipping((current) => ({ ...current, state: e.target.value.toUpperCase().slice(0, 2) }))
                      }
                    />
                  </div>
                  <Input
                    label="CEP"
                    value={shipping.zipCode}
                    onChange={(e) => setShipping((current) => ({ ...current, zipCode: formatZipCode(e.target.value) }))}
                    placeholder="00000-000"
                  />
                </div>
              )}
            </div>

            <Button type="button" className="w-full" disabled={saving || !cart.length || !cashSession} onClick={handleSubmit}>
              {saving ? 'Finalizando...' : `Finalizar ${formatCurrency(totals.total)}`}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Pos;
