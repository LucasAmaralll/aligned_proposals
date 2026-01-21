import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowRightIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const LandingPage = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/plans');
      // Garantir que plans seja sempre um array
      setPlans(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: DocumentTextIcon,
      title: 'Orçamentos Profissionais',
      description: 'Crie orçamentos bonitos em PDF com sua logo e identidade visual'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Envio via WhatsApp',
      description: 'Envie orçamentos diretamente para o WhatsApp do cliente com um clique'
    },
    {
      icon: EnvelopeIcon,
      title: 'Email Automático',
      description: 'Dispare emails profissionais com o orçamento em anexo'
    },
    {
      icon: ChartBarIcon,
      title: 'Dashboard Completo',
      description: 'Acompanhe métricas, conversões e performance dos seus orçamentos'
    },
    {
      icon: SparklesIcon,
      title: 'Página Pública',
      description: 'Link único para cada orçamento que o cliente pode acessar de qualquer lugar'
    },
    {
      icon: CheckCircleIcon,
      title: 'Gestão de Clientes',
      description: 'Centralize informações dos seus clientes em um só lugar'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  Aligned Proposals
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <MoonIcon className="h-5 w-5 text-gray-600" />
                )}
              </button>
              
              <Link
                to="/login"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                Entrar
              </Link>
              
              <Link
                to="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Começar Grátis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Crie Orçamentos Profissionais
            <span className="block bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mt-2">
              em Poucos Minutos
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Simplifique sua gestão comercial com a plataforma completa para criar,
            enviar e acompanhar orçamentos de forma profissional.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              Começar Gratuitamente
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            
            <a
              href="#plans"
              className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-blue-600 dark:hover:border-blue-400 font-semibold text-lg transition-all"
            >
              Ver Planos
            </a>
          </div>
          
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            ✨ Sem cartão de crédito • Comece com 3 orçamentos grátis
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Tudo que você precisa para vender mais
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Recursos poderosos para profissionalizar seu processo comercial
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Escolha o Plano Ideal
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Comece grátis e faça upgrade quando precisar
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => {
                const isPro = plan.name === 'Pro';
                const limit = plan.quotesLimit === -1 ? 'Ilimitados' : `${plan.quotesLimit}/mês`;
                
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl p-8 ${
                      isPro
                        ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white ring-4 ring-blue-600 ring-opacity-50 scale-105'
                        : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {isPro && (
                      <div className="absolute top-0 right-6 transform -translate-y-1/2">
                        <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                          POPULAR
                        </span>
                      </div>
                    )}
                    
                    <h4 className={`text-2xl font-bold mb-2 ${isPro ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {plan.name}
                    </h4>
                    
                    <div className="mb-6">
                      <span className={`text-4xl font-bold ${isPro ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        R$ {Number(plan.price).toFixed(2)}
                      </span>
                      <span className={`text-sm ${isPro ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        /mês
                      </span>
                    </div>
                    
                    <div className="mb-6">
                      <p className={`font-semibold mb-4 ${isPro ? 'text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {limit} orçamentos
                      </p>
                      
                      <ul className="space-y-3">
                        {plan.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-start gap-2">
                            <CheckCircleIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isPro ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`} />
                            <span className={`text-sm ${isPro ? 'text-blue-50' : 'text-gray-600 dark:text-gray-300'}`}>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Link
                      to={`/register?plan=${plan.id}`}
                      className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-all ${
                        isPro
                          ? 'bg-white text-blue-600 hover:bg-gray-100'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {plan.price === 0 ? 'Começar Grátis' : 'Assinar Agora'}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para Começar?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a centenas de empresas que já simplificaram seus orçamentos
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            Criar Conta Grátis
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 Aligned Proposals. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
