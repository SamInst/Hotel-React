import React from 'react';
import { Modal } from './Modal.jsx';
import icEmpresa from '../icons/empresa.png';

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';

export function CompanyDetailsModal({ open, onClose, company }){
  if(!open || !company) return null;

  const vinculados = company.vinculados || [];

  return (
    <Modal open={open} onClose={onClose}>
      <div className="client-details">
        <section className="cd-card cd-head">
          <div className="cd-avatar">
            <img
              className="cd-avatar__img"
              src={icEmpresa}
              alt=""
            />
            <button type="button" className="cd-editbtn" onClick={onClose}>Editar Dados</button>
          </div>

          <div className="cd-head__info">
            <h2 className="cd-name">{company.nome_empresa}</h2>
            <div className="cd-kvgrid">
              <div className="cd-kvcol">
                <div className="kv"><strong>CNPJ:</strong><span>{company.cnpj || '—'}</span></div>
                <div className="kv"><strong>Telefone:</strong><span>{company.telefone || '—'}</span></div>
                <div className="kv"><strong>Email:</strong><span>{company.email || '—'}</span></div>
              </div>
              <div className="cd-kvcol" />
            </div>
          </div>
        </section>

        <section className="cd-card cd-split">
          <div>
            <h4>Endereço</h4>
            <div className="kv"><strong>Logradouro:</strong><span>{company.endereco || '—'}</span></div>
            <div className="kv"><strong>CEP:</strong><span>{company.cep || '—'}</span><strong className="kv__sep">Número:</strong><span>{company.numero || '—'}</span></div>
            <div className="kv"><strong>Complemento:</strong><span>{company.complemento || '—'}</span></div>
            <div className="kv"><strong>Bairro:</strong><span>{company.bairro || '—'}</span></div>
            <div className="kv"><strong>País:</strong><span>{company.pais || '—'}</span></div>
            <div className="kv"><strong>Estado:</strong><span>{company.estado || '—'}</span></div>
            <div className="kv"><strong>Município:</strong><span>{company.municipio || '—'}</span></div>
          </div>
          <div />
        </section>

        <section className="cd-card cd-statusbar">
          <div>Situação: <span className="pill pill--ok">{company.situacao || 'Cadastrado'}</span></div>
          <div />
          <div />
        </section>

        <section className="cd-card">
          <h3 style={{margin:'0 0 8px'}}>Pessoas Vinculadas</h3>
          <div>
            {vinculados.map(p => (
              <div key={p.id} className="client-row" style={{gridTemplateColumns:'1fr 180px'}}>
                <div className="client-main">
                  <img className="client-avatar" src={p.avatar} alt="" />
                  <div>
                    <div className="client-name">{p.nome}</div>
                    <div className="client-phone">Telefone: {p.telefone || '—'}</div>
                  </div>
                </div>
                <div className="client-dates">
                  {p.hospedado
                    ? <span className="pill pill--ok">Hospedado</span>
                    : `${fmt(p.ultimaHospedagemInicio)} - ${fmt(p.ultimaHospedagemFim)}`}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}
