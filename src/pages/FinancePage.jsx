// src/pages/FinancePage.jsx
import React, { useMemo, useState } from 'react';
import { FINANCE } from '../data/finance.js';
import { Modal } from '../components/Modal.jsx';

const money = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const dLabel = iso => new Date(iso).toLocaleDateString('pt-BR');
const nowDate = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
};
const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const TP = [
  { value: 1, label: 'PAGAMENTO VIA DINHEIRO' },
  { value: 2, label: 'PAGAMENTO VIA CARTÃO DE CRÉDITO' },
  { value: 3, label: 'PAGAMENTO VIA PIX' },
  { value: 4, label: 'PAGAMENTO VIA CARTÃO DE DÉBITO' },
  { value: 5, label: 'TRANSFERÊNCIA' }
];

const STATUS_OPTS = [
  { value: 'all', label: 'Todos' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CRÉDITO', label: 'Cartão de Crédito' },
  { value: 'DÉBITO', label: 'Cartão de Débito' },
  { value: 'TRANSFER', label: 'Transferência' },
];

function ReportDetailsModal({ open, onClose, item }) {
  if (!open || !item) return null;
  const positive = item.amount >= 0;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="form-card" style={{boxShadow:'none', padding:0}}>
        <h3 className="form-card__title">Detalhes do Relatório</h3>
        <div className="form-grid" style={{marginBottom:8}}>
          <div className="field col-6">
            <label>Data</label>
            <input className="control" value={dLabel(item.date)} readOnly />
          </div>
          <div className="field col-6">
            <label>Hora</label>
            <input className="control" value={item.time} readOnly />
          </div>
          <div className="field col-12">
            <label>Descrição</label>
            <input className="control" value={item.title} readOnly />
          </div>
          <div className="field col-6">
            <label>Tipo de Pagamento</label>
            <input className="control" value={item.payment} readOnly />
          </div>
          <div className="field col-3">
            <label>Quarto</label>
            <input className="control" value={item.apt ?? '—'} readOnly />
          </div>
          <div className="field col-3">
            <label>Valor</label>
            <input className="control" style={{fontWeight:700, color: positive ? '#16a34a' : '#dc2626'}} value={`${positive?'+ ':''}${money(item.amount)}`} readOnly />
          </div>
          <div className="field col-12">
            <label>ID</label>
            <input className="control" value={`#${item.id}`} readOnly />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </Modal>
  );
}

