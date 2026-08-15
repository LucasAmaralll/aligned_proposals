import React, { useState } from 'react';
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import Modal from './Modal';
import StoreForm, { emptyStoreForm, storeToForm } from './StoreForm';
import { useCompany } from '../context/CompanyContext';
import api from '../services/api';

const StoresSettings = () => {
  const { units, refreshCompany } = useCompany();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyStoreForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyStoreForm);
    setModal(true);
  };

  const openEdit = (unit) => {
    setEditing(unit);
    setForm(storeToForm(unit));
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Nome da loja é obrigatório');
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await api.put(`/companies/me/units/${editing.id}`, form);
      } else {
        await api.post('/companies/me/units', form);
      }
      setModal(false);
      await refreshCompany();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao salvar loja');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (unit) => {
    if (!window.confirm(`Desativar "${unit.name}"? O histórico de vendas permanece.`)) return;
    try {
      await api.delete(`/companies/me/units/${unit.id}`);
      await refreshCompany();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao desativar loja');
    }
  };

  const addressLine = (unit) =>
    [unit.street, unit.number, unit.neighborhood, unit.city, unit.state].filter(Boolean).join(', ') ||
    'Endereço não cadastrado';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lojas e fábrica</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Nome, CNPJ e endereço de cada unidade. Isso atualiza o seletor do topo.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <span className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Nova loja
          </span>
        </Button>
      </div>

      <div className="space-y-3">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {unit.name}
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  {unit.type === 'factory' ? 'Fábrica' : 'Loja'}
                </span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {unit.document || 'CNPJ não informado'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{addressLine(unit)}</p>
              {unit.phone && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{unit.phone}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => openEdit(unit)} className="text-blue-600 dark:text-blue-400">
                <PencilIcon className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => deactivate(unit)} className="text-red-600 dark:text-red-400">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
        {!units.length && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma loja cadastrada.</p>
        )}
      </div>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Editar loja' : 'Nova loja'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <StoreForm form={form} setForm={setForm} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar loja'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StoresSettings;
