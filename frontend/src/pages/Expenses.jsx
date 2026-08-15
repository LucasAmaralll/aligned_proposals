import React, { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { useCompany } from '../context/CompanyContext';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';

const CATEGORIES = [
  'Aluguel',
  'Energia',
  'Fornecedor',
  'Marketing',
  'Transporte',
  'Salários',
  'Outros',
];

const STATUS_LABELS = {
  pending: 'A pagar',
  paid: 'Pago',
  overdue: 'Vencido',
};

const emptyForm = {
  description: '',
  amount: '',
  category: 'Aluguel',
  status: 'pending',
  dueDate: '',
  unitId: '',
  notes: '',
};

const selectClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500';

const statusClass = (status) => {
  if (status === 'paid') return 'text-green-600 dark:text-green-400';
  if (status === 'overdue') return 'text-red-600 dark:text-red-400';
  return 'text-amber-600 dark:text-amber-400';
};

const Expenses = () => {
  const { units, currentUnit } = useCompany();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const timer = setTimeout(() => loadExpenses(), 280);
    return () => clearTimeout(timer);
  }, [search, status, category]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/expenses', {
        params: {
          ...(search.trim() && { search: search.trim() }),
          ...(status && { status }),
          ...(category && { category }),
        },
      });
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error('Erro ao carregar gastos:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, unitId: currentUnit?.id || '' });
    setModal(true);
  };

  const openEdit = (expense) => {
    setEditing(expense);
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category,
      status: expense.status,
      dueDate: expense.dueDate ? expense.dueDate.split('T')[0] : '',
      unitId: expense.unitId || '',
      notes: expense.notes || '',
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        amount: Number(form.amount),
        unitId: form.unitId || null,
        dueDate: form.dueDate || null,
        notes: form.notes || null,
      };
      if (editing) {
        await api.put(`/expenses/${editing.id}`, payload);
      } else {
        await api.post('/expenses', payload);
      }
      setModal(false);
      await loadExpenses();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao salvar gasto');
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (expense) => {
    try {
      await api.put(`/expenses/${expense.id}`, { status: 'paid' });
      await loadExpenses();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao marcar como pago');
    }
  };

  const removeExpense = async (expense) => {
    if (!window.confirm(`Excluir "${expense.description}"?`)) return;
    try {
      await api.delete(`/expenses/${expense.id}`);
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao excluir gasto');
    }
  };

  const totalPending = expenses
    .filter((item) => item.displayStatus !== 'paid')
    .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  return (
    <Layout title="Gastos">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gastos</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Contas a pagar com vencimento e categoria
            </p>
          </div>
          <Button type="button" onClick={openCreate}>
            <span className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Novo gasto
            </span>
          </Button>
        </div>

        <div className="mb-6 grid sm:grid-cols-4 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar descrição..."
            className="sm:col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
            <option value="">Todos os status</option>
            <option value="pending">A pagar</option>
            <option value="overdue">Vencido</option>
            <option value="paid">Pago</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
            <option value="">Todas as categorias</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {!loading && expenses.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Em aberto nesta lista: {formatCurrency(totalPending)}
          </p>
        )}

        {loading ? (
          <Loading />
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum gasto</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {search || status || category
                ? 'Nenhum gasto encontrado com esse filtro'
                : 'Registre aluguel, fornecedor e outras contas'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Unidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {expense.description}
                        </div>
                        {expense.notes && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{expense.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {expense.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {expense.dueDate ? formatDate(expense.dueDate) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {expense.unit?.name || '—'}
                      </td>
                      <td className={`px-6 py-4 text-sm font-medium ${statusClass(expense.displayStatus)}`}>
                        {STATUS_LABELS[expense.displayStatus] || expense.status}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm whitespace-nowrap space-x-3">
                        {expense.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => markPaid(expense)}
                            className="text-green-600 dark:text-green-400"
                          >
                            Pagar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(expense)}
                          className="text-blue-600 dark:text-blue-400"
                        >
                          <PencilIcon className="h-5 w-5 inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExpense(expense)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <TrashIcon className="h-5 w-5 inline" />
                        </button>
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
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Editar gasto' : 'Novo gasto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Descrição *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor *"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoria *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={selectClass}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Vencimento"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={selectClass}
              >
                <option value="pending">A pagar</option>
                <option value="paid">Pago</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unidade
            </label>
            <select
              value={form.unitId}
              onChange={(e) => setForm({ ...form, unitId: e.target.value })}
              className={selectClass}
            >
              <option value="">Empresa (sem unidade)</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Observação"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Expenses;
