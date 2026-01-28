import React from 'react';

const Header = ({ title }) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
      </div>
    </header>
  );
};

export default Header;
