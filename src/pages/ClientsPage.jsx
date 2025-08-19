// src/pages/ClientsPage.jsx
import React, { useMemo, useState } from 'react';
import { PAISES, ESTADOS, MUNICIPIOS } from '../data/geo.js';
import { PEOPLE } from '../data/people.js';
import { ClientDetailsModal } from '../components/ClientDetailsModal.jsx';

const SEXO_OPTIONS = [
  { value: 1, label: 'Masculino' },
  { value: 2, label: 'Feminino' },
  { value: 3, label: 'Outro' }
];

function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function onlyDigits(s) {
  return (s || '').replace(/\D/g, '');
}

export function ClientsPage() {
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

  const [qNome, setQNome] = useState('');
  const [qCpf, setQCpf] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

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
      numero: form.numero
    };
    console.log('payload pessoa =>', payload);
    alert('Dados prontos para enviar (veja o console).');
  };

  const filteredPeople = useMemo(() => {
    const name = qNome.trim().toLowerCase();
    const cpf = onlyDigits(qCpf);
    return PEOPLE.filter(p => {
      const matchName = !name || p.nome.toLowerCase().includes(name);
      const matchCpf = !cpf || onlyDigits(p.cpf).includes(cpf);
      return matchName && matchCpf;
    });
  }, [qNome, qCpf]);

  const openDetails = (p) => { setSelected(p); setDetailsOpen(true); };

  return (
    <div className="clients-layout">
      <form className="form-page clients-card" onSubmit={submit}>
        <section className="form-card" style={{boxShadow:'none', padding:0}}>
          <h3 className="form-card__title">Dados Pessoais</h3>

          <div className="form-grid">
            <div className="avatar col-2">
              <div className="avatar__circle" />
            </div>

            <div className="field col-4">
              <label>Nome Completo</label>
              <input className="control" value={form.nome} onChange={e=>setField('nome', e.target.value)} />
            </div>

            <div className="field col-3">
              <label>CPF</label>
              <input className="control" value={form.cpf} onChange={e=>setField('cpf', e.target.value)} />
            </div>

            <div className="field col-3">
              <label>RG</label>
              <input className="control" value={form.rg} onChange={e=>setField('rg', e.target.value)} />
            </div>

            <div className="field col-6">
              <label>Email</label>
              <input className="control" type="email" value={form.email} onChange={e=>setField('email', e.target.value)} />
            </div>

            <div className="field col-3">
              <label>Data Nascimento</label>
              <input className="control" type="date" value={form.data_nascimento} onChange={e=>setField('data_nascimento', e.target.value)} />
            </div>

            <div className="field col-3">
              <label>Gênero</label>
              <select className="control" value={form.sexo} onChange={e=>setField('sexo', e.target.value)}>
                {SEXO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="field col-4">
              <label>Nacionalidade (País)</label>
              <select className="control" value={form.fk_pais} onChange={onChangePais}>
                {PAISES.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            <div className="field col-4">
              <label>Estado (Nacionalidade)</label>
              <select className="control" value={form.fk_estado} onChange={onChangeEstado}>
                {estadosFiltrados.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>

            <div className="field col-4">
              <label>Município (Nacionalidade)</label>
              <select className="control" value={form.fk_municipio} onChange={e=>setField('fk_municipio', Number(e.target.value))}>
                {municipiosFiltrados.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>

            <div className="field col-4">
              <label>Telefone</label>
              <input className="control" value={form.telefone} onChange={e=>setField('telefone', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="form-card" style={{boxShadow:'none', padding:0, marginTop:12}}>
          <h3 className="form-card__title">Endereço</h3>

          <div className="form-grid">
            <div className="field col-3">
              <label>CEP</label>
              <input className="control" value={form.cep} onChange={e=>setField('cep', e.target.value)} />
            </div>

            <div className="field col-9">
              <label>Logradouro</label>
              <input className="control" value={form.endereco} onChange={e=>setField('endereco', e.target.value)} />
            </div>

            <div className="field col-6">
              <label>Complemento</label>
              <input className="control" value={form.complemento} onChange={e=>setField('complemento', e.target.value)} />
            </div>

            <div className="field col-4">
              <label>Bairro</label>
              <input className="control" value={form.bairro} onChange={e=>setField('bairro', e.target.value)} />
            </div>

            <div className="field col-2">
              <label>Número</label>
              <input className="control" value={form.numero} onChange={e=>setField('numero', e.target.value)} />
            </div>

            <div className="field col-4">
              <label>País</label>
              <select className="control" value={form.fk_pais} onChange={onChangePais}>
                {PAISES.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            <div className="field col-4">
              <label>Estado</label>
              <select className="control" value={form.fk_estado} onChange={onChangeEstado}>
                {estadosFiltrados.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>

            <div className="field col-4">
              <label>Município</label>
              <select className="control" value={form.fk_municipio} onChange={e=>setField('fk_municipio', Number(e.target.value))}>
                {municipiosFiltrados.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--muted" onClick={clear}>Limpar Campos</button>
            <button type="submit" className="btn btn--primary">Cadastrar Pessoa</button>
          </div>
        </section>
      </form>

      <aside className="clients-card">
        <h3 className="form-card__title" style={{marginBottom:10}}>Cadastrados</h3>

        <div className="clients-filter">
          <div className="field">
            <label>Nome:</label>
            <input className="control" placeholder="Buscar por nome" value={qNome} onChange={e=>setQNome(e.target.value)} />
          </div>
          <div className="field">
            <label>CPF:</label>
            <input className="control" placeholder="Buscar por CPF" value={qCpf} onChange={e=>setQCpf(e.target.value)} />
          </div>
        </div>

        <div className="clients-table">
          <div className="clients-thead">
            <div>Cliente</div>
            <div style={{textAlign:'right'}}>Última Hospedagem</div>
          </div>

          <div className="clients-list">
            {filteredPeople.map(p => (
              <button
                key={p.id}
                type="button"
                className="client-row client-row--button"
                onClick={()=>openDetails(p)}
              >
                <div className="client-main">
                  <img className="client-avatar" src={p.avatar} alt="" />
                  <div>
                    <div className="client-name">{p.nome}</div>
                    <div className="client-phone">Telefone: {p.telefone}</div>
                  </div>
                </div>
                <div className="client-dates">
                  {fmtDate(p.ultimaHospedagemInicio)} - {fmtDate(p.ultimaHospedagemFim)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <ClientDetailsModal
        open={detailsOpen}
        onClose={()=>setDetailsOpen(false)}
        person={selected}
      />
    </div>
  );
}
