// src/services/empresaService.js

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const empresaService = {
  listarTodas: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/empresas`);
      if (!response.ok) throw new Error("Erro ao buscar empresas");
      return await response.json();
    } catch (error) {
      console.error("Erro em listarTodas:", error);
      throw error;
    }
  },

  buscarPorId: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/empresas/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Erro ao buscar empresa");
      }
      return await response.json();
    } catch (error) {
      console.error("Erro em buscarPorId:", error);
      throw error;
    }
  },

  buscarPorNome: async (nome) => {
    try {
      const response = await fetch(`${API_BASE}/api/empresas/buscar/nome?nome=${encodeURIComponent(nome)}`);
      if (!response.ok) throw new Error("Erro ao buscar por nome");
      return await response.json();
    } catch (error) {
      console.error("Erro em buscarPorNome:", error);
      throw error;
    }
  },

  buscarPorCnpj: async (cnpj) => {
    try {
      const response = await fetch(`${API_BASE}/api/empresas/buscar/cnpj/${cnpj}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Erro ao buscar por CNPJ");
      }
      return await response.json();
    } catch (error) {
      console.error("Erro em buscarPorCnpj:", error);
      throw error;
    }
  },

  buscarPorNomeOuCnpj: async (termo) => {
    try {
      const response = await fetch(`${API_BASE}/api/empresas/buscar?termo=${encodeURIComponent(termo)}`);
      if (!response.ok) throw new Error("Erro ao buscar");
      return await response.json();
    } catch (error) {
      console.error("Erro em buscarPorNomeOuCnpj:", error);
      throw error;
    }
  },

  cadastrar: async (empresa) => {
    try {
      const response = await fetch(`${API_BASE}/api/empresas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empresa),
      });
      if (!response.ok) throw new Error("Erro ao cadastrar empresa");
      return await response.json();
    } catch (error) {
      console.error("Erro em cadastrar:", error);
      throw error;
    }
  },

  atualizar: async (id, empresa) => {
    try {
      const response = await fetch(`${API_BASE}/api/empresas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empresa),
      });
      if (!response.ok) throw new Error("Erro ao atualizar empresa");
      return await response.json();
    } catch (error) {
      console.error("Erro em atualizar:", error);
      throw error;
    }
  },

  vincularPessoa: async (empresaId, pessoaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/empresas/${empresaId}/vincular-pessoa/${pessoaId}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Erro ao vincular pessoa");
    } catch (error) {
      console.error("Erro em vincularPessoa:", error);
      throw error;
    }
  },

  vincularPessoas: async (empresaId, pessoaIds) => {
    try {
      const response = await fetch(`${API_BASE}/api/empresas/${empresaId}/vincular-pessoas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pessoaIds),
      });
      if (!response.ok) throw new Error("Erro ao vincular pessoas");
    } catch (error) {
      console.error("Erro em vincularPessoas:", error);
      throw error;
    }
  },

  desvincularPessoa: async (empresaId, pessoaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/empresas/${empresaId}/desvincular-pessoa/${pessoaId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao desvincular pessoa");
    } catch (error) {
      console.error("Erro em desvincularPessoa:", error);
      throw error;
    }
  },

  desvincularTodasPessoas: async (empresaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/empresas/${empresaId}/desvincular-todas-pessoas`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao desvincular todas pessoas");
    } catch (error) {
      console.error("Erro em desvincularTodasPessoas:", error);
      throw error;
    }
  },

  contarPessoasVinculadas: async (empresaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/empresas/${empresaId}/contar-pessoas`);
      if (!response.ok) throw new Error("Erro ao contar pessoas");
      return await response.json();
    } catch (error) {
      console.error("Erro em contarPessoasVinculadas:", error);
      throw error;
    }
  },

  isPessoaVinculada: async (empresaId, pessoaId) => {
    try {
      const response = await fetch(`${API_BASE}/api/empresas/${empresaId}/pessoa-vinculada/${pessoaId}`);
      if (!response.ok) throw new Error("Erro ao verificar vínculo");
      return await response.json();
    } catch (error) {
      console.error("Erro em isPessoaVinculada:", error);
      throw error;
    }
  },

  deletar: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/empresas/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao deletar empresa");
    } catch (error) {
      console.error("Erro em deletar:", error);
      throw error;
    }
  },
};
