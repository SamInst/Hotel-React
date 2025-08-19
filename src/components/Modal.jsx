import React, { useEffect, useRef } from 'react'

export function Modal({ open, onClose, children }) {
  if (!open) return null;
  
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="modal__close" onClick={onClose}>&times;</button>
        <div className="modal__content">
          {children}
        </div>
      </div>
    </div>
  );
}
