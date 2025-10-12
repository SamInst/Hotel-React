// src/services/vehicleService.js
export async function buscarVeiculoPorPlaca(placa) {
  try {
    if (!placa) return null;

    const cleanPlaca = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (cleanPlaca.length < 7) return null;

    const response = await fetch(`https://brasilapi.com.br/api/placa/v1/${cleanPlaca}`);
    if (!response.ok) throw new Error("Placa não encontrada ou formato inválido.");

    const data = await response.json();

    // Normaliza para o form
    return {
      placa: data.placa || cleanPlaca,
      marca: data.marca || "",
      modelo: data.modelo || "",
      cor: data.cor || "",
      ano_fabricacao: data.ano || "",
      ano_modelo: data.anoModelo || "",
      tipo_veiculo: "", // a API não traz tipo, deixamos manual
      capacidade: "",
      combustivel: "",
      observacoes: `Veículo registrado no estado ${data.uf}, município ${data.municipio}`,
    };
  } catch (error) {
    console.error("Erro ao buscar veículo:", error);
    return null;
  }
}
