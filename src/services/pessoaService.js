// src/services/pessoaService.js

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const pessoaService = {
  listarTodos: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas`);
      if (!response.ok) throw new Error("Erro ao buscar pessoas");
      return await response.json();
    } catch (error) {
      console.error("Erro em listarTodos:", error);
      throw error;
    }
  },

  buscarPorId: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Erro ao buscar pessoa");
      }
      return await response.json();
    } catch (error) {
      console.error("Erro em buscarPorId:", error);
      throw error;
    }
  },

  buscarPorNome: async (nome) => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas/buscar/nome?nome=${encodeURIComponent(nome)}`);
      if (!response.ok) throw new Error("Erro ao buscar por nome");
      return await response.json();
    } catch (error) {
      console.error("Erro em buscarPorNome:", error);
      throw error;
    }
  },

  buscarPorCpf: async (cpf) => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas/buscar/cpf/${cpf}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Erro ao buscar por CPF");
      }
      return await response.json();
    } catch (error) {
      console.error("Erro em buscarPorCpf:", error);
      throw error;
    }
  },

  buscarPorNomeOuCpf: async (termo) => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas/buscar?termo=${encodeURIComponent(termo)}`);
      if (!response.ok) throw new Error("Erro ao buscar");
      return await response.json();
    } catch (error) {
      console.error("Erro em buscarPorNomeOuCpf:", error);
      throw error;
    }
  },

  listarHospedados: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas/hospedados`);
      if (!response.ok) throw new Error("Erro ao buscar hospedados");
      return await response.json();
    } catch (error) {
      console.error("Erro em listarHospedados:", error);
      throw error;
    }
  },

  cadastrar: async (pessoa) => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pessoa),
      });
      if (!response.ok) throw new Error("Erro ao cadastrar pessoa");
      return await response.json();
    } catch (error) {
      console.error("Erro em cadastrar:", error);
      throw error;
    }
  },

  atualizar: async (id, pessoa) => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pessoa),
      });
      if (!response.ok) throw new Error("Erro ao atualizar pessoa");
      return await response.json();
    } catch (error) {
      console.error("Erro em atualizar:", error);
      throw error;
    }
  },

  marcarComoHospedado: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas/${id}/hospedar`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Erro ao marcar como hospedado");
    } catch (error) {
      console.error("Erro em marcarComoHospedado:", error);
      throw error;
    }
  },

  marcarComoNaoHospedado: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas/${id}/desospedar`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Erro ao marcar como não hospedado");
    } catch (error) {
      console.error("Erro em marcarComoNaoHospedado:", error);
      throw error;
    }
  },

  registrarHospedagem: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas/${id}/registrar-hospedagem`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Erro ao registrar hospedagem");
    } catch (error) {
      console.error("Erro em registrarHospedagem:", error);
      throw error;
    }
  },

  finalizarHospedagem: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas/${id}/finalizar-hospedagem`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Erro ao finalizar hospedagem");
    } catch (error) {
      console.error("Erro em finalizarHospedagem:", error);
      throw error;
    }
  },

  possuiVinculoComEmpresa: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas/${id}/possui-vinculo-empresa`);
      if (!response.ok) throw new Error("Erro ao verificar vínculo");
      return await response.json();
    } catch (error) {
      console.error("Erro em possuiVinculoComEmpresa:", error);
      throw error;
    }
  },

  contarEmpresasVinculadas: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas/${id}/contar-empresas`);
      if (!response.ok) throw new Error("Erro ao contar empresas");
      return await response.json();
    } catch (error) {
      console.error("Erro em contarEmpresasVinculadas:", error);
      throw error;
    }
  },

  deletar: async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/pessoas/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao deletar pessoa");
    } catch (error) {
      console.error("Erro em deletar:", error);
      throw error;
    }
  },
};
