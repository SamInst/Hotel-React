// src/pages/FinancePage.jsx
import React, { useMemo, useState } from 'react';
import { FINANCE } from '../data/finance.js';
import { Modal } from '../components/Modal.jsx';
import './FinancePage.css';

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
      <div className="modern-modal">
        <div className="modern-modal-header">
          <h3>Detalhes do Lançamento</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        <div className="modern-modal-body">
          <div className="details-grid">
            <div className="detail-item">
              <label>Data</label>
              <span>{dLabel(item.date)}</span>
            </div>
            <div className="detail-item">
              <label>Hora</label>
              <span>{item.time}</span>
            </div>
            <div className="detail-item full-width">
              <label>Descrição</label>
              <span>{item.title}</span>
            </div>
            <div className="detail-item">
              <label>Tipo de Pagamento</label>
              <span>{item.payment}</span>
            </div>
            <div className="detail-item">
              <label>Quarto</label>
              <span>{item.apt ?? '—'}</span>
            </div>
            <div className="detail-item">
              <label>Valor</label>
              <span className={`amount ${positive ? 'positive' : 'negative'}`}>
                {positive ? '+ ' : ''}{money(item.amount)}
              </span>
            </div>
            <div className="detail-item full-width">
              <label>ID</label>
              <span>#{item.id}</span>
            </div>
          </div>
        </div>
        
        <div className="modern-modal-footer">
          <button className="button secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </Modal>
  );
}

