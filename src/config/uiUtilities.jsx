// src/config/uiUtilities.js

import { useState, useCallback } from "react";

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  
  const push = useCallback((type, message, { timeout = 4500 } = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts, { id, type, message }]);
    if (timeout) {
      setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), timeout);
    }
  }, []);
  
  const remove = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);
  
  const clear = useCallback(() => {
    setToasts([]);
  }, []);
  
  return { toasts, push, remove, clear };
}

export function Toasts({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null;
  
  return (
    <div className="toasts-container" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`} role="alert">
          <div className="toast-content">
            <span className="toast-icon">
              {t.type === "error" ? "⚠️" : t.type === "success" ? "✅" : "ℹ️"}
            </span>
            <span className="toast-message">{t.message}</span>
          </div>
          <button 
            className="toast-close" 
            onClick={() => onClose(t.id)} 
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function useLoading() {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  
  const startLoading = useCallback((message = "Carregando...") => {
    setLoadingMessage(message);
    setLoading(true);
  }, []);
  
  const stopLoading = useCallback(() => {
    setLoading(false);
    setLoadingMessage("");
  }, []);
  
  const withLoading = useCallback(async (asyncOperation, message) => {
    try {
      startLoading(message);
      const result = await asyncOperation();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);
  
  return { 
    loading, 
    loadingMessage, 
    startLoading, 
    stopLoading, 
    withLoading 
  };
}

export function LoadingOverlay({ show, label = "Carregando..." }) {
  if (!show) return null;
  
  return (
    <div className="loading-overlay" aria-busy="true" aria-live="polite">
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
      <div className="loading-text">{label}</div>
    </div>
  );
}

export function useUIFeedback() {
  const { toasts, push: notify, remove: closeToast, clear: clearToasts } = useToasts();
  const { loading, loadingMessage, startLoading, stopLoading, withLoading } = useLoading();
  
  const notifyError = useCallback((message) => {
    notify("error", message);
  }, [notify]);
  
  const notifySuccess = useCallback((message) => {
    notify("success", message);
  }, [notify]);
  
  const notifyInfo = useCallback((message) => {
    notify("info", message);
  }, [notify]);
  
  const executeWithFeedback = useCallback(async (
    operation, 
    { 
      loadingMessage = "Processando...", 
      successMessage = null, 
      errorPrefix = "Erro" 
    } = {}
  ) => {
    try {
      const result = await withLoading(operation, loadingMessage);
      if (successMessage) {
        notifySuccess(successMessage);
      }
      return result;
    } catch (error) {
      const errorMessage = error?.message || "Operação falhou";
      notifyError(`${errorPrefix}: ${errorMessage}`);
      throw error;
    }
  }, [withLoading, notifySuccess, notifyError]);
  
  return {
    toasts,
    notify,
    notifyError,
    notifySuccess,
    notifyInfo,
    closeToast,
    clearToasts,
    loading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading,
    executeWithFeedback
  };
}