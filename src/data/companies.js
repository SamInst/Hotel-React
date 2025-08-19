import { PEOPLE } from './people.js';

export const COMPANIES = [
  {
    id: 1,
    nome_empresa: 'SAM HELSON LTDA',
    cnpj: '12.345.678/0009-00',
    telefone: '(98) 9 8787-9090',
    email: 'email@email.com',
    endereco: 'Rua Doutor Bernardino de Sena Dias',
    cep: '65215-000',
    numero: '1056',
    complemento: 'Olinda',
    bairro: 'Ouro Preto',
    pais: 'Brasil',
    estado: 'Amazonas',
    municipio: 'Apuí',
    vinculados: [PEOPLE[0], PEOPLE[1]],
    situacao: 'Cadastrado'
  },
  { id: 2, nome_empresa: 'Empresa 2',        cnpj:'34.567.890/0001-00' },
  { id: 3, nome_empresa: 'Empresa 3',        cnpj:'34.567.890/0001-00' },
  { id: 4, nome_empresa: 'Empresa 4',        cnpj:'34.567.890/0001-00' },
  { id: 5, nome_empresa: 'Empresa 5',        cnpj:'34.567.890/0001-00' }
];
