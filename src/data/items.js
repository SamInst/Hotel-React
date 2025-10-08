// Mock inicial
export const ITEM_CATEGORIES = ['BEBIDA', 'DOCE', 'SALGADO'];

export const INITIAL_ITEMS = [
  {
    id: 1,
    nome: 'Agua Mineral 350ml',
    categoria: 'BEBIDA',
    estoque: 24,
    precoCompra: 0.89,
    precoVenda: 3.00,
    historico: [
      { data: '2025-05-20', qtd: 12, valorCompra: 0.89, valorVenda: 3.00 },
      { data: '2025-04-20', qtd: 12, valorCompra: 0.89, valorVenda: 3.00 },
    ],
  },
  {
    id: 2,
    nome: 'Biscoito Oreo 90g',
    categoria: 'DOCE',
    estoque: 72,
    precoCompra: 2.45,
    precoVenda: 5.00,
    historico: [
      { data: '2025-05-20', qtd: 12, valorCompra: 2.45, valorVenda: 5.00 },
      { data: '2025-04-20', qtd: 12, valorCompra: 2.45, valorVenda: 5.00 },
      { data: '2025-03-20', qtd: 12, valorCompra: 2.45, valorVenda: 5.00 },
      { data: '2025-02-20', qtd: 36, valorCompra: 2.45, valorVenda: 5.00 },
    ],
  },
  { 
    id: 3,
    nome: 'Salgadinho FEST 130g',
    categoria: 'SALGADO',
    estoque: 64,
    precoCompra: 1.36,
    precoVenda: 4.00,
    historico: [
      { data: '2025-05-20', qtd: 12, valorCompra: 1.36, valorVenda: 4.00 },
      { data: '2025-04-20', qtd: 12, valorCompra: 1.36, valorVenda: 4.00 },
      { data: '2025-03-20', qtd: 40, valorCompra: 1.36, valorVenda: 4.00 },
    ],
  },
];
