import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { useCompany } from '../context/CompanyContext';
import api from '../services/api';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../utils/helpers';

const METHODS = ['cash', 'pix', 'debit', 'credit', 'other'];

const emptyTotals = {
  openingAmount: 0,
  salesCount: 0,
  salesTotal: 0,
  salesByMethod: { cash: 0, pix: 0, debit: 0, credit: 0, other: 0 },
  returnsCount: 0,
  returnsByMethod: { cash: 0, pix: 0, debit: 0, credit: 0, other: 0 },
  exchangesInByMethod: { cash: 0, pix: 0, debit: 0, credit: 0, other: 0 },
  exchangesOutByMethod: { cash: 0, pix: 0, debit: 0, credit: 0, other: 0 },
  supplies: 0,
  bleeds: 0,
  refunds: 0,
  expectedCash: 0,
};

const num = (value) => Math.round(parseFloat(value || 0) * 100) / 100;

const Cash = () => {
  const { currentUnit, can } = useCompany();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [totals, setTotals] = useState(emptyTotals);
  const [history, setHistory] = useState([]);
  const [openingAmount, setOpeningAmount] = useState('0');
  const [supplyAmount, setSupplyAmount] = useState('');
  const [supplyReason, setSupplyReason] = useState('');
  const [bleedAmount, setBleedAmount] = useState('');
  const [bleedReason, setBleedReason] = useState('');
  const [countedCash, setCountedCash] = useState('');
  const [saving, setSaving] = useState(false);
  const [closedView, setClosedView] = useState(null);

  const load = async () => {
    if (!currentUnit?.id) return;
    try {
      setLoading(true);
      const [current, listed] = await Promise.all([
        api.get('/cash/sessions/current', { params: { unitId: currentUnit.id } }),
        api.get('/cash/sessions', { params: { unitId: currentUnit.id, limit: 20 } }),
      ]);
      setSession(current.data.session);
      setTotals(current.data.totals || emptyTotals);
      setHistory(listed.data.sessions || []);
      if (current.data.session && current.data.totals) {
        setCountedCash(String(num(current.data.totals.expectedCash)));
      }
    } catch (error) {
      console.error('Erro ao carregar caixa:', error);
      setSession(null);
      setTotals(emptyTotals);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentUnit?.id]);

  const handleOpen = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await api.post('/cash/sessions/open', {
        unitId: currentUnit.id,
        openingAmount: num(openingAmount),
      });
      setOpeningAmount('0');
      await load();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao abrir o caixa');
    } finally {
      setSaving(false);
    }
  };

  const handleMovement = async (type) => {
    const amount = type === 'supply' ? supplyAmount : bleedAmount;
    const reason = type === 'supply' ? supplyReason : bleedReason;
    try {
      setSaving(true);
      await api.post(`/cash/sessions/${session.id}/${type}`, { amount: num(amount), reason });
      if (type === 'supply') {
        setSupplyAmount('');
        setSupplyReason('');
      } else {
        setBleedAmount('');
        setBleedReason('');
      }
      await load();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao registrar movimentação');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (event) => {
    event.preventDefault();
    if (!window.confirm('Fechar o caixa? O fechamento não pode ser editado depois.')) return;
    try {
      setSaving(true);
      await api.post(`/cash/sessions/${session.id}/close`, { countedCash: num(countedCash) });
      setCountedCash('');
      await load();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao fechar o caixa');
    } finally {
      setSaving(false);
    }
  };

  const openClosed = async (id) => {
    try {
      const response = await api.get(`/cash/sessions/${id}`);
      setClosedView(response.data);
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao abrir o fechamento');
    }
  };

  const difference = session
    ? num(num(countedCash) - num(totals.expectedCash))
    : 0;

  const historyTotals = (item) => {
    if (item.status === 'closed') return item.totals || null;
    return session?.id === item.id ? totals : null;
  };

  return (
    <Layout title="Caixa">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Caixa"
          description={
            currentUnit
              ? `${currentUnit.name} · o fechamento fica gravado e não pode ser recalculado`
              : 'Selecione uma unidade no header'
          }
        />

        {loading ? (
          <Loading />
        ) : !session ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Caixa fechado</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Abra o caixa para vender no PDV desta unidade.
            </p>
            <form onSubmit={handleOpen} className="space-y-4">
              <Input
                label="Valor inicial em dinheiro"
                type="number"
                min="0"
                step="0.01"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
              />
              <Button type="submit" disabled={saving || !can('cash.open')}>
                {saving ? 'Abrindo...' : 'Abrir caixa'}
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <Stat label="Abertura" value={formatCurrency(totals.openingAmount)} />
              <Stat label="Esperado em dinheiro" value={formatCurrency(totals.expectedCash)} />
              <Stat
                label="Vendas na sessão"
                value={`${totals.salesCount || 0} · ${formatCurrency(totals.salesTotal)}`}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Vendas por forma</h2>
                <MethodList map={totals.salesByMethod} />
                <h2 className="font-semibold text-gray-900 dark:text-white mt-5 mb-3">Pós-venda</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Devoluções</p>
                <MethodList map={totals.returnsByMethod} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 mb-2">Trocas a receber</p>
                <MethodList map={totals.exchangesInByMethod} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 mb-2">Trocas a devolver</p>
                <MethodList map={totals.exchangesOutByMethod} />
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-700 text-sm space-y-1">
                  <Row label="Suprimentos" value={formatCurrency(totals.supplies)} />
                  <Row label="Sangrias" value={formatCurrency(totals.bleeds)} />
                  <Row label="Estornos (refund)" value={formatCurrency(totals.refunds)} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Suprimento</h2>
                  <Input
                    label="Valor"
                    type="number"
                    min="0"
                    step="0.01"
                    value={supplyAmount}
                    onChange={(e) => setSupplyAmount(e.target.value)}
                  />
                  <Input
                    label="Motivo"
                    value={supplyReason}
                    onChange={(e) => setSupplyReason(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving || !can('cash.operate')}
                    onClick={() => handleMovement('supply')}
                  >
                    Registrar suprimento
                  </Button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Sangria</h2>
                  <Input
                    label="Valor"
                    type="number"
                    min="0"
                    step="0.01"
                    value={bleedAmount}
                    onChange={(e) => setBleedAmount(e.target.value)}
                  />
                  <Input
                    label="Motivo"
                    value={bleedReason}
                    onChange={(e) => setBleedReason(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving || !can('cash.operate')}
                    onClick={() => handleMovement('bleed')}
                  >
                    Registrar sangria
                  </Button>
                </div>

                <form
                  onSubmit={handleClose}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
                >
                  <h2 className="font-semibold text-gray-900 dark:text-white">Fechar caixa</h2>
                  <Input
                    label="Dinheiro contado"
                    type="number"
                    min="0"
                    step="0.01"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                  />
                  <p className={`text-sm ${Math.abs(difference) < 0.01 ? 'text-green-600' : 'text-amber-600'}`}>
                    Diferença {formatCurrency(difference)}
                  </p>
                  <Button type="submit" variant="danger" disabled={saving || !can('cash.close')}>
                    {saving ? 'Fechando...' : 'Fechar caixa'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Histórico</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {history.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">Nenhuma sessão ainda.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-900 text-left text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-2 font-medium">Abertura</th>
                    <th className="px-4 py-2 font-medium">Fechamento</th>
                    <th className="px-4 py-2 font-medium">Abriu</th>
                    <th className="px-4 py-2 font-medium">Fechou</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Vendas</th>
                    <th className="px-4 py-2 font-medium">Esperado</th>
                    <th className="px-4 py-2 font-medium">Contado</th>
                    <th className="px-4 py-2 font-medium">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const rowTotals = historyTotals(item);
                    const salesTotal = rowTotals?.salesTotal;
                    const salesCount = rowTotals?.salesCount;
                    return (
                      <tr
                        key={item.id}
                        className="border-t border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
                        onClick={() => openClosed(item.id)}
                      >
                        <td className="px-4 py-2">{formatDateTime(item.openedAt)}</td>
                        <td className="px-4 py-2">{item.closedAt ? formatDateTime(item.closedAt) : '—'}</td>
                        <td className="px-4 py-2">{item.openedBy?.name || '—'}</td>
                        <td className="px-4 py-2">{item.closedBy?.name || '—'}</td>
                        <td className="px-4 py-2">{item.status === 'open' ? 'Aberto' : 'Fechado'}</td>
                        <td className="px-4 py-2">
                          {salesTotal == null
                            ? '—'
                            : `${formatCurrency(salesTotal)}${salesCount ? ` · ${salesCount}` : ''}`}
                        </td>
                        <td className="px-4 py-2">
                          {item.expectedCash != null
                            ? formatCurrency(item.expectedCash)
                            : rowTotals
                            ? formatCurrency(rowTotals.expectedCash)
                            : '—'}
                        </td>
                        <td className="px-4 py-2">{item.countedCash != null ? formatCurrency(item.countedCash) : '—'}</td>
                        <td className="px-4 py-2">{item.difference != null ? formatCurrency(item.difference) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={Boolean(closedView)}
        onClose={() => setClosedView(null)}
        title={closedView?.frozen ? 'Fechamento (imutável)' : 'Sessão aberta'}
      >
        {closedView && (
          <div className="space-y-3">
            <Row label="Abriu" value={`${closedView.session?.openedBy?.name || '—'} · ${formatDateTime(closedView.session?.openedAt)}`} />
            <Row
              label="Fechou"
              value={
                closedView.session?.closedAt
                  ? `${closedView.session?.closedBy?.name || '—'} · ${formatDateTime(closedView.session.closedAt)}`
                  : 'Ainda aberto'
              }
            />
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-700 space-y-1">
              <Row label="Abertura em dinheiro" value={formatCurrency(closedView.totals?.openingAmount)} />
              <Row
                label="Vendas na sessão"
                value={`${closedView.totals?.salesCount || 0} · ${formatCurrency(closedView.totals?.salesTotal)}`}
              />
              <Row label="Suprimentos" value={formatCurrency(closedView.totals?.supplies)} />
              <Row label="Sangrias" value={formatCurrency(closedView.totals?.bleeds)} />
              <Row label="Estornos (refund)" value={formatCurrency(closedView.totals?.refunds)} />
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Vendas por forma de pagamento</p>
              <MethodList map={closedView.totals?.salesByMethod} />
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-700 space-y-1">
              <Row label="Esperado em dinheiro" value={formatCurrency(closedView.totals?.expectedCash)} />
              <Row label="Contado" value={formatCurrency(closedView.totals?.countedCash ?? closedView.session?.countedCash)} />
              <Row label="Diferença" value={formatCurrency(closedView.totals?.difference ?? closedView.session?.difference)} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              O esperado em dinheiro conta abertura, vendas em dinheiro, trocas em dinheiro e suprimentos, menos sangrias e
              estornos. Pix, débito e crédito entram nas vendas da sessão, mas não na gaveta.
            </p>
            {closedView.frozen && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Estes valores foram gravados no fechamento e não são recalculados.
              </p>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

const Stat = ({ label, value }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
    <span>{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const MethodList = ({ map = {} }) => (
  <div className="space-y-1">
    {METHODS.map((method) => (
      <Row
        key={method}
        label={getPaymentMethodLabel(method)}
        value={formatCurrency(map[method] || 0)}
      />
    ))}
  </div>
);

export default Cash;
