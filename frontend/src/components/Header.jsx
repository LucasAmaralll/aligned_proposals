import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

const Header = ({ setSidebarOpen, title }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            className="lg:hidden text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
