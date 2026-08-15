import React, { useEffect, useState } from 'react';
import Button from './Button';
import Input from './Input';
import api from '../services/api';

const IntegrationSettings = () => {
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState('Site / e-commerce');
  const [createdKey, setCreatedKey] = useState('');
  const [loading, setLoading] = useState(false);

  const loadKeys = async () => {
    const response = await api.get('/companies/me/api-keys');
    setKeys(response.data.keys || []);
  };

  useEffect(() => {
    loadKeys().catch(() => setKeys([]));
  }, []);

  const handleCreate = async () => {
    try {
      setLoading(true);
      const response = await api.post('/companies/me/api-keys', { name });
      setCreatedKey(response.data.key);
      setName('Site / e-commerce');
      await loadKeys();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao criar chave');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Desativar esta chave? O site deixa de conseguir vender por ela.')) return;
    try {
      await api.delete(`/companies/me/api-keys/${id}`);
      await loadKeys();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao desativar chave');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Integração</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          O site ou outro canal usa esta chave para listar o catálogo e criar venda de varejo (PF) ou atacado (PJ). O orçamento continua só como proposta.
        </p>
      </div>

      {createdKey && (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
            Copie agora. A chave só aparece esta vez.
          </p>
          <p className="text-sm font-mono break-all text-gray-900 dark:text-white">{createdKey}</p>
        </div>
      )}

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input label="Nome da chave" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button type="button" onClick={handleCreate} disabled={loading}>
          {loading ? 'Criando...' : 'Gerar chave'}
        </Button>
      </div>

      <div className="text-sm text-gray-500 dark:text-zinc-400 space-y-1">
        <p>Vitrine: <code className="text-gray-800 dark:text-zinc-200">GET /api/storefront/catalog</code></p>
        <p>Pedido: <code className="text-gray-800 dark:text-zinc-200">POST /api/storefront/orders</code> com header <code>X-Api-Key</code></p>
        <p>No pedido, <code>channel</code> é <code>retail</code> ou <code>wholesale</code>. Atacado exige cliente com CNPJ.</p>
        <p>Pedido do site entra na fila de Envios, salvo se <code>fulfillment</code> for <code>pickup</code>. Endereço vai em <code>shipping</code>.</p>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-xl">
        {keys.length === 0 ? (
          <p className="p-4 text-sm text-gray-500 dark:text-zinc-400">Nenhuma chave ainda.</p>
        ) : (
          keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{key.name}</p>
                <p className="text-xs font-mono text-gray-500 dark:text-zinc-400">
                  {key.prefix}…{key.lastFour} · {key.active ? 'ativa' : 'desativada'}
                </p>
              </div>
              {key.active && (
                <button
                  type="button"
                  onClick={() => handleRevoke(key.id)}
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  Desativar
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IntegrationSettings;
