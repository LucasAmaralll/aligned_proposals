import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckIcon,
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

const LandingPage = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  const features = [
    {
      icon: DocumentTextIcon,
      title: 'Orçamentos em Segundos',
      description: 'Pare de perder tempo com planilhas. Preencha campos simples e gere PDFs profissionais automaticamente'
    },
    {
      icon: SparklesIcon,
      title: 'Precificação Inteligente',
      description: 'Não sabe como precificar? Nossa calculadora analisa custos, margem de lucro e sugere preços ideais'
    },
    {
      icon: ChartBarIcon,
      title: 'Controle Total',
      description: 'Visualize todos os orçamentos em um só lugar. Acompanhe aprovados, pendentes e rejeitados em tempo real'
    },
    {
      icon: CheckIcon,
      title: 'Gestão de Clientes',
      description: 'Organize seus clientes e histórico de orçamentos sem esforço. Nunca mais perca informações importantes'
    },
    {
      icon: EnvelopeIcon,
      title: 'Compartilhamento Instantâneo',
      description: 'Link público para cada orçamento. Seu cliente acessa de qualquer dispositivo, a qualquer hora'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Sua Marca, Sua Identidade',
      description: 'PDFs com sua logo e cores. Orçamentos profissionais que impressionam e transmitem credibilidade'
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
                  Aligned
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
            Pare de Fazer Orçamentos à Mão
            <span className="block bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mt-2">
              Automatize em Segundos
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Chega de planilhas confusas e cálculos manuais. Preencha campos simples,
            defina preços com nossa calculadora inteligente e gere PDFs profissionais automaticamente.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              Começar Gratuitamente
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            
            <Link
              to="/login"
              className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-blue-600 dark:hover:border-blue-400 font-semibold text-lg transition-all"
            >
              Entrar
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            ✨ Sem cartão de crédito • 3 orçamentos grátis • Precificação inteligente incluída
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Comodidade e Controle Total
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Automatize seu processo comercial e pare de perder tempo com tarefas manuais
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
          <p>&copy; 2026 Aligned. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
