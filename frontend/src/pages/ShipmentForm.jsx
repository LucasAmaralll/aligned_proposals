import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
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
  formatSaleNumber,
  formatZipCode,
  onlyDigits,
  SHIPMENT_CARRIER_LABELS,
} from '../utils/helpers';

const emptyForm = {
  recipientName: '',
  phone: '',
  document: '',
  address: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  itemsNote: '',
  carrier: 'correios',
  notes: '',
  unitId: '',
};

const fillFromClient = (client) => ({
  recipientName: client.name || '',
  phone: formatPhone(client.phone),
  document: formatDocument(client.document),
  address: client.address || '',
  city: client.city || '',
  state: client.state || '',
  zipCode: formatZipCode(client.zipCode),
});

const fillFromSale = (sale) => {
  const itemsNote = (sale.items || [])
    .map((item) => {
      const detail = [item.size, item.color].filter(Boolean).join(' ');
      return `${parseFloat(item.quantity)}x ${item.productName}${detail ? ` (${detail})` : ''} · ${item.sku}`;
    })
    .join('\n');

  return {
    ...(sale.client ? fillFromClient(sale.client) : {}),
    itemsNote,
    unitId: sale.unitId || sale.unit?.id || '',
  };
};

const ShipmentForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { units, currentUnit } = useCompany();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ ...emptyForm, unitId: currentUnit?.id || '' });
  const [client, setClient] = useState(null);
  const [sale, setSale] = useState(null);
  const [clientQuery, setClientQuery] = useState('');
  const [saleQuery, setSaleQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit || Boolean(searchParams.get('saleId')));

  const setField = (name) => (event) => {
    let value = event.target.value;
    if (name === 'phone') value = formatPhone(value);
    if (name === 'document') value = formatDocument(value);
    if (name === 'zipCode') value = formatZipCode(value);
    if (name === 'state') value = value.toUpperCase().slice(0, 2);
    setForm((current) => ({ ...current, [name]: value }));
  };

  const searchClients = useCallback(async (term) => {
    const response = await api.get('/clients', { params: { search: term, limit: 8 } });
    return response.data.clients || [];
  }, []);

  const searchSales = useCallback(async (term) => {
    const response = await api.get('/sales', { params: { search: term, limit: 8 } });
    return response.data.sales || [];
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        if (isEdit) {
          const response = await api.get(`/shipments/${id}`);
          const item = response.data;
          setForm({
            recipientName: item.recipientName || '',
            phone: formatPhone(item.phone),
            document: formatDocument(item.document),
            address: item.address || '',
            complement: item.complement || '',
            neighborhood: item.neighborhood || '',
            city: item.city || '',
            state: item.state || '',
            zipCode: formatZipCode(item.zipCode),
            itemsNote: item.itemsNote || '',
            carrier: item.carrier || 'correios',
            notes: item.notes || '',
            unitId: item.unitId || '',
          });
          setClient(item.client || null);
          setSale(item.sale || null);
          return;
        }

        const saleId = searchParams.get('saleId');
        if (saleId) {
          const response = await api.get(`/sales/${saleId}`);
          const loaded = response.data;
          setSale(loaded);
          setClient(loaded.client || null);
          setForm((current) => ({
            ...current,
            ...fillFromSale(loaded),
            unitId: loaded.unitId || current.unitId,
          }));
        }
      } catch (error) {
        alert(error.response?.data?.error || 'Erro ao carregar envio');
        navigate('/shipments');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEdit, navigate, searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.recipientName.trim()) {
      alert('Informe quem recebe');
      return;
    }

    const payload = {
      ...form,
      phone: onlyDigits(form.phone) || null,
      document: onlyDigits(form.document) || null,
      zipCode: onlyDigits(form.zipCode) || null,
      unitId: form.unitId || null,
      clientId: client?.id || null,
      saleId: sale?.id || null,
      origin: sale ? 'sale' : 'manual',
    };

    try {
      setSaving(true);
      if (isEdit) {
        await api.put(`/shipments/${id}`, payload);
      } else {
        await api.post('/shipments', payload);
      }
      navigate('/shipments');
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao salvar envio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title={isEdit ? 'Editar envio' : 'Novo envio'}>
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/shipments')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Voltar aos envios
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isEdit ? 'Editar envio' : 'Novo envio'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Use para quem comprou na loja e pediu para mandar pelos Correios, ou para anotar um pacote que ainda não está no sistema.
        </p>

        {loading ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Vínculos (opcional)</h2>
              <Typeahead
                value={clientQuery}
                onChange={setClientQuery}
                fetchOptions={searchClients}
                onSelect={(item) => {
                  setClient(item);
                  setForm((current) => ({ ...current, ...fillFromClient(item) }));
                  setClientQuery('');
                }}
                selected={client}
                selectedLabel={<p className="font-medium">{client?.name}</p>}
                onClear={() => setClient(null)}
                placeholder="Buscar cliente cadastrado"
                hint="Preenche nome, telefone e endereço se o cliente já tiver"
                emptyText="Nenhum cliente encontrado"
                renderOption={(item) => (
                  <div>
                    <p className="text-sm">
                      #{formatClientNumber(item.number)} · {item.name}
                    </p>
                    {item.document && (
                      <p className="text-xs text-gray-500">{formatDocument(item.document)}</p>
                    )}
                  </div>
                )}
              />
              <Typeahead
                value={saleQuery}
                onChange={setSaleQuery}
                fetchOptions={searchSales}
                onSelect={(item) => {
                  setSale(item);
                  setForm((current) => ({
                    ...current,
                    unitId: item.unitId || item.unit?.id || current.unitId,
                    itemsNote:
                      current.itemsNote ||
                      `Venda #${formatSaleNumber(item.number)} · ${formatCurrency(item.total)}`,
                  }));
                  if (item.client) {
                    setClient(item.client);
                    setForm((current) => ({ ...current, ...fillFromClient(item.client) }));
                  }
                  setSaleQuery('');
                }}
                selected={sale}
                selectedLabel={
                  <p className="font-medium">
                    Venda #{formatSaleNumber(sale?.number)}
                    {sale?.client?.name ? ` · ${sale.client.name}` : ''}
                  </p>
                }
                onClear={() => setSale(null)}
                placeholder="Vincular a uma venda (opcional)"
                hint="Atacado da Vestisul, PDV ou pedido do site"
                emptyText="Nenhuma venda encontrada"
                renderOption={(item) => (
                  <div>
                    <p className="text-sm">
                      #{formatSaleNumber(item.number)} · {formatCurrency(item.total)}
                    </p>
                    <p className="text-xs text-gray-500">{item.client?.name || 'Cliente avulso'}</p>
                  </div>
                )}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unidade</label>
                <select
                  value={form.unitId}
                  onChange={setField('unitId')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sem unidade</option>
                  {(units || []).map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Destinatário</h2>
              <Input label="Quem recebe" value={form.recipientName} onChange={setField('recipientName')} required />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Telefone" value={form.phone} onChange={setField('phone')} inputMode="numeric" />
                <Input label="CPF / CNPJ" value={form.document} onChange={setField('document')} inputMode="numeric" />
              </div>
              <Input label="Endereço" value={form.address} onChange={setField('address')} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Complemento" value={form.complement} onChange={setField('complement')} />
                <Input label="Bairro" value={form.neighborhood} onChange={setField('neighborhood')} />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Input label="Cidade" value={form.city} onChange={setField('city')} />
                <Input label="UF" value={form.state} onChange={setField('state')} placeholder="SC" />
                <Input
                  label="CEP"
                  value={form.zipCode}
                  onChange={setField('zipCode')}
                  inputMode="numeric"
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">O que vai no pacote</h2>
              <textarea
                value={form.itemsNote}
                onChange={setField('itemsNote')}
                rows={4}
                placeholder="Peças, tamanhos, observação para a expedição"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transportadora</label>
                <select
                  value={form.carrier}
                  onChange={setField('carrier')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Object.entries(SHIPMENT_CARRIER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={form.notes}
                onChange={setField('notes')}
                rows={2}
                placeholder="Observação interna (opcional)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate('/shipments')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Colocar na fila'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default ShipmentForm;
