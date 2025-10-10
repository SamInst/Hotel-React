// src/pages/PeopleRegister.jsx
import React, { useState } from 'react';
import { UsersPage } from './UsersPage.jsx';

const TABS = [
  { key: 'users',   label: 'Usuários' }
];

export default function PeopleRegister(){
  const [tab, setTab] = useState('users');

  const title = tab === 'pf'
    ? 'Cadastro de Pessoa Física'
    : tab === 'pj'
      ? 'Cadastro de Empresas'
    : tab === 'users'
      ? 'Cadastro de Usuários'
      : 'Cadastro de Veículo';

  return (
    <div className="form-page">
      {tab === 'users' && <UsersPage />}
    </div>
  );
}