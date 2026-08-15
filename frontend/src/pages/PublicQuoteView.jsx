import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import { formatCurrency, formatDate, getQuoteItemUnitPrice, getStatusLabel } from '../utils/helpers';
import axios from 'axios';

const PublicQuoteView = () => {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuote();
  }, [token]);

  const fetchQuote = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/quotes/public/${token}`
      );
      setQuote(response.data);
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Orçamento não encontrado</h1>
          <p className="text-gray-600">Verifique se o link está correto</p>
        </div>
      </div>
    );
  }

  // Garantir que items seja um array
  const items = Array.isArray(quote.items) ? quote.items : (typeof quote.items === 'string' ? JSON.parse(quote.items) : []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              {quote.user.logo && (
                <img src={quote.user.logo} alt="Logo" className="h-16 mb-4" />
              )}
              <h1 className="text-3xl font-bold text-gray-800">{quote.user.company?.name || quote.user.companyName || quote.user.name}</h1>
              <p className="text-gray-600 mt-1">{quote.user.email}</p>
              {quote.user.phone && (
                <p className="text-gray-600">{quote.user.phone}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Orçamento Nº</p>
              <p className="text-xl font-bold text-gray-900">{quote.idExt || quote.id.substring(0, 8).toUpperCase()}</p>
              <p className="text-sm text-gray-500 mt-2">{getStatusLabel(quote.status)}</p>
              <a
                href={`${process.env.REACT_APP_API_URL}/quotes/pdf/public/${token}`}
                className="inline-block mt-3 text-sm font-medium text-gray-900 underline"
              >
                Baixar PDF
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600 mb-2">Cliente</p>
              <p className="font-semibold text-gray-800">{quote.client.name}</p>
              {quote.client.email && <p className="text-gray-600 text-sm">{quote.client.email}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-2">Data</p>
              <p className="font-semibold text-gray-800">{formatDate(quote.createdAt)}</p>
              {quote.validUntil && (
                <p className="text-sm text-gray-600">Válido até: {formatDate(quote.validUntil)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quote details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{quote.title}</h2>
          {quote.description && (
            <p className="text-gray-600 mb-6">{quote.description}</p>
          )}

          {/* Items table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Item</th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Qtd</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Valor Unit.</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-2 text-sm text-gray-800">{item.description}</td>
                    <td className="py-4 px-2 text-sm text-gray-800 text-center">{item.quantity}</td>
                    <td className="py-4 px-2 text-sm text-gray-800 text-right">{formatCurrency(getQuoteItemUnitPrice(item))}</td>
                    <td className="py-4 px-2 text-sm font-semibold text-gray-800 text-right">
                      {formatCurrency(getQuoteItemUnitPrice(item) * parseFloat(item.quantity || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2">
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
              <div className="flex justify-between text-xl border-t-2 border-gray-200 pt-3 mt-3">
                <span className="font-bold text-gray-800">TOTAL</span>
                <span className="font-bold text-primary-600">{formatCurrency(quote.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Observações</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Terms */}
        {quote.termsConditions && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Termos e Condições</h3>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{quote.termsConditions}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Gerado por Aligned</p>
          <p className="mt-1">Sistema de Orçamentos Online</p>
        </div>
      </div>
    </div>
  );
};

export default PublicQuoteView;
