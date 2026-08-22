import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import Button from '../components/Button';
import { useCompany } from '../context/CompanyContext';
import api from '../services/api';
import {
  formatCurrency,
  formatDateTime,
  formatSaleNumber,
  formatClientNumber,
  getPaymentMethodLabel,
  getSaleChannelLabel,
  getSaleStatusLabel,
  PAYMENT_METHOD_LABELS,
} from '../utils/helpers';

const selectClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm';

const localYmd = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const monthBounds = () => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: localYmd(from), to: localYmd(to) };
};

const ALL_TABS = [
  { id: 'sales', label: 'Vendas' },
  { id: 'clients', label: 'Clientes' },
  { id: 'products', label: 'Produtos' },
  { id: 'stock', label: 'Estoque' },
  { id: 'sellers', label: 'Vendedores' },
  { id: 'cash', label: 'Caixa' },
];

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

const Reports = () => {
  const { currentUnit, units, isSeller, can } = useCompany();
  const allowed = can('reports.read') || isSeller;
  const tabs = ALL_TABS.filter((tab) => tab.id !== 'sellers' || can('reports.read'));
  const bounds = useMemo(() => monthBounds(), []);

  const [tab, setTab] = useState('sales');
  const [from, setFrom] = useState(bounds.from);
  const [to, setTo] = useState(bounds.to);
  const [unitId, setUnitId] = useState('current');
  const [sellerId, setSellerId] = useState('');
  const [method, setMethod] = useState('');
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('completed');
  const [sku, setSku] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sellers, setSellers] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const resolvedUnit = unitId === 'current' ? currentUnit?.id : unitId;

  const params = {
    from,
    to,
    unitId: resolvedUnit || 'all',
    ...(sellerId && !isSeller && { sellerId }),
    ...(method && { method }),
    ...(channel && { channel }),
    ...(status && tab === 'sales' && { status }),
    ...(tab === 'cash' && status && status !== 'completed' && { status }),
    ...(sku.trim() && { sku: sku.trim() }),
    ...(search.trim() && { search: search.trim() }),
    page,
    limit: 50,
  };

  useEffect(() => {
    setPage(1);
  }, [tab, from, to, unitId, sellerId, method, channel, status, sku, search]);

  useEffect(() => {
    if (!allowed) return;
    if (!can('reports.read')) return;
    api
      .get('/reports/options', { params: { unitId: resolvedUnit || 'all' } })
      .then((response) => setSellers(response.data.sellers || []))
      .catch(() => setSellers([]));
  }, [allowed, resolvedUnit, can]);

  useEffect(() => {
    if (!allowed) return;
    const timer = setTimeout(() => loadReport(), 200);
    return () => clearTimeout(timer);
  }, [allowed, tab, page, from, to, unitId, sellerId, method, channel, status, sku, search, currentUnit?.id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const cashStatus = tab === 'cash' ? (['open', 'closed', 'all'].includes(status) ? status : 'all') : undefined;
      const response = await api.get(`/reports/${tab}`, {
        params: {
          ...params,
          ...(tab === 'cash' ? { status: cashStatus } : {}),
          ...(tab === 'stock' && !from ? { from: undefined, to: undefined } : {}),
        },
      });
      setData(response.data);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      setData(null);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const cashStatus = tab === 'cash' ? (['open', 'closed', 'all'].includes(status) ? status : 'all') : undefined;
      const response = await api.get(`/reports/${tab}/export`, {
        params: {
          ...params,
          page: undefined,
          limit: undefined,
          ...(tab === 'cash' ? { status: cashStatus } : {}),
        },
        responseType: 'blob',
      });
      if (response.data.type && response.data.type.includes('application/json')) {
        const text = await response.data.text();
        const parsed = JSON.parse(text);
        alert(parsed.error || 'Erro ao exportar');
        return;
      }
      downloadBlob(response.data, `relatorio-${tab}.csv`);
    } catch (error) {
      const blob = error.response?.data;
      if (blob instanceof Blob) {
        try {
          const parsed = JSON.parse(await blob.text());
          alert(parsed.error || 'Erro ao exportar');
          return;
        } catch (parseError) {
          // ignore
        }
      }
      alert(error.response?.data?.error || 'Erro ao exportar');
    } finally {
      setExporting(false);
    }
  };

  if (!allowed) {
    return (
      <Layout title="Relatórios">
        <p className="text-sm text-gray-500">Sem permissão para relatórios.</p>
      </Layout>
    );
  }

  const summary = data?.summary || {};
  const rows = data?.rows || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <Layout title="Relatórios">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Relatórios"
          description="Consultas filtradas e exportação CSV. O Dashboard continua sendo a visão rápida."
          actions={
            <Button type="button" onClick={handleExport} disabled={exporting} icon={ArrowDownTrayIcon}>
              {exporting ? 'Exportando...' : 'Exportar CSV'}
            </Button>
          }
        />

        <div className="flex flex-wrap gap-2 mb-4">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setStatus(item.id === 'sales' ? 'completed' : item.id === 'cash' ? 'all' : '');
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                tab === item.id
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-zinc-950'
                  : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            De
            <input type="date" className={`${selectClass} mt-1`} value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Até
            <input type="date" className={`${selectClass} mt-1`} value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          {!isSeller && (
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Unidade
              <select className={`${selectClass} mt-1`} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                <option value="current">Unidade atual</option>
                <option value="all">Todas permitidas</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!isSeller && can('reports.read') && tab !== 'cash' && tab !== 'stock' && (
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Vendedor
              <select className={`${selectClass} mt-1`} value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
                <option value="">Todos</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {tab === 'sales' && (
            <>
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Pagamento
                <select className={`${selectClass} mt-1`} value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="">Todas</option>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Canal
                <select className={`${selectClass} mt-1`} value={channel} onChange={(e) => setChannel(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="retail">Varejo</option>
                  <option value="wholesale">Atacado</option>
                </select>
              </label>
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Status
                <select className={`${selectClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="completed">Concluídas</option>
                  <option value="cancelled">Canceladas</option>
                  <option value="all">Todas</option>
                </select>
              </label>
            </>
          )}
          {tab === 'cash' && (
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Status
              <select className={`${selectClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">Todas</option>
                <option value="open">Abertas</option>
                <option value="closed">Fechadas</option>
              </select>
            </label>
          )}
          {(tab === 'sales' || tab === 'products' || tab === 'stock') && (
            <label className="text-sm text-gray-600 dark:text-gray-300">
              SKU
              <input className={`${selectClass} mt-1`} value={sku} onChange={(e) => setSku(e.target.value)} />
            </label>
          )}
          <label className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">
            Busca
            <input className={`${selectClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          {tab === 'sales' && (
            <>
              <Summary label="Bruto" value={formatCurrency(summary.gross || 0)} />
              <Summary
                label="Devoluções"
                value={`- ${formatCurrency(summary.refunds || 0)}`}
                hint={`${summary.returnsCount || 0} no período`}
              />
              <Summary
                label="Trocas"
                value={`${(summary.exchangeDiff || 0) < 0 ? '-' : '+'} ${formatCurrency(
                  Math.abs(summary.exchangeDiff || 0)
                )}`}
                hint={`${summary.exchangesCount || 0} no período`}
              />
              <Summary
                label="Líquido"
                value={formatCurrency(summary.net || 0)}
                hint="bruto - devoluções + trocas"
              />
              <Summary label="Vendas concluídas" value={String(summary.salesCount || 0)} />
              <Summary label="Peças" value={String(summary.pieces || 0)} />
            </>
          )}
          {tab === 'clients' && (
            <>
              <Summary label="Clientes" value={String(summary.clientsCount || 0)} />
              <Summary label="Total comprado" value={formatCurrency(summary.totalSpent || 0)} />
            </>
          )}
          {tab === 'products' && (
            <>
              <Summary label="Líquido" value={formatCurrency(summary.revenueNet || 0)} />
              <Summary label="Estoque" value={String(summary.stockQty || 0)} />
            </>
          )}
          {tab === 'stock' && (
            <>
              <Summary label="SKUs" value={String(summary.skuCount || 0)} />
              <Summary label="Estoque" value={String(summary.stockQty || 0)} />
              <Summary label="Entradas / saídas" value={`${summary.entries ?? '—'} / ${summary.exits ?? '—'}`} />
            </>
          )}
          {tab === 'sellers' && (
            <>
              <Summary label="Líquido" value={formatCurrency(summary.revenueNet || 0)} />
              <Summary label="Vendas" value={String(summary.salesCount || 0)} />
              <Summary label="Descontos" value={formatCurrency(summary.discountTotal || 0)} />
            </>
          )}
          {tab === 'cash' && (
            <>
              <Summary label="Sessões" value={String(summary.sessions || 0)} />
              <Summary label="Esperado (fechadas)" value={formatCurrency(summary.expectedCash || 0)} />
              <Summary label="Diferença (fechadas)" value={formatCurrency(summary.difference || 0)} />
            </>
          )}
        </div>

        {loading ? (
          <Loading />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <Table tab={tab} rows={rows} />
          </div>
        )}

        <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-300">
          <span>{pagination.total || 0} registros</span>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Anterior
            </Button>
            <span className="px-2 py-2">
              {pagination.page || 1} / {pagination.totalPages || 1}
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const Summary = ({ label, value, hint }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
    {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
  </div>
);

const Table = ({ tab, rows }) => {
  if (!rows.length) {
    return <p className="p-4 text-sm text-gray-500">Nenhum registro neste filtro.</p>;
  }

  if (tab === 'sales') {
    return (
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-zinc-900 text-left text-gray-500">
          <tr>
            <th className="px-3 py-2">Venda</th>
            <th className="px-3 py-2">Data</th>
            <th className="px-3 py-2">Cliente</th>
            <th className="px-3 py-2">Vendedor</th>
            <th className="px-3 py-2">Unidade</th>
            <th className="px-3 py-2">Itens</th>
            <th className="px-3 py-2">Total</th>
            <th className="px-3 py-2">Pagamento</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-gray-100 dark:border-zinc-800">
              <td className="px-3 py-2">#{formatSaleNumber(row.number)}</td>
              <td className="px-3 py-2">{formatDateTime(row.createdAt)}</td>
              <td className="px-3 py-2">{row.client?.name || '—'}</td>
              <td className="px-3 py-2">{row.seller?.name || '—'}</td>
              <td className="px-3 py-2">{row.unit?.name || '—'}</td>
              <td className="px-3 py-2">
                {(row.items || [])
                  .map((item) => `${item.quantity}× ${item.productName} ${item.sku}`)
                  .join(', ')}
              </td>
              <td className="px-3 py-2">{formatCurrency(row.total)}</td>
              <td className="px-3 py-2">
                {(row.payments || [])
                  .map((payment) => `${getPaymentMethodLabel(payment.method)} ${formatCurrency(payment.amount)}`)
                  .join(', ')}
              </td>
              <td className="px-3 py-2">
                {getSaleStatusLabel(row.status)} · {getSaleChannelLabel(row.channel)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (tab === 'clients') {
    return (
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-zinc-900 text-left text-gray-500">
          <tr>
            <th className="px-3 py-2">Nº</th>
            <th className="px-3 py-2">Nome</th>
            <th className="px-3 py-2">Documento</th>
            <th className="px-3 py-2">Telefone</th>
            <th className="px-3 py-2">Compras</th>
            <th className="px-3 py-2">Total</th>
            <th className="px-3 py-2">Última compra</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-gray-100 dark:border-zinc-800">
              <td className="px-3 py-2">#{formatClientNumber(row.number)}</td>
              <td className="px-3 py-2">{row.name}</td>
              <td className="px-3 py-2">{row.document || '—'}</td>
              <td className="px-3 py-2">{row.phone || '—'}</td>
              <td className="px-3 py-2">{row.salesCount}</td>
              <td className="px-3 py-2">{formatCurrency(row.totalSpent)}</td>
              <td className="px-3 py-2">{row.lastPurchaseAt ? formatDateTime(row.lastPurchaseAt) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (tab === 'products') {
    return (
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-zinc-900 text-left text-gray-500">
          <tr>
            <th className="px-3 py-2">Produto</th>
            <th className="px-3 py-2">SKU</th>
            <th className="px-3 py-2">Cor / tam.</th>
            <th className="px-3 py-2">Unidade</th>
            <th className="px-3 py-2">Estoque</th>
            <th className="px-3 py-2">Qtd líquida</th>
            <th className="px-3 py-2">Faturamento líquido</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.variantId}-${row.unitId}`} className="border-t border-gray-100 dark:border-zinc-800">
              <td className="px-3 py-2">{row.product}</td>
              <td className="px-3 py-2">{row.sku}</td>
              <td className="px-3 py-2">{[row.color, row.size].filter(Boolean).join(' / ') || '—'}</td>
              <td className="px-3 py-2">{row.unit}</td>
              <td className="px-3 py-2">{row.stockQty}</td>
              <td className="px-3 py-2">{row.qtySoldNet}</td>
              <td className="px-3 py-2">{formatCurrency(row.revenueNet)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (tab === 'stock') {
    return (
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-zinc-900 text-left text-gray-500">
          <tr>
            <th className="px-3 py-2">Produto</th>
            <th className="px-3 py-2">SKU</th>
            <th className="px-3 py-2">Cor / tam.</th>
            <th className="px-3 py-2">Unidade</th>
            <th className="px-3 py-2">Estoque</th>
            <th className="px-3 py-2">Entradas</th>
            <th className="px-3 py-2">Saídas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.variantId}-${row.unitId}`} className="border-t border-gray-100 dark:border-zinc-800">
              <td className="px-3 py-2">{row.product}</td>
              <td className="px-3 py-2">{row.sku}</td>
              <td className="px-3 py-2">{[row.color, row.size].filter(Boolean).join(' / ') || '—'}</td>
              <td className="px-3 py-2">{row.unit}</td>
              <td className="px-3 py-2">{row.stockQty}</td>
              <td className="px-3 py-2">{row.entries ?? '—'}</td>
              <td className="px-3 py-2">{row.exits ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (tab === 'sellers') {
    return (
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-zinc-900 text-left text-gray-500">
          <tr>
            <th className="px-3 py-2">Vendedor</th>
            <th className="px-3 py-2">Unidade</th>
            <th className="px-3 py-2">Vendas</th>
            <th className="px-3 py-2">Peças líquidas</th>
            <th className="px-3 py-2">Líquido</th>
            <th className="px-3 py-2">Descontos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.sellerId}-${row.unitId}`} className="border-t border-gray-100 dark:border-zinc-800">
              <td className="px-3 py-2">{row.seller}</td>
              <td className="px-3 py-2">{row.unit}</td>
              <td className="px-3 py-2">{row.salesCount}</td>
              <td className="px-3 py-2">{row.piecesNet}</td>
              <td className="px-3 py-2">{formatCurrency(row.revenueNet)}</td>
              <td className="px-3 py-2">{formatCurrency(row.discountTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 dark:bg-zinc-900 text-left text-gray-500">
        <tr>
          <th className="px-3 py-2">Caixa</th>
          <th className="px-3 py-2">Unidade</th>
          <th className="px-3 py-2">Abriu</th>
          <th className="px-3 py-2">Fechou</th>
          <th className="px-3 py-2">Abertura</th>
          <th className="px-3 py-2">Fechamento</th>
          <th className="px-3 py-2">Vendas</th>
          <th className="px-3 py-2">Em dinheiro</th>
          <th className="px-3 py-2">Supr. / sangria / refund</th>
          <th className="px-3 py-2">Esperado / contado</th>
          <th className="px-3 py-2">Diferença</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-gray-100 dark:border-zinc-800">
            <td className="px-3 py-2">{row.register}</td>
            <td className="px-3 py-2">{row.unit}</td>
            <td className="px-3 py-2">{row.openedBy}</td>
            <td className="px-3 py-2">{row.closedBy || '—'}</td>
            <td className="px-3 py-2">{formatDateTime(row.openedAt)}</td>
            <td className="px-3 py-2">
              {row.closedAt ? formatDateTime(row.closedAt) : row.frozen ? '—' : 'Aberto (preview)'}
            </td>
            <td className="px-3 py-2">
              {formatCurrency(row.salesTotal)}
              {row.salesCount ? ` · ${row.salesCount}` : ''}
            </td>
            <td className="px-3 py-2">{formatCurrency(row.salesCash)}</td>
            <td className="px-3 py-2">
              {formatCurrency(row.supplies)} / {formatCurrency(row.bleeds)} / {formatCurrency(row.refunds)}
            </td>
            <td className="px-3 py-2">
              {formatCurrency(row.expectedCash)} / {row.countedCash == null ? '—' : formatCurrency(row.countedCash)}
            </td>
            <td className="px-3 py-2">
              {row.frozen ? formatCurrency(row.difference || 0) : 'Não fechado'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Reports;
