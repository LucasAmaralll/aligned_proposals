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
  TruckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  UsersIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { signOut, user } = useAuth();
  const { company, can, isSeller } = useCompany();
  const companyName = getCompanyName(company) || getCompanyName(user);
  const { darkMode, toggleDarkMode } = useTheme();
  const { isCollapsed, toggleCollapse, isOpen, setIsOpen } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const groups = [
    {
      label: 'Operação',
      items: [
        { name: isSeller ? 'Meu desempenho' : 'Dashboard', icon: HomeIcon, path: '/dashboard' },
        { name: 'Vendas', icon: ShoppingBagIcon, path: '/sales' },
        { name: 'Caixa', icon: WalletIcon, path: '/cash', permission: 'cash.read' },
        { name: 'Envios', icon: TruckIcon, path: '/shipments' },
        { name: 'Clientes', icon: UserGroupIcon, path: '/clients' },
        { name: 'Orçamentos', icon: DocumentTextIcon, path: '/quotes' },
      ],
    },
    {
      label: 'Gestão',
      items: [
        { name: 'Produtos', icon: CubeIcon, path: '/products', permission: 'products.manage' },
        { name: 'Estoque', icon: ArchiveBoxIcon, path: '/stock', permission: 'stock.manage' },
        { name: 'Gastos', icon: BanknotesIcon, path: '/expenses', permission: 'expenses.manage' },
        { name: 'Precificação', icon: CalculatorIcon, path: '/pricing', permission: 'products.manage' },
        { name: 'Equipe', icon: UsersIcon, path: '/team', permission: 'users.manage' },
      ],
    },
    {
      label: 'Conta',
      items: [{ name: 'Perfil', icon: UserCircleIcon, path: '/profile' }],
    },
  ].map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || can(item.permission)),
  })).filter((group) => group.items.length);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700"
      >
        <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white dark:bg-zinc-950 border-r border-gray-200/80 dark:border-zinc-800 transform transition-all duration-300 ease-in-out overflow-hidden
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-5 py-5 border-b border-gray-100 dark:border-zinc-800`}>
            <Link to="/dashboard" className="flex items-center min-w-0">
              {!isCollapsed ? (
                <div className="flex flex-col items-start min-w-0">
                  <Logo variant="full" className="h-14 w-auto" />
                  {companyName && (
                    <span className="mt-1 text-[11px] uppercase tracking-[0.16em] text-gray-400 dark:text-zinc-500 truncate max-w-[160px]">
                      {companyName}
                    </span>
                  )}
                </div>
              ) : (
                <Logo variant="mark" className="h-8 w-auto" />
              )}
            </Link>
            <button
              className="lg:hidden text-gray-500 dark:text-zinc-400"
              onClick={() => setIsOpen(false)}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={toggleCollapse}
            className="hidden lg:flex absolute -right-3 top-20 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-full p-1 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors z-10"
            title={isCollapsed ? 'Expandir' : 'Recolher'}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
            )}
          </button>

          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
            {groups.map((group) => (
              <div key={group.label}>
                {!isCollapsed && (
                  <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-zinc-500">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-xl transition-colors group relative ${
                          active
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-zinc-950'
                            : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900'
                        }`}
                        title={isCollapsed ? item.name : ''}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                        {isCollapsed && (
                          <span className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {item.name}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={toggleDarkMode}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 w-full group relative`}
              title={isCollapsed ? (darkMode ? 'Modo claro' : 'Modo escuro') : ''}
            >
              {darkMode ? <SunIcon className="w-5 h-5 flex-shrink-0" /> : <MoonIcon className="w-5 h-5 flex-shrink-0" />}
              {!isCollapsed && <span className="text-sm font-medium">{darkMode ? 'Modo claro' : 'Modo escuro'}</span>}
            </button>
          </nav>

          <div className="p-3 border-t border-gray-100 dark:border-zinc-800">
            <button
              onClick={handleLogout}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors w-full`}
              title={isCollapsed ? 'Sair' : ''}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
