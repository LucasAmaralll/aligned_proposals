import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import Loading from '../components/Loading';
import api from '../services/api';

const ClientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
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
      setFormData(response.data);
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      alert('Erro ao carregar cliente');
      navigate('/clients');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    try {
      setLoading(true);
      
      if (isEdit) {
        await api.put(`/clients/${id}`, formData);
      } else {
        await api.post('/clients', formData);
      }
      
      navigate('/clients');
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
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
                {isEdit ? 'Atualize as informações do cliente' : 'Adicione um novo cliente'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
              {/* Informações Básicas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informações Básicas
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Nome *"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
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
                    placeholder="(11) 99999-9999"
                  />
                  
                  <Input
                    label="CPF/CNPJ"
                    name="document"
                    value={formData.document}
                    onChange={handleChange}
                  />
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
        </main>
      </div>
    </div>
  );
};

export default ClientForm;
