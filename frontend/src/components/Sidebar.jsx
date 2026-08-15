import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { useCompany } from '../context/CompanyContext';
import { getCompanyName } from '../utils/helpers';
import Logo from './Logo';
import {
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  CalculatorIcon,
  CubeIcon,
  ArchiveBoxIcon,
  ShoppingBagIcon,
  BanknotesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { signOut, user } = useAuth();
  const { company } = useCompany();
  const companyName = getCompanyName(company) || getCompanyName(user);
  const { darkMode, toggleDarkMode } = useTheme();
  const { isCollapsed, toggleCollapse, isOpen, setIsOpen } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/dashboard' },
    { name: 'Vendas', icon: ShoppingBagIcon, path: '/sales' },
    { name: 'Clientes', icon: UserGroupIcon, path: '/clients' },
    { name: 'Orçamentos', icon: DocumentTextIcon, path: '/quotes' },
    { name: 'Produtos', icon: CubeIcon, path: '/products' },
    { name: 'Estoque', icon: ArchiveBoxIcon, path: '/stock' },
    { name: 'Gastos', icon: BanknotesIcon, path: '/expenses' },
    { name: 'Precificação', icon: CalculatorIcon, path: '/pricing' },
    { name: 'Perfil', icon: UserCircleIcon, path: '/profile' },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {/* Botão mobile para abrir sidebar */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out overflow-hidden
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} 
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
          {/* Logo */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-6 border-b border-gray-200 dark:border-gray-700`}>
            <Link to="/dashboard" className="flex items-center min-w-0">
              {!isCollapsed ? (
                <div className="flex flex-col items-start min-w-0">
                  <Logo variant="full" className="h-16 w-auto" />
                  {companyName && (
                    <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                      {companyName}
                    </span>
                  )}
                </div>
              ) : (
                <Logo variant="mark" className="h-8 w-auto" />
              )}
            </Link>
            <button
              className="lg:hidden text-gray-600 dark:text-gray-400"
              onClick={() => setIsOpen(false)}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Botão de colapsar (apenas desktop) */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
            title={isCollapsed ? 'Expandir' : 'Recolher'}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-colors group relative ${
                    isActive(item.path)
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title={isCollapsed ? item.name : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.name}</span>}
                  
                  {/* Tooltip quando colapsado */}
                  {isCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 w-full mt-4 group relative`}
              title={isCollapsed ? (darkMode ? 'Modo Claro' : 'Modo Escuro') : ''}
            >
              {darkMode ? (
                <>
                  <SunIcon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">Modo Claro</span>}
                </>
              ) : (
                <>
                  <MoonIcon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">Modo Escuro</span>}
                </>
              )}
              
              {/* Tooltip quando colapsado */}
              {isCollapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {darkMode ? 'Modo Claro' : 'Modo Escuro'}
                </span>
              )}
            </button>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full group relative`}
              title={isCollapsed ? 'Sair' : ''}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">Sair</span>}
              
              {/* Tooltip quando colapsado */}
              {isCollapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Sair
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
