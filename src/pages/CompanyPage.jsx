import React, { useMemo, useState } from 'react';
import { PEOPLE } from '../data/people.js';
import { COMPANIES } from '../data/companies.js';
import { CompanyDetailsModal } from '../components/CompanyDetailsModal.jsx';

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

export default function CompanyPage(){
  const [form, setForm] = useState(initialForm);
  const [companies, setCompanies] = useState(COMPANIES);
  const [q, setQ] = useState('');
  const [linkQuery, setLinkQuery] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if(!s) return companies;
    return companies.filter(c =>
      c.nome_empresa.toLowerCase().includes(s) ||
      c.cnpj.toLowerCase().includes(s)
    );
  }, [q, companies]);

  const linkCandidates = useMemo(()=>{
    const s = linkQuery.trim().toLowerCase();
    if(!s) return [];
    const sDigits = s.replace(/\D/g,'');
    return PEOPLE.filter(p =>
      p.nome.toLowerCase().includes(s) ||
      (p.cpf || '').replace(/\D/g,'').includes(sDigits)
    );
  }, [linkQuery]);

  async function handleCepBlur(){
    const cepDigits = (form.cep || '').replace(/\D/g,'');
    if(cepDigits.length !== 8) return;
    try{
      const r = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await r.json();
      if(data?.erro) return;
      setForm(f => ({
        ...f,
        cep: data.cep || f.cep,
        endereco: data.logradouro || f.endereco,
        bairro: data.bairro || f.bairro,
        municipio: data.localidade || f.municipio,
        estado: data.estado || UF_TO_NOME[data.uf] || f.estado,
        pais: 'Brasil'
      }));
    }catch(e){}
  }

  function onChange(k, v){ setForm(f => ({...f, [k]: v})); }
  function addLinked(p){
    setForm(f => f.vinculados.find(x=>x.id===p.id) ? f : ({...f, vinculados:[...f.vinculados, p]}));
  }
  function removeLinked(id){
    setForm(f => ({...f, vinculados: f.vinculados.filter(x=>x.id!==id)}));
  }
  function submit(){
    const novo = {
      id: Math.max(0, ...companies.map(c=>c.id))+1,
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
    setCompanies([novo, ...companies]);
    setForm(initialForm);
    setLinkQuery('');
  }

  return (
    <div className="clients-layout">
      <div className="form-stack">
        <div className="form-card">
          <h3 className="form-card__title">Dados Empresariais</h3>
          <div className="form-grid">
            <div className="col-12 field">
              <label>Nome/Razao Social</label>
              <input className="control" value={form.nome_empresa} onChange={e=>onChange('nome_empresa', e.target.value)} />
            </div>
            <div className="col-6 field">
              <label>Email</label>
              <input className="control" value={form.email} onChange={e=>onChange('email', e.target.value)} />
            </div>
            <div className="col-3 field">
              <label>CNPJ</label>
              <input className="control" value={form.cnpj} onChange={e=>onChange('cnpj', e.target.value)} />
            </div>
            <div className="col-3 field">
              <label>Telefone</label>
              <input className="control" value={form.telefone} onChange={e=>onChange('telefone', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-card__title">Endereço</h3>
          <div className="form-grid">
            <div className="col-3 field">
              <label>CEP</label>
              <input
                className="control"
                value={form.cep}
                onChange={e=>onChange('cep', e.target.value)}
                onBlur={handleCepBlur}
                placeholder="00000000"
              />
            </div>
            <div className="col-9 field">
              <label>Logradouro</label>
              <input className="control" value={form.endereco} onChange={e=>onChange('endereco', e.target.value)} />
            </div>
            <div className="col-6 field">
              <label>Complemento</label>
              <input className="control" value={form.complemento} onChange={e=>onChange('complemento', e.target.value)} />
            </div>
            <div className="col-3 field">
              <label>Bairro</label>
              <input className="control" value={form.bairro} onChange={e=>onChange('bairro', e.target.value)} />
            </div>
            <div className="col-3 field">
              <label>Número</label>
              <input className="control" value={form.numero} onChange={e=>onChange('numero', e.target.value)} />
            </div>
            <div className="col-4 field">
              <label>Pais</label>
              <input className="control" value={form.pais} onChange={e=>onChange('pais', e.target.value)} />
            </div>
            <div className="col-4 field">
              <label>Estado</label>
              <input className="control" value={form.estado} onChange={e=>onChange('estado', e.target.value)} />
            </div>
            <div className="col-4 field">
              <label>Município</label>
              <input className="control" value={form.municipio} onChange={e=>onChange('municipio', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-card__title">Vincular Pessoa</h3>
          <div className="field">
            <label>Nome ou CPF</label>
            <input
              className="control"
              placeholder="Pesquisar..."
              value={linkQuery}
              onChange={e=>setLinkQuery(e.target.value)}
            />
          </div>

          {linkCandidates.length > 0 && (
            <div className="clients-table" style={{marginTop:12}}>
              <div className="clients-thead" style={{gridTemplateColumns:'1fr 120px'}}>
                <div>Nome</div>
                <div>CPF</div>
              </div>
              <div>
                {linkCandidates.map(p => (
                  <button
                    key={p.id}
                    className="client-row client-row--button"
                    style={{gridTemplateColumns:'1fr 120px'}}
                    onClick={()=>addLinked(p)}
                  >
                    <div className="client-main">
                      <img className="client-avatar" src={p.avatar} alt="" />
                      <div className="client-name">{p.nome}</div>
                    </div>
                    <div className="client-dates">{p.cpf || '—'}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.vinculados.length > 0 && (
            <div className="clients-table" style={{marginTop:12}}>
              <div className="clients-thead" style={{gridTemplateColumns:'1fr 120px 40px'}}>
                <div>Nome</div><div>CPF</div><div></div>
              </div>
              <div>
                {form.vinculados.map(p => (
                  <div key={p.id} className="client-row" style={{gridTemplateColumns:'1fr 120px 40px'}}>
                    <div className="client-main">
                      <img className="client-avatar" src={p.avatar} alt="" />
                      <div className="client-name">{p.nome}</div>
                    </div>
                    <div className="client-dates">{p.cpf || '—'}</div>
                    <button className="btn btn--danger" onClick={()=>removeLinked(p.id)}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button className="btn" onClick={()=>{setForm(initialForm); setLinkQuery('');}}>Limpar Campos</button>
            <button className="btn btn--primary" onClick={submit}>Cadastrar Empresa</button>
          </div>
        </div>
      </div>

      <aside>
        <div className="clients-card">
          <h3 className="form-card__title">Cadastrados</h3>
          <div className="clients-filter">
            <input className="control" placeholder="Nome/CNPJ" value={q} onChange={e=>setQ(e.target.value)} />
          </div>
          <div className="clients-table">
            <div className="clients-thead">
              <div>Empresa</div>
              <div>CNPJ</div>
            </div>
            <div>
              {filtered.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className="client-row client-row--button"
                  onClick={()=>{setSelected(c); setDetailsOpen(true);}}
                >
                  <div className="client-main">
                    <img className="client-avatar" src="https://cdn-icons-png.flaticon.com/128/1040/1040238.png" alt="" />
                    <div>
                      <div className="client-name">{c.nome_empresa}</div>
                      <div className="client-phone">{c.email || c.telefone || '—'}</div>
                    </div>
                  </div>
                  <div className="client-dates">{c.cnpj}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <CompanyDetailsModal
        open={detailsOpen}
        onClose={()=>setDetailsOpen(false)}
        company={selected}
      />
    </div>
  );
}
