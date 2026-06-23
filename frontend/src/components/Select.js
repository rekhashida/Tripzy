import React from 'react';

export default function Select({ 
  label, 
  error, 
  className = '', 
  id,
  options = [],
  ...props 
}) {
  const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <select
        id={inputId}
        className={`form-select ${error ? 'error' : ''}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="alert alert-error" style={{ marginTop: '0.5rem', padding: '0.5rem' }}>{error}</span>}
    </div>
  );
}
