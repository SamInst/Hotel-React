// src/config/financeApi.js

import { useUIFeedback } from "./uiUtilities.jsx";
import { useCallback } from "react";

const BASE_URL = "http://localhost:8080";

const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

const financeApi = {
  relatorios: {
    buscar: async (params = {}) => {
      const searchParams = new URLSearchParams();

      if (params.dataInicio)
        searchParams.append("dataInicio", params.dataInicio);
      if (params.dataFim) searchParams.append("dataFim", params.dataFim);
      if (params.tipoPagamentoId)
        searchParams.append("tipoPagamentoId", params.tipoPagamentoId);
      if (params.quartoId) searchParams.append("quartoId", params.quartoId);
      if (params.pernoiteId)
        searchParams.append("pernoiteId", params.pernoiteId);
      if (params.funcionarioId)
        searchParams.append("funcionarioId", params.funcionarioId);

      const url = `/api/relatorios${
        searchParams.toString() ? `?${searchParams}` : ""
      }`;
      return apiCall(url);
    },

    buscarPorId: async (id) => {
      return apiCall(`/api/relatorios/${id}`);
    },

    criar: async (dados) => {
      return apiCall("/api/relatorios", {
        method: "POST",
        body: JSON.stringify(dados),
      });
    },

    atualizar: async (id, dados) => {
      return apiCall(`/api/relatorios/${id}`, {
        method: "PUT",
        body: JSON.stringify(dados),
      });
    },

    excluir: async (id) => {
      return apiCall(`/api/relatorios/${id}`, {
        method: "DELETE",
      });
    },
  },

  referencias: {
    tiposPagamento: async () => {
      return apiCall("/tipos-pagamentos");
    },

    funcionarios: async () => {
      // Mock temporário até criar o endpoint
      return [{ id: 1, nomeCompleto: "Funcionário Padrão" }];
    },

    quartos: async () => {
      return apiCall("/api/quartos/enum");
    },
  },
};

export const converterParaApi = (dadosFront) => {
  return {
    dataHora: new Date().toISOString(),
    fkTipoPagamento: dadosFront.tipo_pagamento_enum || null,
    relatorio: dadosFront.relatorio || "",
    pernoiteId: dadosFront.pernoite_id || null,
    entradaId: dadosFront.entrada_id || null,
    valor: dadosFront.valor || 0,
    quartoId: dadosFront.quarto_id || null,
    fkFuncionario: dadosFront.fk_funcionario || 1,
  };
};

export const converterDaApi = (dadosApi) => {
  return {
    id: dadosApi.id,
    date:
      dadosApi.dataHora?.split("T")[0] || new Date().toISOString().slice(0, 10),
    time:
      dadosApi.dataHora?.split("T")[1]?.slice(0, 5) ||
      new Date().toTimeString().slice(0, 5),
    title: dadosApi.relatorio || "",
    payment: dadosApi.tipoPagamento?.descricao || "",
    amount: dadosApi.valor || 0,
    apt: dadosApi.quartoId || null,
    funcionario: dadosApi.funcionario?.nomeCompleto || "Sistema",
  };
};

export const useFinanceOperations = () => {
  const uiFeedback = useUIFeedback();

  // ✅ Usar useCallback para estabilizar as funções
  const carregarRelatorios = useCallback(async (filtros = {}) => {
    return uiFeedback.executeWithFeedback(
      () => financeApi.relatorios.buscar(filtros),
      {
        loadingMessage: "Carregando relatórios...",
        errorPrefix: "Erro ao carregar relatórios",
      }
    );
  }, [uiFeedback]);

  const criarRelatorio = useCallback(async (dados) => {
    return uiFeedback.executeWithFeedback(
      () => financeApi.relatorios.criar(dados),
      {
        loadingMessage: "Salvando lançamento...",
        successMessage: "Lançamento criado com sucesso!",
        errorPrefix: "Erro ao criar lançamento",
      }
    );
  }, [uiFeedback]);

  const atualizarRelatorio = useCallback(async (id, dados) => {
    return uiFeedback.executeWithFeedback(
      () => financeApi.relatorios.atualizar(id, dados),
      {
        loadingMessage: "Atualizando lançamento...",
        successMessage: "Lançamento atualizado com sucesso!",
        errorPrefix: "Erro ao atualizar lançamento",
      }
    );
  }, [uiFeedback]);

  const excluirRelatorio = useCallback(async (id) => {
    return uiFeedback.executeWithFeedback(
      () => financeApi.relatorios.excluir(id),
      {
        loadingMessage: "Excluindo lançamento...",
        successMessage: "Lançamento excluído com sucesso!",
        errorPrefix: "Erro ao excluir lançamento",
      }
    );
  }, [uiFeedback]);

  const carregarReferencias = useCallback(async () => {
    return uiFeedback.executeWithFeedback(
      async () => {
        const [tiposResp, quartosResp, funcionariosResp] = await Promise.all([
          financeApi.referencias.tiposPagamento(),
          financeApi.referencias.quartos(),
          financeApi.referencias.funcionarios(),
        ]);
        return { tiposResp, quartosResp, funcionariosResp };
      },
      {
        loadingMessage: "Carregando dados auxiliares...",
        errorPrefix: "Erro ao carregar dados de referência",
      }
    );
  }, [uiFeedback]);

  return {
    ...uiFeedback,
    carregarRelatorios,
    criarRelatorio,
    atualizarRelatorio,
    excluirRelatorio,
    carregarReferencias,
  };
};

export default financeApi;