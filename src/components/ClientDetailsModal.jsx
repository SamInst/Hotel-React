// src/components/ClientDetailsModal.jsx
import React, { useMemo, useRef, useState } from 'react';
import { Modal } from './Modal.jsx';

function ageFrom(dateIso){
  if(!dateIso) return null;
  const d = new Date(dateIso);
  const diff = Date.now() - d.getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}
const fmtBR = (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR') : '-';
const money = (n) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n||0));
const monthLabel = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, s=>s.toUpperCase());
};

export function ClientDetailsModal({ open, onClose, person }){
  if(!open || !person) return null;

  const sexoLabel = ({1:'Masculino',2:'Feminino',3:'Outro'})[person.sexo] || '-';
  const idade = ageFrom(person.data_nascimento);

  const allStart = useMemo(() => {
    const arr = person.historicoHospedagem || [];
    if(!arr.length) return '';
    return arr.map(s=>s.inicio).sort()[0];
  }, [person]);
  const allEnd = useMemo(() => {
    const arr = person.historicoHospedagem || [];
    if(!arr.length) return '';
    return arr.map(s=>s.fim).sort().slice(-1)[0];
  }, [person]);

  const [start, setStart] = useState(allStart);
  const [end, setEnd] = useState(allEnd);
  const startRef = useRef(null);
  const endRef = useRef(null);

  const stays = useMemo(() => {
    const data = person.historicoHospedagem || [];
    if(!start || !end) return data;
    const s = new Date(start).setHours(0,0,0,0);
    const e = new Date(end).setHours(23,59,59,999);
    return data.filter(x=>{
      const xs = new Date(x.inicio).getTime();
      const xe = new Date(x.fim).getTime();
      return xs >= s && xe <= e;
    }).sort((a,b)=> new Date(a.inicio) - new Date(b.inicio));
  }, [person, start, end]);

  const groups = useMemo(()=>{
    const g = {};
    stays.forEach(st => {
      const key = new Date(st.inicio);
      const k = `${key.getFullYear()}-${String(key.getMonth()+1).padStart(2,'0')}`;
      if(!g[k]) g[k] = { label: monthLabel(st.inicio), items: [] };
      g[k].items.push(st);
    });
    return Object.entries(g).sort(([a],[b]) => a.localeCompare(b)).map(([,v])=>v);
  }, [stays]);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="client-details-modal">
        <div className="modal-header">
          <div className="modal-title">
            <span className="client-icon">👤</span>
            <span>Detalhes do Cliente</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <section className="client-section">
            <div className="client-header">
              <div className="client-avatar">
                <img src={person.avatar} alt={person.nome} className="avatar-image" />
                <button type="button" className="edit-button" onClick={onClose}>
                  <span className="edit-icon">✏️</span>
                  Editar Dados
                </button>
              </div>

              <div className="client-info">
                <h2 className="client-name">{person.nome}</h2>

                <div className="info-grid">
                  <div className="info-column">
                    <div className="info-item">
                      <label>CPF:</label>
                      <span>{person.cpf || '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>Telefone:</label>
                      <span>{person.telefone || '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>Email:</label>
                      <span>{person.email || '-'}</span>
                    </div>
                  </div>
                  <div className="info-column">
                    <div className="info-item">
                      <label>Nascimento:</label>
                      <span>{fmtBR(person.data_nascimento)}{idade != null ? ` (${idade} anos)` : ''}</span>
                    </div>
                    <div className="info-item">
                      <label>RG:</label>
                      <span>{person.rg || '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>Gênero:</label>
                      <span>{sexoLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="info-full">
                  <div className="info-item">
                    <label>Nacionalidade:</label>
                    <span>{person.nacionalidade ? `${person.nacionalidade.municipio}, ${person.nacionalidade.estado}, ${person.nacionalidade.pais}` : '-'}</span>
                  </div>
                  <div className="info-item">
                    <label>Profissão:</label>
                    <span>{person.profissao || '-'}</span>
                  </div>
                  <div className="info-item">
                    <label>Estado Civil:</label>
                    <span>{person.estado_civil || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="client-section">
            <div className="section-grid">
              <div className="section-column">
                <h3 className="section-title">Endereço</h3>
                <div className="info-item">
                  <label>Logradouro:</label>
                  <span>{person.endereco?.logradouro || '-'}</span>
                </div>
                <div className="info-item">
                  <label>CEP:</label>
                  <span>{person.endereco?.cep || '-'}</span>
                </div>
                <div className="info-item">
                  <label>Número:</label>
                  <span>{person.endereco?.numero || '-'}</span>
                </div>
                <div className="info-item">
                  <label>Complemento:</label>
                  <span>{person.endereco?.complemento || '-'}</span>
                </div>
                <div className="info-item">
                  <label>Bairro:</label>
                  <span>{person.endereco?.bairro || '-'}</span>
                </div>
                <div className="info-item">
                  <label>País:</label>
                  <span>{person.endereco?.pais || '-'}</span>
                </div>
                <div className="info-item">
                  <label>Estado:</label>
                  <span>{person.endereco?.estado || '-'}</span>
                </div>
                <div className="info-item">
                  <label>Município:</label>
                  <span>{person.endereco?.municipio || '-'}</span>
                </div>
              </div>

              <div className="section-column">
                <h3 className="section-title">Empresa</h3>
                <div className="info-item">
                  <label>Nome/Razão:</label>
                  <span>{person.empresa?.razao || '-'}</span>
                </div>
                <div className="info-item">
                  <label>CNPJ:</label>
                  <span>{person.empresa?.cnpj || '-'}</span>
                </div>
                <div className="info-item">
                  <label>Telefone:</label>
                  <span>{person.empresa?.telefone || '-'}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{person.empresa?.email || '-'}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="client-section">
            <div className="status-grid">
              <div className="status-item">
                <label>Situação:</label>
                <span className="status-tag active">{person.situacao || 'Cadastrado'}</span>
              </div>
              <div className="status-item">
                <label>Cliente novo:</label>
                <span className={`status-tag ${person.cliente_novo ? 'active' : 'inactive'}`}>
                  {person.cliente_novo ? 'Sim' : 'Não'}
                </span>
              </div>
              <div className="status-item">
                <label>Hospedado:</label>
                <span className={`status-tag ${person.hospedado ? 'active' : 'inactive'}`}>
                  {person.hospedado ? 'Sim' : 'Não'}
                </span>
              </div>
            </div>
          </section>

          <section className="client-section">
            <div className="section-header">
              <h3 className="section-title">Histórico de Hospedagem</h3>
              <div className="date-range">
                <button 
                  type="button" 
                  className="date-button" 
                  onClick={() => startRef.current?.showPicker?.()}
                >
                  <span className="date-icon">📅</span>
                  {fmtBR(start) || 'Data inicial'}
                </button>
                <span className="date-separator">até</span>
                <button 
                  type="button" 
                  className="date-button" 
                  onClick={() => endRef.current?.showPicker?.()}
                >
                  <span className="date-icon">📅</span>
                  {fmtBR(end) || 'Data final'}
                </button>
                <input ref={startRef} type="date" className="date-input" value={start||''} onChange={e=>setStart(e.target.value)} />
                <input ref={endRef} type="date" className="date-input" value={end||''} onChange={e=>setEnd(e.target.value)} />
              </div>
            </div>

            {groups.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🏨</div>
                <p>Nenhuma hospedagem no período selecionado.</p>
              </div>
            )}

            {groups.map(group => (
              <div key={group.label} className="history-group">
                <div className="group-header">{group.label}</div>
                {group.items.map(stay => (
                  <div key={`${stay.quarto}-${stay.inicio}`} className="stay-card">
                    <div className="stay-header">
                      <div className="stay-info">
                        <div className="stay-room">{stay.quarto}</div>
                        <div className="stay-guest">{stay.titular} - {stay.cpf}</div>
                      </div>
                      <div className="stay-dates">
                        {fmtBR(stay.inicio)} - {fmtBR(stay.fim)}
                      </div>
                    </div>

                    <div className="stay-content">
                      {stay.blocos.map((b, idx) => (
                        <div className={`stay-block ${idx < stay.blocos.length-1 ? 'with-border' : ''}`} key={idx}>
                          <div className="block-left">
                            <div className="block-title">{b.titulo}</div>
                            <div className="block-guest">{stay.titular}</div>

                            {b.itens.map((i, ii) => (
                              <div className="block-item" key={ii}>
                                <div className="item-name">{i.nome}</div>
                                <div className="item-meta">{i.data} • {i.pagamento}</div>
                              </div>
                            ))}
                          </div>
                          <div className="block-right">
                            <div className="block-total">Total: {money(b.total)}</div>
                            <div className="block-values">
                              {b.itens.map((i, ii) => (
                                <div key={ii} className="item-value">{money(i.valor)}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </section>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Fechar
          </button>
          <button className="save-btn" onClick={onClose}>
            Editar Cliente
          </button>
        </div>
      </div>
    </Modal>
  );
}