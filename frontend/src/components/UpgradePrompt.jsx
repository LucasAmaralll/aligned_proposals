import React from 'react';
import { Link } from 'react-router-dom';
import { LockClosedIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Card from './Card';
import Button from './Button';

const UpgradePrompt = ({ feature, message }) => {
  const features = {
    dashboard: {
      icon: '📊',
      title: 'Dashboard Bloqueado',
      description: 'Visualize estatísticas e relatórios completos dos seus orçamentos',
      availableIn: ['Básico', 'Pro'],
    },
    pricing: {
      icon: '💰',
      title: 'Precificação Inteligente Bloqueada',
      description: 'Calcule custos e defina preços ideais para seus produtos e serviços',
      availableIn: ['Básico', 'Pro'],
    },
    unlimited: {
      icon: '∞',
      title: 'Orçamentos Ilimitados',
      description: 'Crie quantos orçamentos precisar sem limites mensais',
      availableIn: ['Pro'],
    },
  };

  const featureInfo = features[feature] || features.dashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <div className="text-center">
          {/* Ícone */}
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6">
            <span className="text-5xl">{featureInfo.icon}</span>
          </div>

          {/* Título */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {featureInfo.title}
          </h2>

          {/* Descrição */}
          <p className="text-lg text-gray-600 mb-2">
            {featureInfo.description}
          </p>
          
          {message && (
            <p className="text-md text-gray-500 mb-8">
              {message}
            </p>
          )}

          {/* Badge de planos disponíveis */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-full mb-8">
            <SparklesIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">
              Disponível nos planos: {featureInfo.availableIn.join(' e ')}
            </span>
          </div>

          {/* Benefícios */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Desbloqueie este recurso e mais:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">PDF Sem Marca d'água</p>
                  <p className="text-xs text-gray-500">Orçamentos profissionais</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Logo Personalizado</p>
                  <p className="text-xs text-gray-500">Branding profissional</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Mais Orçamentos</p>
                  <p className="text-xs text-gray-500">Até ilimitados no Pro</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Suporte Premium</p>
                  <p className="text-xs text-gray-500">Atendimento prioritário</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/plans">
              <Button variant="primary" className="w-full sm:w-auto">
                <SparklesIcon className="w-5 h-5 inline mr-2" />
                Ver Planos e Fazer Upgrade
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="secondary" className="w-full sm:w-auto">
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>

          {/* Info adicional */}
          <p className="mt-8 text-sm text-gray-500">
            <LockClosedIcon className="w-4 h-4 inline mr-1" />
            Seus dados estão seguros e você pode fazer upgrade a qualquer momento
          </p>
        </div>
      </Card>
    </div>
  );
};

export default UpgradePrompt;
