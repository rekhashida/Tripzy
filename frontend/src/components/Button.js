import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  onClick,
  type = 'button',
  size = 'medium',
  ...props 
}) {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'large' ? 'btn-large' : size === 'small' ? 'btn-small' : '';
  
  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
