import React from 'react';

export default function Badge({ status, children, className = '' }) {
  const statusMap = {
    pending: 'badge-pending',
    completed: 'badge-completed',
    in_progress: 'badge-in-progress',
    driver_assigned: 'badge-in-progress',
    otp_verified: 'badge-in-progress',
    cancelled: 'badge-cancelled',
    picked_up: 'badge-in-progress',
    in_transit: 'badge-in-progress',
    delivered: 'badge-completed',
  };

  const badgeClass = statusMap[status] || 'badge-pending';
  
  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {children || status}
    </span>
  );
}
