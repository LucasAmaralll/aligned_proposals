import React from 'react';

const Input = ({ 
  label, 
  error, 
  icon: Icon,
  className = '', 
  ...props 
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          className={`
            w-full px-3 py-2 border rounded-lg outline-none transition-colors
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            ${Icon ? 'pl-10' : ''}
            ${error 
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent' 
              : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
            }
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
