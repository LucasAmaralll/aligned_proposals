import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentTextIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, generateWhatsAppLink } from '../utils/helpers';

const Quotes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [pdfCache, setPdfCache] = useState({});
  const [statusDropdownId, setStatusDropdownId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const quotesRemaining = () => {
    if (!user?.plan?.quotesLimit || user.plan.quotesLimit === -1) {
      return Infinity;
    }
    const remaining = user.plan.quotesLimit - (user.quotesThisMonth || 0);
    return remaining > 0 ? remaining : 0;
  };

  const handleNewQuote = () => {
    const remaining = quotesRemaining();
    if (remaining === 0) {
      setShowLimitModal(true);
    } else {
      navigate('/quotes/new');
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/quotes');
      // Backend retorna { quotes: [...], pagination: {...} }
      const quotesData = response.data.quotes || response.data;
      setQuotes(Array.isArray(quotesData) ? quotesData : []);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchSearch = 
      quote.title.toLowerCase().includes(search.toLowerCase()) ||
      quote.client?.name.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus =
      statusFilter === 'all' ||
      quote.status === statusFilter ||
      (statusFilter === 'pending_payment' && quote.status === 'approved');
    
    return matchSearch && matchStatus;
  });

  const handleSendWhatsApp = (quote) => {
    if (!quote.client?.phone) {
      alert('Cliente não possui telefone cadastrado');
      return;
    }

    // Usar window.location.origin para garantir que o link é absoluto e correto
    const publicUrl = `${window.location.origin}/view/${quote.publicToken}`;
    const message = `Olá ${quote.client.name}!\n\nSegue o orçamento de atacado "${quote.title}":\n\n${publicUrl}\n\nQualquer dúvida estou à disposição!`;
    
    const whatsappUrl = generateWhatsAppLink(quote.client.phone, message);
    window.open(whatsappUrl, '_blank');
  };

  const handleChangeStatus = async (quoteId, newStatus) => {
    try {
      setUpdatingStatusId(quoteId);
      const response = await api.put(`/quotes/${quoteId}`, { status: newStatus });
      
      // Atualizar lista local com resposta do servidor
      setQuotes(quotes.map(q => 
        q.id === quoteId ? response.data : q
      ));
      
      setStatusDropdownId(null);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status: ' + (error.response?.data?.error || error.message));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleViewPDF = async (quoteId) => {
    try {
      setPdfLoadingId(quoteId);
      
      // Verificar cache
      if (pdfCache[quoteId]) {
        window.open(pdfCache[quoteId], '_blank');
        setPdfLoadingId(null);
        return;
      }
      
      const response = await api.get(`/quotes/${quoteId}/pdf`, {
        responseType: 'blob',
      });
      
      // Criar URL temporária para o blob
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      
      // Armazenar em cache
      setPdfCache(prev => ({ ...prev, [quoteId]: url }));
      
      // Abrir em nova aba
      window.open(url, '_blank');
      
      // Limpar URL após 5 minutos (ao invés de 100ms)
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        setPdfCache(prev => {
          const newCache = { ...prev };
          delete newCache[quoteId];
          return newCache;
        });
      }, 5 * 60 * 1000);
    } catch (error) {
      console.error('Erro ao visualizar PDF:', error);
      alert('Erro ao visualizar PDF');
    } finally {
      setPdfLoadingId(null);
    }
  };

  return (
    <Layout title="Orçamentos">
      <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orçamentos</h1>
                <p className="text-gray-600 dark:text-gray-400">Pedidos de atacado: proposta, aprovação e pagamento pendente.</p>
              </div>
              
              <button
                onClick={handleNewQuote}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Novo Orçamento
              </button>
            </div>

            {/* Filters */}
            <div className="mb-6 grid md:grid-cols-2 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por título ou cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Todos os status</option>
                <option value="pending">Aguardando resposta</option>
                <option value="pending_payment">Pagamento pendente</option>
                <option value="paid">Pagos</option>
                <option value="rejected">Reprovados</option>
                <option value="no_return">Sem retorno</option>
              </select>
            </div>

            {/* Content */}
            {loading ? (
              <Loading />
            ) : filteredQuotes.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum orçamento</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {search || statusFilter !== 'all' 
                    ? 'Nenhum orçamento encontrado com esses filtros' 
                    : 'Comece criando um novo orçamento'}
                </p>
                {!search && statusFilter === 'all' && (
                  <div className="mt-6">
                    <button
                      onClick={handleNewQuote}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Novo Orçamento
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {quote.title}
                          </h3>
                          
                          {/* Status com dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setStatusDropdownId(statusDropdownId === quote.id ? null : quote.id)}
                              disabled={updatingStatusId === quote.id}
                              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${getStatusColor(quote.status)}`}
                            >
                              {getStatusLabel(quote.status)}
                            </button>
                            
                            {statusDropdownId === quote.id && (
                              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-[220px]">
                                <button
                                  onClick={() => handleChangeStatus(quote.id, 'pending')}
                                  disabled={updatingStatusId === quote.id}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                                >
                                  Aguardando resposta
                                </button>
                                <button
                                  onClick={() => handleChangeStatus(quote.id, 'pending_payment')}
                                  disabled={updatingStatusId === quote.id}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                                >
                                  Aprovar · pagamento pendente
                                </button>
                                <button
                                  onClick={() => handleChangeStatus(quote.id, 'paid')}
                                  disabled={updatingStatusId === quote.id}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                                >
                                  Pago
                                </button>
                                <button
                                  onClick={() => handleChangeStatus(quote.id, 'rejected')}
                                  disabled={updatingStatusId === quote.id}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                                >
                                  Reprovar
                                </button>
                                <button
                                  onClick={() => handleChangeStatus(quote.id, 'no_return')}
                                  disabled={updatingStatusId === quote.id}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                                >
                                  Sem retorno
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>Cliente: {quote.client?.name || 'N/A'}</span>
                          <span>•</span>
                          <span>{formatDate(quote.createdAt)}</span>
                          {quote.validUntil && (
                            <>
                              <span>•</span>
                              <span>Válido até: {formatDate(quote.validUntil)}</span>
                            </>
                          )}
                        </div>
                        
                        {quote.description && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {quote.description}
                          </p>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="mt-4 flex gap-2 flex-wrap">
                          {(quote.status === 'pending' || quote.status === 'no_return') && (
                            <>
                              <button
                                onClick={() => handleChangeStatus(quote.id, 'pending_payment')}
                                disabled={updatingStatusId === quote.id}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 disabled:opacity-50"
                              >
                                <CheckIcon className="h-4 w-4" />
                                Aprovar
                              </button>
                              <button
                                onClick={() => handleChangeStatus(quote.id, 'rejected')}
                                disabled={updatingStatusId === quote.id}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50"
                              >
                                <XMarkIcon className="h-4 w-4" />
                                Reprovar
                              </button>
                            </>
                          )}
                          {(quote.status === 'pending_payment' || quote.status === 'approved') && (
                            <button
                              onClick={() => handleChangeStatus(quote.id, 'paid')}
                              disabled={updatingStatusId === quote.id}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 disabled:opacity-50"
                            >
                              <CheckIcon className="h-4 w-4" />
                              Registrar pagamento
                            </button>
                          )}
                          <button
                            onClick={() => handleViewPDF(quote.id)}
                            disabled={pdfLoadingId === quote.id}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <EyeIcon className="h-4 w-4" />
                            {pdfLoadingId === quote.id ? 'Gerando PDF...' : 'Visualizar PDF'}
                          </button>
                          <button
                            onClick={() => navigate(`/quotes/${quote.id}`)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                            Abrir
                          </button>
                          <button
                            onClick={() => navigate(`/quotes/${quote.id}/edit`)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            <PencilIcon className="h-4 w-4" />
                            Editar
                          </button>
                          {quote.client?.phone && (
                            <button
                              onClick={() => handleSendWhatsApp(quote)}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30"
                            >
                              <ChatBubbleLeftRightIcon className="h-4 w-4" />
                              WhatsApp
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(quote.total)}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <EyeIcon className="h-4 w-4" />
                          {quote.viewCount || 0} visualizações
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

      {/* Modal de Limite Atingido */}
      <Modal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        title="Limite de Orçamentos Atingido"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <LockClosedIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-gray-700 dark:text-gray-300">
              Você atingiu o limite de <strong>{user?.plan?.quotesLimit} orçamentos</strong> do seu plano <strong>{user?.plan?.name}</strong> neste mês.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Faça upgrade do seu plano para criar mais orçamentos!
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLimitModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={() => setShowLimitModal(false)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Entendi
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Quotes;
