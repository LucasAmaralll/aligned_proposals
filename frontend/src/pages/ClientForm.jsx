import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Input from '../components/Input';
import Button from '../components/Button';
import Loading from '../components/Loading';
import api from '../services/api';
import {
  formatClientNumber,
  formatDocument,
  formatPhone,
  formatZipCode,
  inferClientKind,
  onlyDigits,
} from '../utils/helpers';

const ClientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [clientNumber, setClientNumber] = useState(null);
  const [clientKind, setClientKind] = useState('person');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    birthDate: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  useEffect(() => {
    if (isEdit) {
      loadClient();
    }
  }, [id]);

  const loadClient = async () => {
    try {
      setLoadingData(true);
      const response = await api.get(`/clients/${id}`);
      const data = response.data;
      setClientNumber(data.number);
      const kind = inferClientKind(data.document);
      setClientKind(kind);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: formatPhone(data.phone),
        document: formatDocument(data.document, kind),
        birthDate: data.birthDate ? String(data.birthDate).slice(0, 10) : '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: formatZipCode(data.zipCode),
      });
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      alert('Erro ao carregar cliente');
      navigate('/clients');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let next = value;
    if (name === 'phone') next = formatPhone(value);
    if (name === 'document') next = formatDocument(value, clientKind);
    if (name === 'zipCode') next = formatZipCode(value);
    if (name === 'state') next = value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
    setFormData({
      ...formData,
      [name]: next,
    });
  };

  const handleKindChange = (kind) => {
    setClientKind(kind);
    setFormData((current) => ({
      ...current,
      document: formatDocument(current.document, kind),
      birthDate: kind === 'company' ? '' : current.birthDate,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert(clientKind === 'company' ? 'Razão social é obrigatória' : 'Nome é obrigatório');
      return;
    }

    const documentDigits = onlyDigits(formData.document);
    if (documentDigits) {
      if (clientKind === 'person' && documentDigits.length !== 11) {
        alert('CPF incompleto');
        return;
      }
      if (clientKind === 'company' && documentDigits.length !== 14) {
        alert('CNPJ incompleto');
        return;
      }
    }

    const phoneDigits = onlyDigits(formData.phone);
    if (phoneDigits && phoneDigits.length < 10) {
      alert('Telefone incompleto');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        phone: phoneDigits || '',
        document: documentDigits || '',
        zipCode: onlyDigits(formData.zipCode) || '',
        birthDate: clientKind === 'company' ? null : formData.birthDate || null,
      };

      if (isEdit) {
        await api.put(`/clients/${id}`, payload);
        navigate(`/clients/${id}`);
      } else {
        const response = await api.post('/clients', payload);
        navigate(`/clients/${response.data.id}`);
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Layout title={isEdit ? 'Editar Cliente' : 'Novo Cliente'}>
        <div className="flex items-center justify-center h-64">
          <Loading />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEdit ? 'Editar Cliente' : 'Novo Cliente'}>
      <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => navigate('/clients')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Voltar
              </button>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isEdit
                  ? `Cliente #${formatClientNumber(clientNumber)}`
                  : 'Pessoa física ou loja com CNPJ. O número é gerado automaticamente.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tipo de cliente
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleKindChange('person')}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                      clientKind === 'person'
                        ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                        : 'border-gray-200 text-gray-700 dark:border-zinc-700 dark:text-gray-300'
                    }`}
                  >
                    Pessoa física
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKindChange('company')}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                      clientKind === 'company'
                        ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                        : 'border-gray-200 text-gray-700 dark:border-zinc-700 dark:text-gray-300'
                    }`}
                  >
                    Pessoa jurídica
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informações básicas
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label={clientKind === 'company' ? 'Razão social *' : 'Nome *'}
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={clientKind === 'company' ? 'Ex: Loja Aurora Ltda' : 'Ex: Ana Souza'}
                      required
                    />
                  </div>
                  
                  <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  
                  <Input
                    label="Telefone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    inputMode="numeric"
                    placeholder="(11) 99999-9999"
                  />
                  
                  <Input
                    label={clientKind === 'company' ? 'CNPJ' : 'CPF'}
                    name="document"
                    value={formData.document}
                    onChange={handleChange}
                    inputMode="numeric"
                    placeholder={clientKind === 'company' ? '00.000.000/0000-00' : '000.000.000-00'}
                  />

                  {clientKind === 'person' && (
                    <Input
                      label="Data de nascimento"
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                    />
                  )}
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Endereço
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Endereço"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <Input
                    label="Cidade"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                  
                  <Input
                    label="Estado"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="SP"
                  />
                  
                  <Input
                    label="CEP"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    inputMode="numeric"
                    placeholder="00000-000"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/clients')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Cliente')}
                </Button>
              </div>
            </form>
          </div>
    </Layout>
  );
};

export default ClientForm;
