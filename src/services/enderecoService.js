// Exemplo mock — pode ser trocado por seus endpoints reais (ex: /estados, /municipios)
//src/services/enderecoService.js
export const listarPaises = async () => [
  { id: 1, nome: "Brasil" },
];

export const listarEstados = async () => [
  { id: 10, nome: "Maranhão" },
  { id: 20, nome: "Piauí" },
];

export const listarMunicipios = async (estadoId) => {
  if (estadoId === "10")
    return [{ id: 1001, nome: "São Luís" }, { id: 1002, nome: "Imperatriz" }];
  return [{ id: 2001, nome: "Teresina" }];
};

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
    ufId: data.uf,
    municipioId: data.ibge,
  };
};
