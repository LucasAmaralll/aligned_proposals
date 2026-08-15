import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import api from '../services/api';
import {
  formatCurrency,
  formatDate,
  formatDocument,
  formatPhone,
  generateWhatsAppLink,
  getStatusColor,
  getStatusLabel,
  getQuoteItemUnitPrice,
} from '../utils/helpers';
import {
  ArrowDownTrayIcon,
  EnvelopeIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ email: '', message: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const fetchQuote = async () => {
    try {
      const response = await api.get(`/quotes/${id}`);
      setQuote(response.data);
      setEmailData({ ...emailData, email: response.data.client.email || '' });
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/quotes/${id}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orcamento-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      alert('Erro ao baixar PDF');
    }
  };

  const handleSendWhatsApp = () => {
    if (!quote.client.phone) {
      alert('Cliente não possui telefone cadastrado');
      return;
    }

    const publicUrl = `${window.location.origin}/view/${quote.publicToken}`;
    const message = `Olá ${quote.client.name}!\n\nSegue o orçamento de atacado "${quote.title}":\n\n${publicUrl}\n\nQualquer dúvida estou à disposição!`;
    
    const whatsappUrl = generateWhatsAppLink(quote.client.phone, message);
    window.open(whatsappUrl, '_blank');
  };

  const handleSendEmail = async () => {
    if (!emailData.email) {
      alert('Por favor, informe um email');
      return;
    }

    setSendingEmail(true);
    try {
      await api.post(`/quotes/${id}/send-email`, {
        recipientEmail: emailData.email,
        message: emailData.message,
      });
      alert('Email enviado com sucesso!');
      setEmailModal(false);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      alert('Erro ao enviar email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este orçamento?')) {
      return;
    }

    try {
      await api.delete(`/quotes/${id}`);
      navigate('/quotes');
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      alert('Erro ao excluir orçamento');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setStatusLoading(true);
      const response = await api.put(`/quotes/${id}`, { status: newStatus });
      setQuote(response.data);
      // Feedback visual de sucesso
      setTimeout(() => setStatusLoading(false), 500);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
      setStatusLoading(false);
    }
  };

  const viewPublicUrl = () => {
    const publicUrl = `${window.location.origin}/view/${quote.publicToken}`;
    window.open(publicUrl, '_blank');
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!quote) {
    return <div>Orçamento não encontrado</div>;
  }

  // Items já vem como array do backend
  const items = Array.isArray(quote.items) ? quote.items : [];

  const actionClass =
    'inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800';

  return (
    <Layout title="Detalhes do Orçamento">
          <div className="mb-6 flex flex-wrap gap-2">
            <button type="button" className={`${actionClass} bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-zinc-950 dark:border-white hover:bg-gray-800 dark:hover:bg-zinc-200`} onClick={handleDownloadPDF}>
              <ArrowDownTrayIcon className="h-4 w-4" />
              Baixar PDF
            </button>
            <button type="button" className={actionClass} onClick={handleSendWhatsApp}>
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              WhatsApp
            </button>
            <button type="button" className={actionClass} onClick={() => setEmailModal(true)}>
              <EnvelopeIcon className="h-4 w-4" />
              Email
            </button>
            <button type="button" className={actionClass} onClick={viewPublicUrl}>
              <EyeIcon className="h-4 w-4" />
              Página pública
            </button>
            <button type="button" className={actionClass} onClick={() => navigate(`/quotes/${id}/edit`)}>
              <PencilIcon className="h-4 w-4" />
              Editar
            </button>
            <button type="button" className={`${actionClass} text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40`} onClick={handleDelete}>
              <TrashIcon className="h-4 w-4" />
              Excluir
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="surface p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{quote.title}</h2>
                    {quote.description && (
                      <p className="text-gray-500 dark:text-zinc-400 mt-2">{quote.description}</p>
                    )}
                  </div>
                  <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                    {getStatusLabel(quote.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-zinc-400">Número</p>
                    <p className="font-medium text-gray-900 dark:text-white">{quote.idExt || quote.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-zinc-400">Criado em</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(quote.createdAt)}</p>
                  </div>
                  {quote.validUntil && (
                    <div>
                      <p className="text-gray-500 dark:text-zinc-400">Válido até</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(quote.validUntil)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500 dark:text-zinc-400">Visualizações</p>
                    <p className="font-medium text-gray-900 dark:text-white">{quote.viewCount}</p>
                  </div>
                </div>
              </div>

              <div className="surface p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Peças</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-zinc-800">
                        <th className="text-left py-3 pr-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-400">Peça</th>
                        <th className="text-center py-3 px-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-400">Qtd</th>
                        <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-400">Unitário</th>
                        <th className="text-right py-3 pl-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-400">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-zinc-800">
                          <td className="py-3 pr-4 text-sm text-gray-900 dark:text-zinc-100">{item.description}</td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-zinc-100 text-center">{item.quantity}</td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-zinc-100 text-right">{formatCurrency(getQuoteItemUnitPrice(item))}</td>
                          <td className="py-3 pl-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                            {formatCurrency(getQuoteItemUnitPrice(item) * parseFloat(item.quantity || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 space-y-2 border-t border-gray-200 dark:border-zinc-800 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-zinc-400">Subtotal</span>
                    <span className="text-gray-900 dark:text-zinc-100">{formatCurrency(quote.subtotal)}</span>
                  </div>
                  {parseFloat(quote.discount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-zinc-400">Desconto</span>
                      <span className="text-gray-900 dark:text-zinc-100">-{formatCurrency(quote.discount)}</span>
                    </div>
                  )}
                  {parseFloat(quote.tax) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-zinc-400">Impostos</span>
                      <span className="text-gray-900 dark:text-zinc-100">{formatCurrency(quote.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg border-t border-gray-200 dark:border-zinc-800 pt-3">
                    <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(quote.total)}</span>
                  </div>
                </div>
              </div>

              {quote.notes && (
                <div className="surface p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Observações</h3>
                  <p className="text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}

              {quote.termsConditions && (
                <div className="surface p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Termos</h3>
                  <p className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">{quote.termsConditions}</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="surface p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Decisão do pedido</h3>
                <div className="space-y-3">
                  {(quote.status === 'pending' || quote.status === 'no_return') && (
                    <>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Aprovar reserva o pedido de atacado com pagamento pendente. O estoque não é baixado agora.
                      </p>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-gray-800 dark:hover:bg-zinc-200 disabled:opacity-50"
                        onClick={() => handleStatusChange('pending_payment')}
                        disabled={statusLoading}
                      >
                        {statusLoading ? 'Atualizando...' : 'Aprovar orçamento'}
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                        onClick={() => handleStatusChange('rejected')}
                        disabled={statusLoading}
                      >
                        Reprovar orçamento
                      </button>
                    </>
                  )}

                  {(quote.status === 'pending_payment' || quote.status === 'approved') && (
                    <>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Pedido aprovado. Quando o pagamento estiver integrado, o link sai daqui. Por enquanto dá para registrar o pagamento manualmente, sem mexer no estoque.
                      </p>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-gray-800 dark:hover:bg-zinc-200 disabled:opacity-50"
                        onClick={() => handleStatusChange('paid')}
                        disabled={statusLoading}
                      >
                        {statusLoading ? 'Atualizando...' : 'Registrar pagamento'}
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                        onClick={() => handleStatusChange('rejected')}
                        disabled={statusLoading}
                      >
                        Reprovar
                      </button>
                    </>
                  )}

                  {quote.status === 'paid' && (
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                      Pagamento registrado. A baixa de estoque entra quando o fluxo de pagamento estiver ligado ao pedido.
                    </p>
                  )}

                  {quote.status === 'rejected' && (
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                      onClick={() => handleStatusChange('pending')}
                      disabled={statusLoading}
                    >
                      Reabrir orçamento
                    </button>
                  )}
                </div>
              </div>

              <div className="surface p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cliente</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">Nome</p>
                    <p className="font-medium text-gray-900 dark:text-white">{quote.client.name}</p>
                  </div>
                  {quote.client.document && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">Documento</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDocument(quote.client.document)}</p>
                    </div>
                  )}
                  {quote.client.email && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{quote.client.email}</p>
                    </div>
                  )}
                  {quote.client.phone && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">Telefone</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatPhone(quote.client.phone)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="surface p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Compartilhar</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">Link público</p>
                <p className="text-xs font-mono text-gray-800 dark:text-zinc-200 bg-gray-50 dark:bg-zinc-950 p-3 rounded-lg border border-gray-200 dark:border-zinc-800 break-all">
                  {window.location.origin}/view/{quote.publicToken}
                </p>
              </div>
            </div>
          </div>

      {/* Email Modal */}
      <Modal
        isOpen={emailModal}
        onClose={() => setEmailModal(false)}
        title="Enviar Orçamento por Email"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
              Email do destinatário
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white outline-none"
              value={emailData.email}
              onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
              placeholder="cliente@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
              Mensagem personalizada (opcional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white outline-none"
              rows="4"
              value={emailData.message}
              onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
              placeholder="Adicione uma mensagem personalizada..."
            />
          </div>

          <div className="flex space-x-3">
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSendEmail}
              disabled={sendingEmail}
            >
              {sendingEmail ? 'Enviando...' : 'Enviar Email'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setEmailModal(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default QuoteDetail;
