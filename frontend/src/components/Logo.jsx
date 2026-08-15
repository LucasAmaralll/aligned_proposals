import React from 'react';

const SRC = {
  full: '/brand/logo-full.png',
  mark: '/brand/logo-mark.png',
};

const Logo = ({ variant = 'full', className = '', alt = 'Aligned' }) => (
  <img
    src={SRC[variant] || SRC.full}
    alt={alt}
    className={`select-none dark:invert ${className}`}
  />
);

export default Logo;
