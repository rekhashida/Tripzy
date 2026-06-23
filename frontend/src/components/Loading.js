import React from 'react';

export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="text-center" style={{ padding: '2rem' }}>
      <div className="spinner"></div>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
}
