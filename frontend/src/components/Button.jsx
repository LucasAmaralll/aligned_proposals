import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon: Icon,
  iconPosition = 'left',
  ...props 
}) => {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center space-x-2
        ${className}
      `}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
    </button>
  );
};

export default Button;
