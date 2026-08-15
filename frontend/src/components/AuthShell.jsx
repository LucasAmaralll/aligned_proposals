import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';

const AuthShell = ({ children, subtitle }) => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <button
        type="button"
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
        aria-label={darkMode ? 'Modo claro' : 'Modo escuro'}
      >
        {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </button>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo variant="full" className="h-28 w-auto mx-auto" />
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400 mt-4">{subtitle}</p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
