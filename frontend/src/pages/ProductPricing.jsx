import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import api from '../services/api';
import Layout from '../components/Layout';
import PricingCalculator from '../components/PricingCalculator';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';

const ProductPricing = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(), 280);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (id) {
      loadProductById(id);
      setShowForm(true);
    }
  }, [id]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/products', {
        params: {
          limit: 40,
          ...(search.trim() && { search: search.trim() }),
        },
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductById = async (productId) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/products/${productId}`);
      setSelectedProduct(response.data);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculate = async (formData) => {
    try {
      const response = await api.post('/products/calculate', formData);
      return response.data;
    } catch (error) {
      console.error('Erro ao calcular preço:', error);
      throw error;
    }
  };

  const handleSave = async (formData, calculation) => {
    try {
      if (selectedProduct) {
        // Atualizar produto existente
        await api.put(`/products/${selectedProduct.id}`, formData);
        alert('Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        await api.post('/products', formData);
        alert('Produto criado com sucesso!');
      }
      loadProducts();
      setShowForm(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto. Tente novamente.');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    try {
      await api.delete(`/products/${productId}`);
      alert('Produto excluído com sucesso!');
      loadProducts();
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct(null);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto. Tente novamente.');
    }
  };

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setShowForm(true);
    navigate('/pricing');
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowForm(true);
    navigate(`/pricing/${product.id}`);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedProduct(null);
    navigate('/pricing');
  };

  const hasAccessToPricing = () => true;

  if (!hasAccessToPricing()) {
    return (
      <Layout title="Precificação Inteligente">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-6">
              <LockClosedIcon className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Recurso Bloqueado
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              A <strong>Precificação Inteligente</strong> está disponível apenas nos planos <strong>Básico</strong> e <strong>Pro</strong>.
            </p>
            <div className="space-y-4 text-left max-w-md mx-auto mb-8">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <p className="text-gray-700 dark:text-gray-300">
                  Calcule custos de produção automaticamente
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <p className="text-gray-700 dark:text-gray-300">
                  Defina preços ideais com base em margem de lucro
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <p className="text-gray-700 dark:text-gray-300">
                  Considere energia, mão de obra e matéria-prima
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/plans')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
            >
              Ver Planos e Fazer Upgrade
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Precificação Inteligente">
      <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Precificação Inteligente</h1>
              {!showForm && (
                <Button onClick={handleNewProduct}>+ Novo Produto</Button>
              )}
              {showForm && (
                <Button variant="secondary" onClick={handleCancel}>
                  ← Voltar para Lista
                </Button>
              )}
            </div>

            {isLoading && <Loading />}

            {!showForm && !isLoading && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Produtos Salvos</h2>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar produto da precificação..."
                  className="w-full mb-4 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400"
                />
                {products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>Nenhum produto cadastrado ainda.</p>
                    <p className="mt-2">Clique em "Novo Produto" para começar.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Nome
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Custo Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Preço Mínimo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Preço Ideal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Margem
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                              {product.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">{product.description}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              R$ {parseFloat(product.totalProductionCost || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              R$ {parseFloat(product.minimumSalePrice || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                              R$ {parseFloat(product.idealSalePrice || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              {parseFloat(product.profitMargin || 0).toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {showForm && !isLoading && (
              <PricingCalculator
                onCalculate={handleCalculate}
                initialData={selectedProduct}
                onSave={handleSave}
              />
            )}
          </div>
    </Layout>
  );
};

export default ProductPricing;
