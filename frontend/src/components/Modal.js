import React from 'react';
import { IoClose } from 'react-icons/io5';

export default function Modal({ isOpen, onClose, title, children, className = '' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${className}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {title && <h3 className="modal-title">{title}</h3>}
          <button className="modal-close" onClick={onClose}>
            <IoClose />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