export default function FinancePage(){
  const [items, setItems] = useState(FINANCE);
  const [collapsed, setCollapsed] = useState(new Set());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ relatorio:'', tipo_pagamento_enum:1, valor:'', quarto_id:'' });

  const [dateOpen, setDateOpen] = useState(false);
  const [fStart, setFStart] = useState('');
  const [fEnd, setFEnd] = useState('');

  const [statusOpen, setStatusOpen] = useState(false);
  const [payFilter, setPayFilter] = useState('all');

  const [hoverId, setHoverId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showRun, setShowRun] = useState(false);

  const filtered = useMemo(()=>{
    let arr = items;
    if (fStart) arr = arr.filter(i => i.date >= fStart);
    if (fEnd)   arr = arr.filter(i => i.date <= fEnd);
    if (payFilter !== 'all') {
      const key = payFilter.toUpperCase();
      arr = arr.filter(i => (i.payment || '').toUpperCase().includes(key));
    }
    return arr;
  }, [items, fStart, fEnd, payFilter]);

  const balance = useMemo(()=> filtered.reduce((s,i)=>s+i.amount,0), [filtered]);

  const groups = useMemo(()=>{
    const by = {};
    for(const r of filtered){
      if(!by[r.date]) by[r.date] = [];
      by[r.date].push(r);
    }
    const arr = Object.entries(by).map(([date, rows])=>{
      rows.sort((a,b)=>a.time.localeCompare(b.time));
      const total = rows.reduce((s,i)=>s+i.amount,0);
      return { date, rows, total };
    });
    arr.sort((a,b)=>b.date.localeCompare(a.date));
    return arr;
  },[filtered]);

  function toggle(date){
    const s = new Set(collapsed);
    s.has(date) ? s.delete(date) : s.add(date);
    setCollapsed(s);
  }

  function onChange(k,v){ setForm(f=>({...f,[k]:v})); }

  function save(){
    const v = Number(form.valor);
    if (!form.relatorio || Number.isNaN(v)) return;
    const id = Math.max(0, ...items.map(i=>i.id)) + 1;
    const payment = TP.find(t=>t.value===Number(form.tipo_pagamento_enum))?.label || '';
    const novo = {
      id,
      date: nowDate(),
      time: nowTime(),
      title: form.relatorio,
      payment,
      amount: v,
      apt: form.quarto_id ? Number(form.quarto_id) : undefined
    };
    setItems([novo, ...items]);
    setOpen(false);
    setForm({ relatorio:'', tipo_pagamento_enum:1, valor:'', quarto_id:'' });
  }

  const openDetails = (it) => { setSelected(it); setDetailsOpen(true); };

  return (
    <>
      <div className="fin">
        <div className="fin-toolbar">
          <button type="button" className="fin-btn fin-btn--primary" onClick={()=>setOpen(true)}>+ Adicionar Relatório</button>
          <button type="button" className="fin-btn" onClick={()=>setDateOpen(true)}>Buscar por data</button>
          <button type="button" className="fin-btn" onClick={()=>setStatusOpen(true)}>Filtrar pagamento</button>
          <div
            className="fin-sum"
            role="button"
            title={showRun ? 'Ocultar saldo por lançamento' : 'Mostrar saldo por lançamento'}
            onClick={()=>setShowRun(s=>!s)}
            style={{cursor:'pointer'}}
          >
            Saldo {money(balance)}
          </div>
        </div>

        {groups.map(g=>(
          <div key={g.date} className="fin-card">
            <button type="button" className="fin-datebar" onClick={()=>toggle(g.date)}>
              <span className="fin-datebar__date">{dLabel(g.date)}</span>
              <span className="fin-datebar__total">Total do dia {money(g.total)}</span>
            </button>

            {!collapsed.has(g.date) && (()=> {
              let dayRun = 0;
              return g.rows.map((it, idx) => {
                const hovered = hoverId === it.id;
                const prev = dayRun;
                dayRun += it.amount;
                const arrow = dayRun > prev ? '▲' : dayRun < prev ? '▼' : '•';
                const arrowColor = dayRun > prev ? '#16a34a' : dayRun < prev ? '#dc2626' : '#6b7280';
                return (
                  <div
                    key={it.id+'-'+idx}
                    className="fin-row"
                    role="button"
                    tabIndex={0}
                    onClick={()=>openDetails(it)}
                    onMouseEnter={()=>setHoverId(it.id)}
                    onMouseLeave={()=>setHoverId(null)}
                    style={{
                      cursor:'pointer',
                      transition:'background .15s ease, box-shadow .15s ease, transform .06s ease',
                      background: hovered ? '#f7f8fb' : '#fff',
                      boxShadow: hovered ? '0 2px 6px rgba(0,0,0,.08), inset 0 0 0 1px #e6e8eb' : '0 1px 0 rgba(0,0,0,.04), inset 0 0 0 1px #e6e8eb',
                      transform: hovered ? 'translateY(-1px)' : 'none'
                    }}
                  >
                    <div className="fin-apt">
                      <span className="fin-badge">{it.apt ?? '—'}</span>
                    </div>
                    <div className="fin-time">{it.time}</div>
                    <div className="fin-desc">
                      <div className="fin-title">{it.title}</div>
                      <div className="fin-sub">{it.payment} <span className="fin-id">#{it.id}</span></div>
                    </div>
                    <div className={['fin-value', it.amount>=0?'fin-value--in':'fin-value--out'].join(' ')}>
                      {it.amount>=0?'+ ':''}{money(it.amount)}
                      {showRun && (
                        <span style={{marginLeft:10, fontWeight:700, color:'#374151', display:'inline-flex', alignItems:'center', gap:6}}>
                          = {money(dayRun)} <span style={{color:arrowColor}}>{arrow}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ))}
      </div>

      <Modal open={open} onClose={()=>setOpen(false)}>
        <div className="form-card" style={{boxShadow:'none', padding:0}}>
          <h3 className="form-card__title">Novo Relatório</h3>
          <div className="form-grid">
            <div className="field col-12">
              <label>Descrição</label>
              <input className="control" value={form.relatorio} onChange={e=>onChange('relatorio', e.target.value)} />
            </div>
            <div className="field col-3">
              <label>Valor</label>
              <input className="control" type="number" step="0.01" value={form.valor} onChange={e=>onChange('valor', e.target.value)} placeholder="Ex.: 50 ou -5" />
            </div>
            <div className="field col-6">
              <label>Tipo de Pagamento</label>
              <select className="control" value={form.tipo_pagamento_enum} onChange={e=>onChange('tipo_pagamento_enum', Number(e.target.value))}>
                {TP.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="field col-3">
              <label>Quarto (opcional)</label>
              <input className="control" type="number" placeholder="Ex.: 7" value={form.quarto_id} onChange={e=>onChange('quarto_id', e.target.value)} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn" onClick={()=>setOpen(false)}>Cancelar</button>
            <button className="btn btn--primary" onClick={save}>Salvar</button>
          </div>
        </div>
      </Modal>

      <Modal open={dateOpen} onClose={()=>setDateOpen(false)}>
        <div className="form-card" style={{boxShadow:'none', padding:0}}>
          <h3 className="form-card__title">Buscar por data</h3>
          <div className="form-grid">
            <div className="field col-6">
              <label>Data inicial</label>
              <input className="control" type="date" value={fStart} onChange={e=>setFStart(e.target.value)} />
            </div>
            <div className="field col-6">
              <label>Data final</label>
              <input className="control" type="date" value={fEnd} onChange={e=>setFEnd(e.target.value)} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn" onClick={()=>{setFStart('');setFEnd('');setDateOpen(false)}}>Limpar</button>
            <button className="btn btn--primary" onClick={()=>setDateOpen(false)}>Aplicar</button>
          </div>
        </div>
      </Modal>

      <Modal open={statusOpen} onClose={()=>setStatusOpen(false)}>
        <div className="form-card" style={{boxShadow:'none', padding:0}}>
          <h3 className="form-card__title">Filtrar por pagamento</h3>
          <div className="form-grid">
            <div className="field col-12">
              <label>Status do pagamento</label>
              <select className="control" value={payFilter} onChange={e=>setPayFilter(e.target.value)}>
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn" onClick={()=>{setPayFilter('all');setStatusOpen(false)}}>Limpar</button>
            <button className="btn btn--primary" onClick={()=>setStatusOpen(false)}>Aplicar</button>
          </div>
        </div>
      </Modal>

      <ReportDetailsModal open={detailsOpen} onClose={()=>setDetailsOpen(false)} item={selected} />
    </>
  );
}
