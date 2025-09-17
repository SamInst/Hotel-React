// src/components/CompanyRegistrationModal.jsx
import React, { useMemo, useState } from 'react';
import { PEOPLE } from '../data/people.js';

const UF_TO_NOME = {
  AC:'Acre', AL:'Alagoas', AM:'Amazonas', AP:'Amapá', BA:'Bahia', CE:'Ceará',
  DF:'Distrito Federal', ES:'Espírito Santo', GO:'Goiás', MA:'Maranhão',
  MT:'Mato Grosso', MS:'Mato Grosso do Sul', MG:'Minas Gerais', PA:'Pará',
  PB:'Paraíba', PR:'Paraná', PE:'Pernambuco', PI:'Piauí', RJ:'Rio de Janeiro',
  RN:'Rio Grande do Norte', RO:'Rondônia', RS:'Rio Grande do Sul', RR:'Roraima',
  SC:'Santa Catarina', SE:'Sergipe', SP:'São Paulo', TO:'Tocantins'
};

const initialForm = {
  nome_empresa: '',
  cnpj: '',
  telefone: '',
  email: '',
  cep: '65066260',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  pais: 'Brasil',
  estado: '',
  municipio: '',
  vinculados: []
};

export function CompanyRegistrationModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [linkQuery, setLinkQuery] = useState('');

  const linkCandidates = useMemo(() => {
    const s = linkQuery.trim().toLowerCase();
    if (!s) return [];
    const sDigits = s.replace(/\D/g,'');
    return PEOPLE.filter(p =>
      p.nome.toLowerCase().includes(s) ||
      (p.cpf || '').replace(/\D/g,'').includes(sDigits)
    );
  }, [linkQuery]);

  async function handleCepBlur() {
    const cepDigits = (form.cep || '').replace(/\D/g,'');
    if (cepDigits.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await r.json();
      if (data?.erro) return;
      setForm(f => ({
        ...f,
        cep: data.cep || f.cep,
        endereco: data.logradouro || f.endereco,
        bairro: data.bairro || f.bairro,
        municipio: data.localidade || f.municipio,
        estado: data.estado || UF_TO_NOME[data.uf] || f.estado,
        pais: 'Brasil'
      }));
    } catch(e) {
      console.error('Erro ao buscar CEP:', e);
    }
  }

  function onChange(k, v) { 
    setForm(f => ({...f, [k]: v})); 
  }
  
  function addLinked(p) {
    setForm(f => f.vinculados.find(x=>x.id===p.id) ? f : ({...f, vinculados:[...f.vinculados, p]}));
    setLinkQuery('');
  }
  
  function removeLinked(id) {
    setForm(f => ({...f, vinculados: f.vinculados.filter(x=>x.id!==id)}));
  }

  function submit(e) {
    e.preventDefault();
    const payload = {
      id: Date.now(), // Temporary ID generation
      nome_empresa: form.nome_empresa,
      cnpj: form.cnpj,
      telefone: form.telefone,
      email: form.email,
      endereco: form.endereco,
      cep: form.cep,
      numero: form.numero,
      complemento: form.complemento,
      bairro: form.bairro,
      pais: form.pais,
      estado: form.estado,
      municipio: form.municipio,
      vinculados: form.vinculados,
      situacao: 'Cadastrado'
    };
    
    if (onSuccess) {
      onSuccess(payload);
    }
    clear();
    onClose();
  }

  function clear() {
    setForm(initialForm);
    setLinkQuery('');
  }

  const handleClose = () => {
    clear();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container modal-container--large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Cadastrar Nova Empresa</h2>
          <button className="modal-close" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="modal-content">
          <div className="form-section">
            <h3 className="form-section-title">Dados Empresariais</h3>
            <div className="form-grid">
              <div className="col-12 field">
                <label className="field-label">Nome/Razão Social *</label>
                <input 
                  className="field-input" 
                  value={form.nome_empresa} 
                  onChange={e=>onChange('nome_empresa', e.target.value)}
                  required
                />
              </div>
              <div className="col-6 field">
                <label className="field-label">Email</label>
                <input 
                  className="field-input" 
                  type="email"
                  value={form.email} 
                  onChange={e=>onChange('email', e.target.value)} 
                />
              </div>
              <div className="col-3 field">
                <label className="field-label">CNPJ *</label>
                <input 
                  className="field-input" 
                  value={form.cnpj} 
                  onChange={e=>onChange('cnpj', e.target.value)}
                  required
                />
              </div>
              <div className="col-3 field">
                <label className="field-label">Telefone</label>
                <input 
                  className="field-input" 
                  value={form.telefone} 
                  onChange={e=>onChange('telefone', e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Endereço</h3>
            <div className="form-grid">
              <div className="col-3 field">
                <label className="field-label">CEP</label>
                <input
                  className="field-input"
                  value={form.cep}
                  onChange={e=>onChange('cep', e.target.value)}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                />
              </div>
              <div className="col-9 field">
                <label className="field-label">Logradouro</label>
                <input 
                  className="field-input" 
                  value={form.endereco} 
                  onChange={e=>onChange('endereco', e.target.value)} 
                />
              </div>
              <div className="col-6 field">
                <label className="field-label">Complemento</label>
                <input 
                  className="field-input" 
                  value={form.complemento} 
                  onChange={e=>onChange('complemento', e.target.value)} 
                />
              </div>
              <div className="col-3 field">
                <label className="field-label">Bairro</label>
                <input 
                  className="field-input" 
                  value={form.bairro} 
                  onChange={e=>onChange('bairro', e.target.value)} 
                />
              </div>
              <div className="col-3 field">
                <label className="field-label">Número</label>
                <input 
                  className="field-input" 
                  value={form.numero} 
                  onChange={e=>onChange('numero', e.target.value)} 
                />
              </div>
              <div className="col-4 field">
                <label className="field-label">País</label>
                <input 
                  className="field-input" 
                  value={form.pais} 
                  onChange={e=>onChange('pais', e.target.value)} 
                />
              </div>
              <div className="col-4 field">
                <label className="field-label">Estado</label>
                <input 
                  className="field-input" 
                  value={form.estado} 
                  onChange={e=>onChange('estado', e.target.value)} 
                />
              </div>
              <div className="col-4 field">
                <label className="field-label">Município</label>
                <input 
                  className="field-input" 
                  value={form.municipio} 
                  onChange={e=>onChange('municipio', e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Vincular Pessoas</h3>
            <div className="field">
              <label className="field-label">Pesquisar por Nome ou CPF</label>
              <div className="search-field">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <input
                  className="search-input"
                  placeholder="Digite nome ou CPF..."
                  value={linkQuery}
                  onChange={e=>setLinkQuery(e.target.value)}
                />
              </div>
            </div>

            {linkCandidates.length > 0 && (
              <div className="candidates-list">
                <h4 className="candidates-title">Pessoas Encontradas:</h4>
                {linkCandidates.slice(0, 5).map(p => (
                  <div
                    key={p.id}
                    className="candidate-item"
                    onClick={() => addLinked(p)}
                  >
                    <img className="candidate-avatar" src={p.avatar} alt="" />
                    <div className="candidate-info">
                      <div className="candidate-name">{p.nome}</div>
                      <div className="candidate-cpf">{p.cpf || '—'}</div>
                    </div>
                    <button type="button" className="btn-add-candidate">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.vinculados.length > 0 && (
              <div className="linked-list">
                <h4 className="linked-title">Pessoas Vinculadas ({form.vinculados.length}):</h4>
                {form.vinculados.map(p => (
                  <div key={p.id} className="linked-item">
                    <img className="linked-avatar" src={p.avatar} alt="" />
                    <div className="linked-info">
                      <div className="linked-name">{p.nome}</div>
                      <div className="linked-cpf">{p.cpf || '—'}</div>
                    </div>
                    <button 
                      type="button" 
                      className="btn-remove-linked"
                      onClick={() => removeLinked(p.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn--secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary">
              Cadastrar Empresa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}