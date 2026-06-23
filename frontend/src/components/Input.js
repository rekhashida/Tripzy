import React from 'react';

export default function Input({ 
  label, 
  error, 
  className = '', 
  id,
  ...props 
}) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <input
        id={inputId}
        className={`form-input ${error ? 'error' : ''}`}
        {...props}
      />
      {error && <span className="alert alert-error" style={{ marginTop: '0.5rem', padding: '0.5rem' }}>{error}</span>}
    </div>
  );
}
