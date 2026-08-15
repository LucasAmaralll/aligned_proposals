import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../services/api';

const selectClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500';

const ProductForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    gender: '',
    categoryId: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const response = await api.post('/categories', { name: newCategory.trim() });
      setCategories((current) => [...current, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData((current) => ({ ...current, categoryId: response.data.id }));
      setNewCategory('');
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao criar categoria');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/catalog/products', {
        ...formData,
        categoryId: formData.categoryId || null,
      });
      navigate(`/products/${response.data.id}`);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      alert(error.response?.data?.error || 'Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Novo Produto">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Voltar
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Novo Produto</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Cadastre o produto pai. As variações (SKU, tamanho e cor) entram na próxima tela.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6"
        >
          <Input
            label="Nome *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={selectClass}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Tipo"
              name="type"
              value={formData.type}
              onChange={handleChange}
              placeholder="Camiseta, calça..."
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gênero
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="">Selecione</option>
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
                <option value="unissex">Unissex</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoria
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nova categoria"
                className={selectClass}
              />
              <Button type="button" variant="secondary" onClick={handleCreateCategory}>
                Adicionar
              </Button>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar e adicionar variações'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ProductForm;
