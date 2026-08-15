import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import PricingCalculator from '../components/PricingCalculator';
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
        alert('Ficha atualizada.');
      } else {
        await api.post('/products', formData);
        alert('Ficha salva.');
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
    if (!window.confirm('Excluir esta ficha de custo?')) {
      return;
    }

    try {
      await api.delete(`/products/${productId}`);
      alert('Ficha excluída.');
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

  const money = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const retailPrice = (product) => {
    const expenses = Array.isArray(product.expenses) ? product.expenses : [];
    const retail = expenses.find((item) => item.type === 'retail' || item.kind === 'retail');
    const factory = parseFloat(product.idealSalePrice || 0);
    const percent = parseFloat(retail?.percent || 0);
    return factory * (1 + percent / 100);
  };

  return (
    <Layout title="Precificação de confecção">
      <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-start mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Precificação de confecção</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Ficha de custo da peça: tecido, aviamentos, costura, fábrica e preço da loja.
                </p>
              </div>
              {!showForm && (
                <Button onClick={handleNewProduct}>+ Nova ficha</Button>
              )}
              {showForm && (
                <Button variant="secondary" onClick={handleCancel}>
                  ← Voltar para lista
                </Button>
              )}
            </div>

            {isLoading && <Loading />}

            {!showForm && !isLoading && (
              <div className="surface p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Fichas salvas</h2>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar peça..."
                  className="w-full mb-4 px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-400"
                />
                {products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>Nenhuma ficha de custo ainda.</p>
                    <p className="mt-2">Clique em “Nova ficha” para precificar uma peça.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Peça
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Custo da peça
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Preço fábrica
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Preço loja
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Margem fábrica
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                              {product.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">{product.description}</div>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              {money(product.totalProductionCost)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              {money(product.idealSalePrice)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                              {money(retailPrice(product))}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              {parseFloat(product.profitMargin || 0).toFixed(0)}%
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-gray-900 dark:text-white hover:underline mr-4"
                              >
                                Abrir
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="text-red-600 dark:text-red-400 hover:underline"
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
