import React, { useState } from 'react';
import { ClientsPage } from './ClientsPage.jsx';
import CompanyPage from './CompanyPage.jsx';

const TABS = [
  { key: 'vehicle', label: 'Veículo' },
  { key: 'pf',      label: 'Pessoa física' },
  { key: 'pj',      label: 'Pessoa Jurídica' },
];

export default function PeopleRegister(){
  const [tab, setTab] = useState('pf');

  const title = tab === 'pf'
    ? 'Cadastro de Pessoa Física'
    : tab === 'pj'
      ? 'Cadastro de Empresas'
      : 'Cadastro de Veículo';

  return (
    <div className="form-page">
      <div className="page-header">
        <h1 className="page-header__title">{title}</h1>
        <div className="page-tabs" role="tablist" aria-label="Tipo de cadastro">
          {TABS.map(t => (
            <button
              key={t.key}
              role="tab"
              type="button"
              className="page-tab"
              aria-selected={tab === t.key}
              onClick={()=>setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'pf' && <ClientsPage />}
      {tab === 'pj' && <CompanyPage />}
      {tab === 'vehicle' && (
        <div className="form-card" style={{textAlign:'center', padding:'40px'}}>
          Em breve: tela de cadastro de veículo.
        </div>
      )}
    </div>
  );
}
