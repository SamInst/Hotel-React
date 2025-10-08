import { useUIFeedback } from "./uiUtilities.jsx";
import { useCallback } from "react";

// ✅ Base conforme backend
const BASE_URL = "http://localhost:8080";

// --- Função genérica de chamadas API ---
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
    const url = status ? `/pernoite?status=${status}` : `/pernoite`;
    return apiCall(url);
  },

  buscarPorId: async (id) => {
    // ✅ GET /pernoite/{id}/detalhes
    return apiCall(`/pernoite/${id}/detalhes`);
  },

  cancelar: async (id) => {
    return apiCall(`/pernoite/${id}`, { method: "DELETE" });
  },

  finalizar: async (id) => {
    return apiCall(`/pernoite/${id}/finalizar`, { method: "PUT" });
  },
};

// --- Hook React com feedback visual ---
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

  const carregarPernoitePorId = useCallback(
    async (id) => {
      return uiFeedback.executeWithFeedback(
        () => pernoiteApi.buscarPorId(id),
        {
          loadingMessage: "Carregando detalhes do pernoite...",
          errorPrefix: "Erro ao carregar detalhes do pernoite",
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
    carregarPernoitePorId,
    cancelarPernoite,
    finalizarPernoite,
  };
};

export default pernoiteApi;