export default function FinancePage(){
  const [items, setItems] = useState(FINANCE);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ relatorio:'', tipo_pagamento_enum:1, valor:'', quarto_id:'' });

  const [dateOpen, setDateOpen] = useState(false);
  const [fStart, setFStart] = useState('');
  const [fEnd,   setFEnd]   = useState('');

  const [statusOpen, setStatusOpen] = useState(false);
  const [payFilter, setPayFilter]   = useState('all');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [showRun,     setShowRun]     = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

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

  const filterConfig = {
    all: { label: 'Todos',    count: 0, color: 'gray'  },
    income:{ label: 'Receitas',count: 0, color: 'green' },
    expense:{ label: 'Despesas',count:0, color: 'red'   },
    today:{ label: 'Hoje',    count: 0, color: 'blue'  }
  };

  const { filteredByType, filters } = useMemo(() => {
    const counts = { ...filterConfig };
    const today = nowDate();

    // Contagem
    filtered.forEach((item) => {
      counts.all.count++;
      if (item.amount >= 0) counts.income.count++;
      else counts.expense.count++;
      if (item.date === today) counts.today.count++;
    });

    // Filtro por tipo
    let filteredArray = filtered;
    if (activeFilter === 'income') {
      filteredArray = filtered.filter(item => item.amount >= 0);
    } else if (activeFilter === 'expense') {
      filteredArray = filtered.filter(item => item.amount < 0);
    } else if (activeFilter === 'today') {
      filteredArray = filtered.filter(item => item.date === today);
    }

    return { filteredByType: filteredArray, filters: counts };
  }, [filtered, activeFilter]);

  const groups = useMemo(()=>{
    const by = {};
    for(const r of filteredByType){
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
  },[filteredByType]);

  // ✅ Lista de quartos para o select (começa com "nenhum")
  const availableRooms = useMemo(() => {
    const set = new Set(items.map(i => i.apt).filter(Boolean));
    let list = Array.from(set)
      .sort((a,b) => Number(a) - Number(b))
      .map(n => ({ value: String(n), label: `Quarto ${String(n).padStart(2,'0')}` }));

    // Fallback se ainda não houver nenhum lançamento com apt definido
    if (list.length === 0) {
      list = Array.from({ length: 20 }, (_, i) => {
        const n = i + 1;
        return { value: String(n), label: `Quarto ${String(n).padStart(2,'0')}` };
      });
    }

    // Primeira opção = nenhum selecionado
    return [{ value: '', label: '— Nenhum —' }, ...list];
  }, [items]);

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
    <div className="finance-page">
      <div className="finance-header">
        <h1 className="finance-title">Relatório Financeiro</h1>
        <button className="add-button" onClick={() => setOpen(true)}>
          <span className="add-icon">+</span>
          Adicionar Lançamento
        </button>
      </div>

      <div className="finance-controls">
        <div className="balance-container">
          <div 
            className="balance-card"
            onClick={() => setShowRun(s => !s)}
            title={showRun ? 'Ocultar saldo por lançamento' : 'Mostrar saldo por lançamento'}
          >
            <span className="balance-label">Saldo Total</span>
            <span className={`balance-value ${balance >= 0 ? 'positive' : 'negative'}`}>
              {money(balance)}
            </span>
          </div>
        </div>

        <div className="date-filters">
          <div className="filter-group" onClick={() => setDateOpen(true)}>
            <span className="filter-icon">📅</span>
            <span>Filtrar por Data</span>
          </div>
          <div className="filter-group" onClick={() => setStatusOpen(true)}>
            <span className="filter-icon">💳</span>
            <span>Tipo de Pagamento</span>
          </div>
        </div>
      </div>

      <div className="filter-tabs">
        {Object.entries(filters).map(([key, config]) => (
          <button
            key={key}
            className={`filter-tab ${activeFilter === key ? 'active' : ''} ${config.color}`}
            onClick={() => setActiveFilter(key)}
          >
            <span className="filter-icon">
              {key === 'all' && '📊'}
              {key === 'income' && '📈'}
              {key === 'expense' && '📉'}
              {key === 'today' && '📅'}
            </span>
            {config.label}
            <span className="filter-count">{config.count}</span>
          </button>
        ))}
      </div>

      <div className="finance-content">
        {groups.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum lançamento encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          groups.map(g => (
            <div key={g.date} className="finance-day-card">
              <div className="day-header">
                <div className="day-info">
                  <h3 className="day-date">{dLabel(g.date)}</h3>
                  <span className="day-count">{g.rows.length} lançamento(s)</span>
                </div>
                <div className={`day-total ${g.total >= 0 ? 'positive' : 'negative'}`}>
                  {g.total >= 0 ? '+ ' : ''}{money(g.total)}
                </div>
              </div>

              <div className="transactions-list">
                {(() => {
                  let dayRun = 0;
                  return g.rows.map((item) => {
                    const prev = dayRun;
                    dayRun += item.amount;
                    const arrow = dayRun > prev ? '▲' : dayRun < prev ? '▼' : '•';
                    const arrowColor = dayRun > prev ? '#16a34a' : dayRun < prev ? '#dc2626' : '#6b7280';
                    
                    return (
                      <div
                        key={item.id}
                        className="transaction-card"
                        onClick={() => openDetails(item)}
                      >
                        <div className="transaction-room">
                          <span className="room-badge">{item.apt ?? '—'}</span>
                        </div>

                        <div className="transaction-info">
                          <h4 className="transaction-title">{item.title}</h4>
                          <p className="transaction-details">
                            {item.time} • {item.payment} • #{item.id}
                          </p>
                        </div>

                        <div className="transaction-amount">
                          <span className={`amount ${item.amount >= 0 ? 'positive' : 'negative'}`}>
                            {item.amount >= 0 ? '+ ' : ''}{money(item.amount)}
                          </span>
                          {showRun && (
                            <span className="running-balance">
                              = {money(dayRun)} <span style={{color: arrowColor}}>{arrow}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Adicionar Lançamento */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="form-card" style={{boxShadow:'none', padding:0}}>
          <h3 className="form-card__title">Novo Lançamento</h3>
          <div className="form-grid">
            <div className="field col-12">
              <label>Descrição</label>
              <input 
                className="control" 
                value={form.relatorio} 
                onChange={e => onChange('relatorio', e.target.value)}
                placeholder="Descreva o lançamento..."
              />
            </div>
            
            <div className="field col-6">
              <label>Valor</label>
              <input 
                className="control" 
                type="text"
                value={form.valor} 
                onChange={e => onChange('valor', e.target.value)} 
                placeholder="R$ 0,00 (use - para despesas)"
                style={{ fontWeight: '600' }}
              />
            </div>
            
            <div className="field col-6">
              <label>Quarto (opcional)</label>
              <select 
                className="control" 
                value={form.quarto_id} 
                onChange={e => onChange('quarto_id', e.target.value)}
              >
                {availableRooms.map(room => (
                  <option key={room.value} value={room.value}>{room.label}</option>
                ))}
              </select>
            </div>
            
            <div className="field col-12">
              <label>Tipo de Pagamento</label>
              <select 
                className="control" 
                value={form.tipo_pagamento_enum} 
                onChange={e => onChange('tipo_pagamento_enum', Number(e.target.value))}
              >
                {TP.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn--primary" onClick={save}>Salvar</button>
          </div>
        </div>
      </Modal>

      {/* Modal Filtro por Data */}
      <Modal open={dateOpen} onClose={() => setDateOpen(false)}>
        <div className="form-card" style={{boxShadow:'none', padding:0}}>
          <h3 className="form-card__title">Filtrar por Data</h3>
          <div className="form-grid">
            <div className="field col-6">
              <label>Data inicial</label>
              <input 
                className="control" 
                type="date" 
                value={fStart} 
                onChange={e => setFStart(e.target.value)} 
              />
            </div>
            <div className="field col-6">
              <label>Data final</label>
              <input 
                className="control" 
                type="date" 
                value={fEnd} 
                onChange={e => setFEnd(e.target.value)} 
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn" onClick={() => {setFStart('');setFEnd('');setDateOpen(false)}}>Limpar</button>
            <button className="btn btn--primary" onClick={() => setDateOpen(false)}>Aplicar</button>
          </div>
        </div>
      </Modal>

      {/* Modal Filtro por Pagamento */}
      <Modal open={statusOpen} onClose={() => setStatusOpen(false)}>
        <div className="form-card" style={{boxShadow:'none', padding:0}}>
          <h3 className="form-card__title">Filtrar por Pagamento</h3>
          <div className="form-grid">
            <div className="field col-12">
              <label>Tipo de Pagamento</label>
              <select 
                className="control" 
                value={payFilter} 
                onChange={e => setPayFilter(e.target.value)}
              >
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn" onClick={() => {setPayFilter('all');setStatusOpen(false)}}>Limpar</button>
            <button className="btn btn--primary" onClick={() => setStatusOpen(false)}>Aplicar</button>
          </div>
        </div>
      </Modal>

      <ReportDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} item={selected} />
    </div>
  );
}
