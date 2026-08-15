import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Input from '../components/Input';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import api from '../services/api';
import { formatCurrency } from '../utils/helpers';

const selectClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500';

const emptyVariant = {
  sku: '',
  size: '',
  color: '',
  width: '',
  height: '',
  salePrice: '',
  costPrice: '',
  ncm: '',
  ean: '',
  cest: '',
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    gender: '',
    categoryId: '',
    active: true,
  });
  const [variantModal, setVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [variantForm, setVariantForm] = useState(emptyVariant);
  const [savingVariant, setSavingVariant] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productRes, categoriesRes] = await Promise.all([
        api.get(`/catalog/products/${id}`),
        api.get('/categories'),
      ]);
      const data = productRes.data;
      setProduct(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        type: data.type || '',
        gender: data.gender || '',
        categoryId: data.categoryId || '',
        active: data.active !== false,
      });
      setCategories(categoriesRes.data.categories || []);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      alert('Produto não encontrado');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    try {
      setSaving(true);
      const response = await api.put(`/catalog/products/${id}`, {
        ...formData,
        categoryId: formData.categoryId || null,
      });
      setProduct(response.data);
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const openNewVariant = () => {
    setEditingVariant(null);
    setVariantForm(emptyVariant);
    setVariantModal(true);
  };

  const openEditVariant = (variant) => {
    setEditingVariant(variant);
    setVariantForm({
      sku: variant.sku || '',
      size: variant.size || '',
      color: variant.color || '',
      width: variant.width || '',
      height: variant.height || '',
      salePrice: variant.salePrice || '',
      costPrice: variant.costPrice || '',
      ncm: variant.ncm || '',
      ean: variant.ean || '',
      cest: variant.cest || '',
    });
    setVariantModal(true);
  };

  const handleVariantChange = (e) => {
    setVariantForm({ ...variantForm, [e.target.name]: e.target.value });
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    if (!variantForm.sku.trim() || variantForm.salePrice === '') {
      alert('SKU e preço de venda são obrigatórios');
      return;
    }

    try {
      setSavingVariant(true);
      if (editingVariant) {
        await api.put(`/catalog/variants/${editingVariant.id}`, variantForm);
      } else {
        await api.post(`/catalog/products/${id}/variants`, variantForm);
      }
      setVariantModal(false);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao salvar variação');
    } finally {
      setSavingVariant(false);
    }
  };

  const toggleVariantActive = async (variant) => {
    try {
      await api.put(`/catalog/variants/${variant.id}`, { active: !variant.active });
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao atualizar variação');
    }
  };

  if (loading) {
    return (
      <Layout title="Produto">
        <div className="flex items-center justify-center h-64">
          <Loading />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={product?.name || 'Produto'}>
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Voltar
        </button>

        <form
          onSubmit={handleSaveProduct}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dados do produto</h2>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
              />
              Ativo
            </label>
          </div>

          <Input label="Nome *" name="name" value={formData.name} onChange={handleChange} required />

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

          <div className="grid md:grid-cols-3 gap-4">
            <Input label="Tipo" name="type" value={formData.type} onChange={handleChange} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gênero
              </label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={selectClass}>
                <option value="">Selecione</option>
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
                <option value="unissex">Unissex</option>
              </select>
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
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar produto'}
            </Button>
          </div>
        </form>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Variações</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cada SKU tem tamanho, cor e preço próprios
              </p>
            </div>
            <Button type="button" onClick={openNewVariant} icon={PlusIcon}>
              Nova variação
            </Button>
          </div>

          {(product.variants || []).length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma variação cadastrada. Adicione um SKU para controlar estoque.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    <th className="py-3 pr-4">SKU</th>
                    <th className="py-3 pr-4">Tamanho</th>
                    <th className="py-3 pr-4">Cor</th>
                    <th className="py-3 pr-4">Preço</th>
                    <th className="py-3 pr-4">Estoque</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {product.variants.map((variant) => {
                    const qty = (variant.stocks || []).reduce(
                      (sum, stock) => sum + parseFloat(stock.quantity || 0),
                      0
                    );
                    return (
                      <tr key={variant.id}>
                        <td className="py-3 pr-4 text-sm font-medium text-gray-900 dark:text-white">
                          {variant.sku}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-700 dark:text-gray-300">
                          {variant.size || '—'}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-700 dark:text-gray-300">
                          {variant.color || '—'}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-700 dark:text-gray-300">
                          {formatCurrency(variant.salePrice)}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-700 dark:text-gray-300">{qty}</td>
                        <td className="py-3 pr-4 text-sm">
                          <span
                            className={
                              variant.active
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-500'
                            }
                          >
                            {variant.active ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td className="py-3 text-right text-sm space-x-3">
                          <button
                            type="button"
                            onClick={() => openEditVariant(variant)}
                            className="text-blue-600 dark:text-blue-400"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleVariantActive(variant)}
                            className="text-gray-600 dark:text-gray-300"
                          >
                            {variant.active ? 'Inativar' : 'Ativar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={variantModal}
        onClose={() => setVariantModal(false)}
        title={editingVariant ? 'Editar variação' : 'Nova variação'}
      >
        <form onSubmit={handleSaveVariant} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="SKU *" name="sku" value={variantForm.sku} onChange={handleVariantChange} required />
            <Input label="Tamanho" name="size" value={variantForm.size} onChange={handleVariantChange} />
            <Input label="Cor" name="color" value={variantForm.color} onChange={handleVariantChange} />
            <Input
              label="Preço de venda *"
              name="salePrice"
              type="number"
              step="0.01"
              min="0"
              value={variantForm.salePrice}
              onChange={handleVariantChange}
              required
            />
            <Input
              label="Custo"
              name="costPrice"
              type="number"
              step="0.01"
              min="0"
              value={variantForm.costPrice}
              onChange={handleVariantChange}
            />
            <Input
              label="Largura"
              name="width"
              type="number"
              step="0.01"
              value={variantForm.width}
              onChange={handleVariantChange}
            />
            <Input
              label="Altura"
              name="height"
              type="number"
              step="0.01"
              value={variantForm.height}
              onChange={handleVariantChange}
            />
            <Input label="NCM" name="ncm" value={variantForm.ncm} onChange={handleVariantChange} />
            <Input label="EAN" name="ean" value={variantForm.ean} onChange={handleVariantChange} />
            <Input label="CEST" name="cest" value={variantForm.cest} onChange={handleVariantChange} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setVariantModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={savingVariant}>
              {savingVariant ? 'Salvando...' : 'Salvar variação'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default ProductDetail;
