import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import api from '../services/api';
import { formatCurrency, formatDate, generateWhatsAppLink, getStatusColor, getStatusLabel } from '../utils/helpers';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
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

    const publicUrl = `${process.env.REACT_APP_PUBLIC_URL}/view/${quote.publicToken}`;
    const message = `Olá ${quote.client.name}!\n\nSegue o orçamento "${quote.title}" que você solicitou:\n\n${publicUrl}\n\nQualquer dúvida estou à disposição!`;
    
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
      const response = await api.put(`/quotes/${id}`, { status: newStatus });
      setQuote(response.data);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const viewPublicUrl = () => {
    const publicUrl = `${process.env.REACT_APP_PUBLIC_URL}/view/${quote.publicToken}`;
    window.open(publicUrl, '_blank');
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!quote) {
    return <div>Orçamento não encontrado</div>;
  }

  const items = JSON.parse(quote.items);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="lg:ml-64">
        <Header setSidebarOpen={setSidebarOpen} title="Detalhes do Orçamento" />
        
        <main className="p-6">
          {/* Actions bar */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Button
              variant="primary"
              icon={ArrowDownTrayIcon}
              onClick={handleDownloadPDF}
            >
              Baixar PDF
            </Button>
            
            <Button
              variant="success"
              icon={ChatBubbleLeftRightIcon}
              onClick={handleSendWhatsApp}
            >
              Enviar via WhatsApp
            </Button>
            
            <Button
              variant="secondary"
              icon={EnvelopeIcon}
              onClick={() => setEmailModal(true)}
            >
              Enviar por Email
            </Button>
            
            <Button
              variant="secondary"
              icon={EyeIcon}
              onClick={viewPublicUrl}
            >
              Ver Página Pública
            </Button>
            
            <Button
              variant="outline"
              icon={PencilIcon}
              onClick={() => navigate(`/quotes/${id}/edit`)}
            >
              Editar
            </Button>
            
            <Button
              variant="danger"
              icon={TrashIcon}
              onClick={handleDelete}
            >
              Excluir
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quote info */}
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{quote.title}</h2>
                    {quote.description && (
                      <p className="text-gray-600 mt-2">{quote.description}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quote.status)}`}>
                    {getStatusLabel(quote.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Número</p>
                    <p className="font-semibold text-gray-800">{quote.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Data de Criação</p>
                    <p className="font-semibold text-gray-800">{formatDate(quote.createdAt)}</p>
                  </div>
                  {quote.validUntil && (
                    <div>
                      <p className="text-gray-600">Válido até</p>
                      <p className="font-semibold text-gray-800">{formatDate(quote.validUntil)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Visualizações</p>
                    <p className="font-semibold text-gray-800">{quote.viewCount}</p>
                  </div>
                </div>
              </Card>

              {/* Items */}
              <Card title="Itens">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Descrição</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Qtd</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Valor Unit.</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-sm text-gray-800">{item.description}</td>
                          <td className="py-3 px-4 text-sm text-gray-800 text-center">{item.quantity}</td>
                          <td className="py-3 px-4 text-sm text-gray-800 text-right">{formatCurrency(item.price)}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-800 text-right">
                            {formatCurrency(parseFloat(item.price) * parseInt(item.quantity))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 space-y-2 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(quote.subtotal)}</span>
                  </div>
                  {parseFloat(quote.discount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Desconto</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(quote.discount)}</span>
                    </div>
                  )}
                  {parseFloat(quote.tax) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxas/Impostos</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(quote.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg border-t border-gray-200 pt-2">
                    <span className="font-bold text-gray-800">TOTAL</span>
                    <span className="font-bold text-primary-600">{formatCurrency(quote.total)}</span>
                  </div>
                </div>
              </Card>

              {/* Notes */}
              {quote.notes && (
                <Card title="Observações">
                  <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
                </Card>
              )}

              {/* Terms */}
              {quote.termsConditions && (
                <Card title="Termos e Condições">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{quote.termsConditions}</p>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Client info */}
              <Card title="Cliente">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="font-semibold text-gray-800">{quote.client.name}</p>
                  </div>
                  {quote.client.email && (
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-800">{quote.client.email}</p>
                    </div>
                  )}
                  {quote.client.phone && (
                    <div>
                      <p className="text-sm text-gray-600">Telefone</p>
                      <p className="font-semibold text-gray-800">{quote.client.phone}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Status actions */}
              <Card title="Alterar Status">
                <div className="space-y-2">
                  <Button
                    variant={quote.status === 'pending' ? 'primary' : 'secondary'}
                    className="w-full"
                    onClick={() => handleStatusChange('pending')}
                  >
                    Pendente
                  </Button>
                  <Button
                    variant={quote.status === 'approved' ? 'success' : 'secondary'}
                    className="w-full"
                    onClick={() => handleStatusChange('approved')}
                  >
                    Aprovado
                  </Button>
                  <Button
                    variant={quote.status === 'rejected' ? 'danger' : 'secondary'}
                    className="w-full"
                    onClick={() => handleStatusChange('rejected')}
                  >
                    Rejeitado
                  </Button>
                </div>
              </Card>

              {/* Share info */}
              <Card title="Compartilhar">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-2">Link público:</p>
                  <p className="text-xs font-mono bg-white p-2 rounded border border-gray-200 break-all">
                    {process.env.REACT_APP_PUBLIC_URL}/view/{quote.publicToken}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Email Modal */}
      <Modal
        isOpen={emailModal}
        onClose={() => setEmailModal(false)}
        title="Enviar Orçamento por Email"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email do destinatário
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              value={emailData.email}
              onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
              placeholder="cliente@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem personalizada (opcional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
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
    </div>
  );
};

export default QuoteDetail;
