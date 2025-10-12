// src/services/cnpjService.js
export const buscarCnpj = async (cnpj) => {
  try {
    const response = await fetch(`https://open.cnpja.com/office/${cnpj}`);
    if (!response.ok) throw new Error("Erro ao consultar CNPJ");
    const data = await response.json();

    const endereco = data.address || {};
    const empresa = data.company || {};
    const email = data.emails?.[0]?.address || "";
    const telefone =
      data.phones?.[0]
        ? `(${data.phones[0].area}) ${data.phones[0].number}`
        : "";

    // Retorna os campos padronizados conforme o formulário da empresa
    return {
      razao_social: empresa.name || "",
      nome_fantasia: data.alias || "",
      cnpj: data.taxId || "",
      tipo_empresa: empresa.size?.acronym || "",
      ativa: data.status?.text === "Ativa" ? "1" : "0",
      email,
      telefone,
      cep: endereco.zip || "",
      endereco: endereco.street || "",
      bairro: endereco.district || "",
      complemento: endereco.details || "",
      localidade: endereco.city || "",
      uf: endereco.state || "",
      pais: endereco.country?.name || "Brasil",
    };
  } catch (err) {
    console.error("Erro em buscarCnpj:", err);
    return null;
  }
};
