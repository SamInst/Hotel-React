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
      <div className="client-details">
        <section className="cd-card cd-head">
          <div className="cd-avatar">
            <img className="cd-avatar__img" src={person.avatar} alt="" />
            <button type="button" className="cd-editbtn" onClick={onClose}>Editar Dados</button>
          </div>

          <div className="cd-head__info">
            <h2 className="cd-name">{person.nome}</h2>

            <div className="cd-kvgrid">
              <div className="cd-kvcol">
                <div className="kv"><strong>CPF:</strong><span>{person.cpf || '-'}</span></div>
                <div className="kv"><strong>Telefone:</strong><span>{person.telefone || '-'}</span></div>
                <div className="kv"><strong>Email:</strong><span>{person.email || '-'}</span></div>
              </div>
              <div className="cd-kvcol">
                <div className="kv"><strong>Nascimento:</strong><span>{fmtBR(person.data_nascimento)}{idade!=null ? ` (${idade} anos)` : ''}</span></div>
                <div className="kv"><strong>RG:</strong><span>{person.rg || '-'}</span></div>
                <div className="kv"><strong>Gênero:</strong><span>{sexoLabel}</span></div>
              </div>
            </div>

            <div className="cd-lines">
              <div className="kv"><strong>Nacionalidade:</strong><span>{person.nacionalidade ? `${person.nacionalidade.municipio}, ${person.nacionalidade.estado} , ${person.nacionalidade.pais}` : '-'}</span></div>
              <div className="kv"><strong>Profissão:</strong><span>{person.profissao || '-'}</span></div>
              <div className="kv"><strong>Estado Civil:</strong><span>{person.estado_civil || '-'}</span></div>
            </div>
          </div>
        </section>

        <section className="cd-card cd-split">
          <div>
            <h4>Endereço</h4>
            <div className="kv"><strong>Logradouro:</strong><span>{person.endereco?.logradouro || '-'}</span></div>
            <div className="kv"><strong>CEP:</strong><span>{person.endereco?.cep || '-'}</span><strong className="kv__sep">Número:</strong><span>{person.endereco?.numero || '-'}</span></div>
            <div className="kv"><strong>Complemento:</strong><span>{person.endereco?.complemento || '-'}</span></div>
            <div className="kv"><strong>Bairro:</strong><span>{person.endereco?.bairro || '-'}</span></div>
            <div className="kv"><strong>País:</strong><span>{person.endereco?.pais || '-'}</span></div>
            <div className="kv"><strong>Estado:</strong><span>{person.endereco?.estado || '-'}</span></div>
            <div className="kv"><strong>Município:</strong><span>{person.endereco?.municipio || '-'}</span></div>
          </div>

          <div>
            <h4>Empresa</h4>
            <div className="kv"><strong>Nome/Razao:</strong><span>{person.empresa?.razao || '-'}</span></div>
            <div className="kv"><strong>CNPJ:</strong><span>{person.empresa?.cnpj || '-'}</span></div>
            <div className="kv"><strong>Telefone:</strong><span>{person.empresa?.telefone || '-'}</span></div>
            <div className="kv"><strong>Email:</strong><span>{person.empresa?.email || '-'}</span></div>
          </div>
        </section>

        <section className="cd-card cd-statusbar">
          <div>Situacao: <span className="pill pill--ok">{person.situacao || 'Cadastrado'}</span></div>
          <div>Cliente novo: <span className={person.cliente_novo ? 'pill pill--ok' : 'pill'}>{person.cliente_novo ? 'Sim' : 'Não'}</span></div>
          <div>Hospedado: <span className={person.hospedado ? 'pill pill--ok' : 'pill pill--danger'}>{person.hospedado ? 'Sim' : 'Não'}</span></div>
        </section>

        <section className="cd-card cd-history">
          <div className="cd-history__header">
            <h3>Histórico de hospedagem</h3>
            <div className="drange">
              <button type="button" className="drange__icon" onClick={()=>startRef.current?.showPicker?.()}>📅</button>
              <button type="button" className="drange__chip" onClick={()=>startRef.current?.showPicker?.()}>{fmtBR(start)}</button>
              <button type="button" className="drange__chip" onClick={()=>endRef.current?.showPicker?.()}>{fmtBR(end)}</button>
              <input ref={startRef} type="date" className="drange__input" value={start||''} onChange={e=>setStart(e.target.value)} />
              <input ref={endRef} type="date" className="drange__input" value={end||''} onChange={e=>setEnd(e.target.value)} />
            </div>
          </div>

          {groups.length === 0 && (
            <div className="cd-history__empty">Nenhuma hospedagem no período.</div>
          )}

          {groups.map(group => (
            <div key={group.label}>
              <div className="cd-history__month">{group.label}</div>
              {group.items.map(stay => (
                <div key={`${stay.quarto}-${stay.inicio}`} className="stay-card">
                  <div className="stay-card__head">
                    <div className="stay-card__room">
                      <div className="stay-card__roomtitle">{stay.quarto}</div>
                      <div className="stay-card__guest">{stay.titular} - {stay.cpf}</div>
                    </div>
                    <div className="stay-card__range">{fmtBR(stay.inicio)} - {fmtBR(stay.fim)}</div>
                  </div>

                  <div className="stay-card__body">
                    {stay.blocos.map((b, idx) => (
                      <div className={`stay-block ${idx < stay.blocos.length-1 ? 'stay-block--div' : ''}`} key={idx}>
                        <div className="stay-block__left">
                          <div className="stay-block__title">{b.titulo}</div>
                          <div className="stay-block__guest">{stay.titular}</div>

                          {b.itens.map((i, ii) => (
                            <div className="stay-line" key={ii}>
                              <div className="stay-line__title">{i.nome}</div>
                              <div className="stay-line__meta">{i.data} {i.pagamento}</div>
                            </div>
                          ))}
                        </div>
                        <div className="stay-block__right">
                          <div className="stay-block__total">Total: {money(b.total)}</div>
                          <div className="stay-block__values">
                            {b.itens.map((i,ii)=><div key={ii}>{money(i.valor)}</div>)}
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
    </Modal>
  );
}
