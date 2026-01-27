import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import Loading from '../components/Loading';
import api from '../services/api';
import { formatCurrency } from '../utils/helpers';

const QuoteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    validUntil: '',
    notes: '',
    termsConditions: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    discount: 0,
    tax: 0
  });

  useEffect(() => {
    loadClients();
    loadProducts();
    if (isEdit) {
      loadQuote();
    }
  }, [id]);

  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      // Backend retorna { clients: [...], pagination: {...} }
      const clientsData = response.data.clients || response.data;
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setClients([]);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
    }
  };

  const loadQuote = async () => {
    try {
      setLoadingData(true);
      const response = await api.get(`/quotes/${id}`);
      const quote = response.data;
      
      setFormData({
        title: quote.title,
        description: quote.description || '',
        clientId: quote.clientId,
        validUntil: quote.validUntil ? quote.validUntil.split('T')[0] : '',
        notes: quote.notes || '',
        termsConditions: quote.termsConditions || '',
        items: quote.items || [{ description: '', quantity: 1, unitPrice: 0 }],
        discount: Number(quote.discount) || 0,
        tax: Number(quote.tax) || 0
      });
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error);
      alert('Erro ao carregar orçamento');
      navigate('/quotes');
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

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleProductSelect = (index, productId) => {
    if (!productId) return;
    
    const product = products.find(p => p.id === productId);
    if (product) {
      const newItems = [...formData.items];
      newItems[index] = {
        ...newItems[index],
        description: product.name,
        unitPrice: product.idealSalePrice,
        productId: product.id
      };
      setFormData({ ...formData, items: newItems });
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      alert('É necessário ter pelo menos um item');
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = Number(formData.discount) || 0;
    const tax = Number(formData.tax) || 0;
    return subtotal - discount + tax;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Título é obrigatório');
      return;
    }
    
    if (!formData.clientId) {
      alert('Cliente é obrigatório');
      return;
    }

    if (formData.items.some(item => !item.description.trim())) {
      alert('Todos os itens devem ter descrição');
      return;
    }

    try {
      setLoading(true);
      
      const subtotal = calculateSubtotal();
      const total = calculateTotal();
      
      const payload = {
        ...formData,
        items: formData.items,
        subtotal,
        total,
        discount: Number(formData.discount) || 0,
        tax: Number(formData.tax) || 0,
        validUntil: formData.validUntil || null
      };
      
      if (isEdit) {
        await api.put(`/quotes/${id}`, payload);
      } else {
        await api.post('/quotes', payload);
      }
      
      navigate('/quotes');
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      alert(error.response?.data?.error || 'Erro ao salvar orçamento');
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
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => navigate('/quotes')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Voltar
              </button>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEdit ? 'Editar Orçamento' : 'Novo Orçamento'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isEdit ? 'Atualize as informações do orçamento' : 'Crie um novo orçamento'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informações Básicas
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Título *"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Website Institucional"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descrição
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Descrição do orçamento..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cliente *
                    </label>
                    <select
                      name="clientId"
                      value={formData.clientId}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Selecione um cliente</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Input
                    label="Válido até"
                    type="date"
                    name="validUntil"
                    value={formData.validUntil}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Itens */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Itens do Orçamento
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Adicionar Item
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      {/* Seletor de Produto */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Selecionar Produto (opcional)
                        </label>
                        <select
                          value={item.productId || ''}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Ou digite manualmente abaixo</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} - {formatCurrency(product.idealSalePrice)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-3 items-start">
                        <div className="flex-1 grid md:grid-cols-3 gap-3">
                          <div className="md:col-span-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              placeholder="Descrição do item *"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              required
                            />
                          </div>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            placeholder="Qtd"
                            min="1"
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                          />
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            placeholder="Valor unitário"
                            min="0"
                            step="0.01"
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                          />
                          <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold">
                            {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                          </div>
                        </div>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totais */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex justify-between text-gray-900 dark:text-white">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Desconto (R$)"
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                    <Input
                      label="Taxa/Impostos (R$)"
                      type="number"
                      name="tax"
                      value={formData.tax}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span>Total:</span>
                    <span className="text-blue-600 dark:text-blue-400">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informações Adicionais
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observações
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Observações internas..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Termos e Condições
                    </label>
                    <textarea
                      name="termsConditions"
                      value={formData.termsConditions}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Termos e condições do orçamento..."
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/quotes')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Orçamento')}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default QuoteForm;
