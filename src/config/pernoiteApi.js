import { useUIFeedback } from "./uiUtilities.jsx";
import { useCallback } from "react";

// ✅ Base correta conforme o backend: http://localhost:8080/pernoite
const BASE_URL = "http://localhost:8080";

// Função utilitária genérica para chamadas API
const apiCall = async (url, options = {}) => {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
};

// --- API de pernoites ---
const pernoiteApi = {
  listar: async (status = null) => {
    // ✅ O endpoint correto no seu backend é /pernoite (GET)
    const url = status ? `/pernoite?status=${status}` : `/pernoite`;
    return apiCall(url);
  },

  cancelar: async (id) => {
    // DELETE /pernoite/{id}
    return apiCall(`/pernoite/${id}`, { method: "DELETE" });
  },

  finalizar: async (id) => {
    // PUT /pernoite/{id}/finalizar — crie se precisar
    return apiCall(`/pernoite/${id}/finalizar`, { method: "PUT" });
  },
};

// --- Hook React para operações com feedback visual ---
export const usePernoiteOperations = () => {
  const uiFeedback = useUIFeedback();

  const carregarPernoites = useCallback(
    async (status = null) => {
      return uiFeedback.executeWithFeedback(
        () => pernoiteApi.listar(status),
        {
          loadingMessage: "Carregando pernoites...",
          errorPrefix: "Erro ao carregar pernoites",
        }
      );
    },
    [uiFeedback]
  );

  const cancelarPernoite = useCallback(
    async (id) => {
      return uiFeedback.executeWithFeedback(() => pernoiteApi.cancelar(id), {
        loadingMessage: "Cancelando pernoite...",
        successMessage: "Pernoite cancelado com sucesso!",
        errorPrefix: "Erro ao cancelar pernoite",
      });
    },
    [uiFeedback]
  );

  const finalizarPernoite = useCallback(
    async (id) => {
      return uiFeedback.executeWithFeedback(() => pernoiteApi.finalizar(id), {
        loadingMessage: "Finalizando pernoite...",
        successMessage: "Pernoite finalizado com sucesso!",
        errorPrefix: "Erro ao finalizar pernoite",
      });
    },
    [uiFeedback]
  );

  return {
    ...uiFeedback,
    carregarPernoites,
    cancelarPernoite,
    finalizarPernoite,
  };
};

export default pernoiteApi;
