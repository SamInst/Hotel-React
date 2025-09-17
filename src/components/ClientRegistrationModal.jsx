// src/components/ClientRegistrationModal.jsx
import React, { useMemo, useState } from 'react';
import { PAISES, ESTADOS, MUNICIPIOS } from '../data/geo.js';

const SEXO_OPTIONS = [
  { value: 1, label: 'Masculino' },
  { value: 2, label: 'Feminino' },
  { value: 3, label: 'Outro' }
];

export function ClientRegistrationModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    rg: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    sexo: 2,
    fk_pais: 1,
    fk_estado: 10,
    fk_municipio: 100,
    cep: '',
    endereco: '',
    complemento: '',
    bairro: '',
    numero: ''
  });

  const estadosFiltrados = useMemo(
    () => ESTADOS.filter(e => e.fk_pais === Number(form.fk_pais)),
    [form.fk_pais]
  );

  const municipiosFiltrados = useMemo(
    () => MUNICIPIOS.filter(m => m.fk_estado === Number(form.fk_estado)),
    [form.fk_estado]
  );

  const setField = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const onChangePais = (e) => {
    const fk_pais = Number(e.target.value);
    const estados = ESTADOS.filter(x => x.fk_pais === fk_pais);
    const fk_estado = estados.length ? estados[0].id : '';
    const municipios = MUNICIPIOS.filter(x => x.fk_estado === fk_estado);
    const fk_municipio = municipios.length ? municipios[0].id : '';
    setForm(s => ({ ...s, fk_pais, fk_estado, fk_municipio }));
  };

  const onChangeEstado = (e) => {
    const fk_estado = Number(e.target.value);
    const municipios = MUNICIPIOS.filter(x => x.fk_estado === fk_estado);
    const fk_municipio = municipios.length ? municipios[0].id : '';
    setForm(s => ({ ...s, fk_estado, fk_municipio }));
  };

  const clear = () => {
    setForm({
      nome: '',
      cpf: '',
      rg: '',
      email: '',
      telefone: '',
      data_nascimento: '',
      sexo: 2,
      fk_pais: 1,
      fk_estado: 10,
      fk_municipio: 100,
      cep: '',
      endereco: '',
      complemento: '',
      bairro: '',
      numero: ''
    });
  };

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      id: Date.now(), // Temporary ID generation
      nome: form.nome,
      cpf: form.cpf,
      rg: form.rg,
      email: form.email,
      telefone: form.telefone,
      data_nascimento: form.data_nascimento || null,
      sexo: Number(form.sexo),
      fk_pais: Number(form.fk_pais),
      fk_estado: Number(form.fk_estado),
      fk_municipio: Number(form.fk_municipio),
      cep: form.cep,
      endereco: form.endereco,
      complemento: form.complemento,
      bairro: form.bairro,
      numero: form.numero,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(form.nome)}&background=3b82f6&color=fff`
    };
    
    if (onSuccess) {
      onSuccess(payload);
    }
    clear();
    onClose();
  };

  const handleClose = () => {
    clear();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Cadastrar Novo Cliente</h2>
          <button className="modal-close" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="modal-content">
          <div className="form-section">
            <h3 className="form-section-title">Dados Pessoais</h3>
            
            <div className="form-grid">
              <div className="avatar-field col-2">
                <div className="avatar-circle" />
              </div>

              <div className="field col-4">
                <label className="field-label">Nome Completo *</label>
                <input 
                  className="field-input" 
                  value={form.nome} 
                  onChange={e=>setField('nome', e.target.value)}
                  required
                />
              </div>

              <div className="field col-3">
                <label className="field-label">CPF *</label>
                <input 
                  className="field-input" 
                  value={form.cpf} 
                  onChange={e=>setField('cpf', e.target.value)}
                  required
                />
              </div>

              <div className="field col-3">
                <label className="field-label">RG</label>
                <input 
                  className="field-input" 
                  value={form.rg} 
                  onChange={e=>setField('rg', e.target.value)} 
                />
              </div>

              <div className="field col-6">
                <label className="field-label">Email</label>
                <input 
                  className="field-input" 
                  type="email" 
                  value={form.email} 
                  onChange={e=>setField('email', e.target.value)} 
                />
              </div>

              <div className="field col-3">
                <label className="field-label">Data Nascimento</label>
                <input 
                  className="field-input" 
                  type="date" 
                  value={form.data_nascimento} 
                  onChange={e=>setField('data_nascimento', e.target.value)} 
                />
              </div>

              <div className="field col-3">
                <label className="field-label">Gênero</label>
                <select 
                  className="field-select" 
                  value={form.sexo} 
                  onChange={e=>setField('sexo', e.target.value)}
                >
                  {SEXO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="field col-4">
                <label className="field-label">Telefone</label>
                <input 
                  className="field-input" 
                  value={form.telefone} 
                  onChange={e=>setField('telefone', e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Endereço</h3>
            
            <div className="form-grid">
              <div className="field col-3">
                <label className="field-label">CEP</label>
                <input 
                  className="field-input" 
                  value={form.cep} 
                  onChange={e=>setField('cep', e.target.value)} 
                />
              </div>

              <div className="field col-9">
                <label className="field-label">Logradouro</label>
                <input 
                  className="field-input" 
                  value={form.endereco} 
                  onChange={e=>setField('endereco', e.target.value)} 
                />
              </div>

              <div className="field col-6">
                <label className="field-label">Complemento</label>
                <input 
                  className="field-input" 
                  value={form.complemento} 
                  onChange={e=>setField('complemento', e.target.value)} 
                />
              </div>

              <div className="field col-4">
                <label className="field-label">Bairro</label>
                <input 
                  className="field-input" 
                  value={form.bairro} 
                  onChange={e=>setField('bairro', e.target.value)} 
                />
              </div>

              <div className="field col-2">
                <label className="field-label">Número</label>
                <input 
                  className="field-input" 
                  value={form.numero} 
                  onChange={e=>setField('numero', e.target.value)} 
                />
              </div>

              <div className="field col-4">
                <label className="field-label">País</label>
                <select className="field-select" value={form.fk_pais} onChange={onChangePais}>
                  {PAISES.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>

              <div className="field col-4">
                <label className="field-label">Estado</label>
                <select className="field-select" value={form.fk_estado} onChange={onChangeEstado}>
                  {estadosFiltrados.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>

              <div className="field col-4">
                <label className="field-label">Município</label>
                <select className="field-select" value={form.fk_municipio} onChange={e=>setField('fk_municipio', Number(e.target.value))}>
                  {municipiosFiltrados.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn--secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary">
              Cadastrar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}