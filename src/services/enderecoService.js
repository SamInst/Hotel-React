// src/services/enderecoService.js

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
/**
 * Lista todos os países
 * GET /localidades/paises
 */
export const listarPaises = async () => {
  try {
    const response = await fetch(`${API_BASE}/localidades/paises`);
    if (!response.ok) throw new Error("Erro ao buscar países");

    const data = await response.json();
    return data.map((p) => ({
      id: p.id,
      nome: p.descricao,
    }));
  } catch (error) {
    console.error("Erro em listarPaises:", error);
    return [];
  }
};

/**
 * Lista os estados de um país
 * GET /localidades/estados/{fkPais}
 */
export const listarEstados = async (fkPais = 1) => {
  try {
    const response = await fetch(`${API_BASE}/localidades/estados/${fkPais}`);
    if (!response.ok) throw new Error("Erro ao buscar estados");

    const data = await response.json();
    return data.map((e) => ({
      id: e.id,
      nome: e.descricao,
    }));
  } catch (error) {
    console.error("Erro em listarEstados:", error);
    return [];
  }
};

/**
 * Lista os municípios de um estado
 * GET /localidades/municipios/{fkEstado}
 */
export const listarMunicipios = async (fkEstado) => {
  try {
    if (!fkEstado) return [];
    const response = await fetch(
      `${API_BASE}/localidades/municipios/${fkEstado}`
    );
    if (!response.ok) throw new Error("Erro ao buscar municípios");

    const data = await response.json();
    return data.map((m) => ({
      id: m.id,
      nome: m.descricao,
    }));
  } catch (error) {
    console.error("Erro em listarMunicipios:", error);
    return [];
  }
};

/**
 * Busca endereço por CEP — usa API pública ViaCEP
 */
export const buscarEnderecoPorCep = async (cep) => {
  const cleanCep = cep.replace(/\D/g, "");
  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
  if (!response.ok) return null;
  const data = await response.json();
  if (data.erro) return null;

  return {
    logradouro: data.logradouro,
    bairro: data.bairro,
    complemento: data.complemento,
    localidade: data.localidade, // município
    estado: data.estado || "",   // fallback caso seu backend adicione esse campo
    uf: data.uf,                 // sigla do estado (ex: MG)
    ibge: data.ibge,
  };
};

