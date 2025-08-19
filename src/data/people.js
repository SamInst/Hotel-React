// src/data/people.js
export const PEOPLE = [
  {
    id: 1,
    nome: "Amelia Santos Andrade",
    cpf: "123.456.789-09",
    rg: "033.567.765.009-2",
    sexo: 2,
    data_nascimento: "2002-12-12",
    telefone: "(98) 9 8787-9090",
    email: "email@email.com",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    nacionalidade: { municipio: "Viana", estado: "Maranhão", pais: "Brasil" },
    profissao: "Engenheira de Software",
    estado_civil: "Solteira",
    endereco: {
      logradouro: "Rua Doutor Bernardino de Sena Dias",
      cep: "65215-000",
      numero: "1056",
      complemento: "Olinda",
      bairro: "Ouro Preto",
      pais: "Brasil",
      estado: "Amazonas",
      municipio: "Apuí"
    },
    empresa: {
      razao: "SAM HELSON LTDA",
      cnpj: "52.006.953/0001-60",
      telefone: "(98) 9 8787-9090",
      email: "email@email.com"
    },
    situacao: "Cadastrado",
    cliente_novo: true,
    hospedado: false,
    ultimaHospedagemInicio: "2025-02-23",
    ultimaHospedagemFim: "2025-02-26",
    historicoHospedagem: [
      {
        quarto: "Quarto 01",
        titular: "Sam Helson Nunes Diniz",
        cpf: "123.432.222-00",
        inicio: "2025-03-27",
        fim: "2025-03-29",
        blocos: [
          {
            titulo: "1 Diaria 27/03/2025 - 28/03/2025",
            total: 116,
            itens: [
              { nome: "Hospedagem Individual", data: "28/03/2025 15:07", pagamento: "PIX", valor: 110 },
              { nome: "Consumo", data: "28/03/2025 15:08", pagamento: "PIX", valor: 6 }
            ]
          },
          {
            titulo: "2 Diaria 28/03/2025 - 29/03/2025",
            total: 110,
            itens: [
              { nome: "Hospedagem Individual", data: "28/03/2025 15:07", pagamento: "CARTAO DE CREDITO", valor: 110 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 2,
    nome: "Vicente Santos",
    cpf: "987.654.321-00",
    telefone: "(98) 9 8787-9090",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    ultimaHospedagemInicio: "2025-02-23",
    ultimaHospedagemFim: "2025-02-26",
    historicoHospedagem: []
  }
];
