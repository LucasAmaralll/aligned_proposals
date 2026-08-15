import React, { useEffect, useState } from 'react';
import { PencilIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { useCompany } from '../context/CompanyContext';
import api from '../services/api';
import { formatCurrency } from '../utils/helpers';
import { getRoleLabel } from '../utils/permissions';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'seller',
  unitIds: [],
  commissionRate: '',
  salary: '',
  active: true,
};

const selectClass =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/20';

const Team = () => {
  const { units: contextUnits } = useCompany();
  const [members, setMembers] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [teamRes, unitsRes] = await Promise.all([
        api.get('/team'),
        api.get('/companies/me/units'),
      ]);
      setMembers(teamRes.data.members || []);
      setUnits(unitsRes.data.units || []);
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (member) => {
    setEditing(member);
    setForm({
      name: member.name,
      email: member.email,
      password: '',
      role: member.role?.name || 'seller',
      unitIds: (member.units || []).map((unit) => unit.id),
      commissionRate: member.commissionRate != null ? String(member.commissionRate) : '',
      salary: member.salary != null ? String(member.salary) : '',
      active: member.active !== false,
    });
    setModal(true);
  };

  const toggleUnit = (unitId) => {
    setForm((current) => ({
      ...current,
      unitIds: current.unitIds.includes(unitId)
        ? current.unitIds.filter((id) => id !== unitId)
        : [...current.unitIds, unitId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        role: form.role,
        unitIds: form.unitIds,
        commissionRate: form.commissionRate === '' ? null : Number(form.commissionRate),
        salary: form.salary === '' ? null : Number(form.salary),
        active: form.active,
        ...(form.password && { password: form.password }),
      };
      if (editing) {
        await api.put(`/team/${editing.id}`, payload);
      } else {
        await api.post('/team', { ...payload, email: form.email, password: form.password });
      }
      setModal(false);
      await loadAll();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao salvar pessoa');
    } finally {
      setSaving(false);
    }
  };

  const launchSalary = async (member) => {
    if (!member.salary) {
      alert('Defina o salário dessa pessoa antes de lançar');
      return;
    }
    const unitId = member.units?.[0]?.id || '';
    try {
      await api.post('/expenses', {
        description: `Salário — ${member.name}`,
        amount: Number(member.salary),
        category: 'Salários',
        status: 'pending',
        unitId: unitId || null,
      });
      alert('Salário lançado em Gastos');
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao lançar salário');
    }
  };

  const membersOf = (unitId) =>
    members.filter((member) => (member.units || []).some((unit) => unit.id === unitId));
  const unassigned = members.filter((member) => !(member.units || []).length);

  return (
    <Layout title="Equipe">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Equipe"
          description="Cadastre quem vende em cada loja, o privilégio, a comissão e o salário. O cadastro da loja fica no Perfil."
          actions={
            <Button type="button" onClick={openCreate}>
              <span className="flex items-center gap-2">
                <PlusIcon className="h-5 w-5" />
                Nova pessoa
              </span>
            </Button>
          }
        />

        {loading ? (
          <Loading />
        ) : (
          <div className="space-y-8">
            {units.map((unit) => (
              <section key={unit.id} className="surface overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">{unit.name}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {unit.type === 'factory' ? 'Fábrica' : 'Loja'} · {membersOf(unit.id).length} pessoa(s)
                    </p>
                  </div>
                </div>
                {membersOf(unit.id).length === 0 ? (
                  <p className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400">
                    Ninguém vinculado a esta unidade ainda.
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {membersOf(unit.id).map((member) => (
                      <div key={member.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getRoleLabel(member.role)} · {member.email}
                            {member.active === false ? ' · inativa' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600 dark:text-gray-300">
                            Comissão {member.commissionRate != null ? `${member.commissionRate}%` : '—'}
                          </span>
                          <span className="text-gray-600 dark:text-gray-300">
                            Salário {member.salary != null ? formatCurrency(member.salary) : '—'}
                          </span>
                          {member.salary && (
                            <button
                              type="button"
                              onClick={() => launchSalary(member)}
                              className="text-gray-700 dark:text-gray-200 hover:underline"
                            >
                              Lançar salário
                            </button>
                          )}
                          <button type="button" onClick={() => openEdit(member)} className="text-blue-600 dark:text-blue-400">
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}

            {unassigned.length > 0 && (
              <section className="surface p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Sem unidade</h2>
                {unassigned.map((member) => (
                  <div key={member.id} className="flex justify-between py-2">
                    <span className="text-gray-900 dark:text-white">{member.name}</span>
                    <button type="button" onClick={() => openEdit(member)} className="text-blue-600 dark:text-blue-400 text-sm">
                      Editar
                    </button>
                  </div>
                ))}
              </section>
            )}

            {!units.length && !members.length && (
              <div className="surface py-12 text-center">
                <UserGroupIcon className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Nenhuma pessoa cadastrada.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar pessoa' : 'Nova pessoa'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          {!editing && (
            <Input
              label="Email *"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          )}
          <Input
            label={editing ? 'Nova senha (opcional)' : 'Senha *'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editing}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Privilégio</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={selectClass}
            >
              <option value="seller">Vendedora — só as vendas e a comissão dela</option>
              <option value="manager">Gerente — operação da loja, sem equipe</option>
              <option value="admin">Administrador — faturamento e cadastros</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Comissão (%)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.commissionRate}
              onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
            />
            <Input
              label="Salário"
              type="number"
              min="0"
              step="0.01"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unidades</p>
            <div className="space-y-2">
              {(units.length ? units : contextUnits).map((unit) => (
                <label key={unit.id} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={form.unitIds.includes(unit.id)}
                    onChange={() => toggleUnit(unit.id)}
                  />
                  {unit.name}
                </label>
              ))}
            </div>
          </div>
          {editing && (
            <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Conta ativa
            </label>
          )}
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

export default Team;
