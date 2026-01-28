import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebar } from '../context/SidebarContext';

const Layout = ({ title, children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Header title={title} />
        
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
