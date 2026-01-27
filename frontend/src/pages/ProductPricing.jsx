import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
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

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (id) {
      loadProductById(id);
      setShowForm(true);
    }
  }, [id]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/products');
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
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
        </main>
      </div>
    </div>
  );
};

export default ProductPricing;
