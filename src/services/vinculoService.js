// src/services/vinculoService.js

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const vinculoService = {
  buscarPessoaComEmpresas: async (pessoaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/vinculos/pessoa/${pessoaId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Erro ao buscar pessoa com empresas");
      }
      return await response.json();
    } catch (error) {
      console.error("Erro em buscarPessoaComEmpresas:", error);
      throw error;
    }
  },

  buscarEmpresaComPessoas: async (empresaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/vinculos/empresa/${empresaId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Erro ao buscar empresa com pessoas");
      }
      return await response.json();
    } catch (error) {
      console.error("Erro em buscarEmpresaComPessoas:", error);
      throw error;
    }
  },

  listarTodasPessoasComEmpresas: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/vinculos/pessoas`);
      if (!response.ok) throw new Error("Erro ao listar pessoas com empresas");
      return await response.json();
    } catch (error) {
      console.error("Erro em listarTodasPessoasComEmpresas:", error);
      throw error;
    }
  },

  listarTodasEmpresasComPessoas: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/vinculos/empresas`);
      if (!response.ok) throw new Error("Erro ao listar empresas com pessoas");
      return await response.json();
    } catch (error) {
      console.error("Erro em listarTodasEmpresasComPessoas:", error);
      throw error;
    }
  },

  criarVinculo: async (empresaId, pessoaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/vinculos/criar?empresaId=${empresaId}&pessoaId=${pessoaId}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Erro ao criar vínculo");
    } catch (error) {
      console.error("Erro em criarVinculo:", error);
      throw error;
    }
  },

  criarVinculos: async (empresaId, pessoaIds) => {
    try {
      const response = await fetch(`${API_BASE}/api/vinculos/criar-multiplos?empresaId=${empresaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pessoaIds),
      });
      if (!response.ok) throw new Error("Erro ao criar vínculos");
    } catch (error) {
      console.error("Erro em criarVinculos:", error);
      throw error;
    }
  },

  removerVinculo: async (empresaId, pessoaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/vinculos/remover?empresaId=${empresaId}&pessoaId=${pessoaId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao remover vínculo");
    } catch (error) {
      console.error("Erro em removerVinculo:", error);
      throw error;
    }
  },

  removerTodosVinculosEmpresa: async (empresaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/vinculos/empresa/${empresaId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao remover vínculos da empresa");
    } catch (error) {
      console.error("Erro em removerTodosVinculosEmpresa:", error);
      throw error;
    }
  },

  removerTodosVinculosPessoa: async (pessoaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/vinculos/pessoa/${pessoaId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao remover vínculos da pessoa");
    } catch (error) {
      console.error("Erro em removerTodosVinculosPessoa:", error);
      throw error;
    }
  },

  verificarVinculo: async (empresaId, pessoaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/vinculos/verificar?empresaId=${empresaId}&pessoaId=${pessoaId}`);
      if (!response.ok) throw new Error("Erro ao verificar vínculo");
      return await response.json();
    } catch (error) {
      console.error("Erro em verificarVinculo:", error);
      throw error;
    }
  },

  buscarEmpresasDaPessoa: async (pessoaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/vinculos/pessoa/${pessoaId}/empresas`);
      if (!response.ok) throw new Error("Erro ao buscar empresas da pessoa");
      return await response.json();
    } catch (error) {
      console.error("Erro em buscarEmpresasDaPessoa:", error);
      throw error;
    }
  },

  buscarPessoasDaEmpresa: async (empresaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/vinculos/empresa/${empresaId}/pessoas`);
      if (!response.ok) throw new Error("Erro ao buscar pessoas da empresa");
      return await response.json();
    } catch (error) {
      console.error("Erro em buscarPessoasDaEmpresa:", error);
      throw error;
    }
  },
};
