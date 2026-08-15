import React from 'react';
import Input from './Input';

const selectClass =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/20';

const StoreForm = ({ form, setForm, showType = true }) => {
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="space-y-4">
      <div className={`grid ${showType ? 'md:grid-cols-2' : ''} gap-4`}>
        <Input label="Nome *" value={form.name} onChange={set('name')} required placeholder="Ex: Reveza Ipanema" />
        {showType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo</label>
            <select value={form.type} onChange={set('type')} className={selectClass}>
              <option value="store">Loja</option>
              <option value="factory">Fábrica</option>
            </select>
          </div>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="CNPJ" value={form.document} onChange={set('document')} placeholder="00.000.000/0000-00" />
        <Input label="Telefone" value={form.phone} onChange={set('phone')} placeholder="(21) 00000-0000" />
        <Input label="E-mail" type="email" value={form.email} onChange={set('email')} />
        <Input label="CEP" value={form.zip} onChange={set('zip')} placeholder="00000-000" />
      </div>
      <div className="grid md:grid-cols-6 gap-4">
        <div className="md:col-span-4">
          <Input label="Rua" value={form.street} onChange={set('street')} />
        </div>
        <div className="md:col-span-2">
          <Input label="Número" value={form.number} onChange={set('number')} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Complemento" value={form.complement} onChange={set('complement')} />
        <Input label="Bairro" value={form.neighborhood} onChange={set('neighborhood')} />
        <Input label="Cidade" value={form.city} onChange={set('city')} />
        <Input label="UF" value={form.state} onChange={set('state')} placeholder="RJ" />
      </div>
    </div>
  );
};

export const emptyStoreForm = {
  name: '',
  type: 'store',
  document: '',
  phone: '',
  email: '',
  zip: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

export const storeToForm = (store) => ({
  name: store.name || '',
  type: store.type || 'store',
  document: store.document || '',
  phone: store.phone || '',
  email: store.email || '',
  zip: store.zip || '',
  street: store.street || '',
  number: store.number || '',
  complement: store.complement || '',
  neighborhood: store.neighborhood || '',
  city: store.city || '',
  state: store.state || '',
});

export default StoreForm;
