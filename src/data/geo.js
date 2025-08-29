
export const PAISES = [
    { id: 1, nome: 'Brasil' },
    { id: 2, nome: 'Portugal' }
  ];
  
  export const ESTADOS = [
    { id: 10, nome: 'Maranhão', fk_pais: 1 },
    { id: 20, nome: 'São Paulo', fk_pais: 1 },
    { id: 30, nome: 'Lisboa (Distrito)', fk_pais: 2 }
  ];
  
  export const MUNICIPIOS = [

    { id: 100, nome: 'Viana', fk_estado: 10 },
    { id: 110, nome: 'São Luís', fk_estado: 10 },
    { id: 200, nome: 'São Paulo', fk_estado: 20 },
    { id: 300, nome: 'Lisboa', fk_estado: 30 }
  ];
    