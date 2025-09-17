// src/components/Modal.jsx
export function Modal({ open, onClose, children, backdropStyle, dialogStyle }) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 10000, ...backdropStyle }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="modal"
        style={{ zIndex: 10001, ...dialogStyle }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
