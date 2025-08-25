// src/components/Modal.jsx
import React from 'react';

export function Modal({ open, onClose, children, backdropStyle, dialogStyle }) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 10000, ...backdropStyle }}   // garante que fica acima de tudo
      role="dialog"
      aria-modal="true"
    >
      <div className="modal" style={{ zIndex: 10001, ...dialogStyle }}>
        <button className="modal__close" onClick={onClose} aria-label="Fechar">&times;</button>
        <div className="modal__content">{children}</div>
      </div>
    </div>
  );
}

