import React, { useState, useEffect, useMemo, useRef } from 'react';
import './OvernightModal.css';

/* ===================== Helpers de data/tempo ===================== */
const pad = (n) => n.toString().padStart(2, '0');

const toISOFromBR = (br) => {
  if (!br) return '';
  const [d, m, y] = br.split('/').map(Number);
  if (!d || !m || !y) return br;
  return `${y}-${pad(m)}-${pad(d)}`;
};
const toBRFromISO = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${pad(d)}/${pad(m)}/${y}`;
};
const parseDateFlexible = (s) => {
  if (!s) return null;
  if (s.includes('/')) { const [d, m, y] = s.split('/').map(Number); return new Date(y, m - 1, d); }
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDaysBR = (dateBR, days) => {
  const d = parseDateFlexible(dateBR);
  if (!d) return dateBR;
  d.setDate(d.getDate() + days);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const calculateDays = (startStr, endStr) => {
  const start = parseDateFlexible(startStr);
  const end = parseDateFlexible(endStr);
  if (!start || !end) return 0;
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const todayBR  = () => {
  const t = new Date();
  return `${pad(t.getDate())}/${pad(t.getMonth()+1)}/${t.getFullYear()}`;
};
const isSameDayBR = (brDate, brRef = todayBR()) => brDate === brRef;

const formatDateForDisplay = (s) => (s?.includes('-') ? toBRFromISO(s) : s);

// Helper para gerar iniciais do nome
const getInitials = (name) => {
  if (!name) return '??';
  const words = name.trim().split(' ').filter(word => word.length > 0);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

// Helper para máscara de valor monetário
const formatCurrency = (value) => {
  if (!value) return '';
  const numericValue = value.toString().replace(/\D/g, '');
  const floatValue = parseFloat(numericValue) / 100;
  return floatValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

const parseCurrency = (value) => {
  if (!value) return 0;
  const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(numericValue) || 0;
};

// "DD/MM/YYYY" + "HH:mm" -> Date (local)
const dateTimeFromBR = (brDate, hhmm = '00:00') => {
  if (!brDate) return null;
  const [d, m, y] = brDate.split('/').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
};

// Está "agora" dentro do range da diária? (13:00 -> 11:00 do dia seguinte)
const isNowInDailyRangeStrict = (daily) => {
  if (!daily) return false;
  const start = dateTimeFromBR(daily.date, daily.startTime || '13:00');
  const end   = dateTimeFromBR(daily.endDate, daily.endTime || '11:00');
  const now = new Date();
  return start && end && now >= start && now < end;
};

// Fallback: se não estiver no range, marca se o check-in é hoje
const isDailyTodayFallback = (daily) => isSameDayBR(daily?.date);

/* Gera diárias (check-in inclusive, check-out exclusive) */
const generateDailiesFromRange = (checkinBR, checkoutBR, baseTemplate = {}) => {
  const totalNights = calculateDays(checkinBR, checkoutBR);
  const result = [];
  for (let i = 0; i < totalNights; i++) {
    const start = addDaysBR(checkinBR, i);
    const end = addDaysBR(start, 1);
    result.push({
      id: i + 1,
      date: start,
      startTime: baseTemplate.startTime ?? '13:00',
      endDate: end,
      endTime: baseTemplate.endTime ?? '11:00',
      room: baseTemplate.room ?? '01',
      guestCount: baseTemplate.guestCount ?? 2,
      dailyValue: baseTemplate.dailyValue ?? 80.0,
      consumptionValue: baseTemplate.consumptionValue ?? 0.0,
      get totalValue() { return (this.dailyValue ?? 0) + (this.consumptionValue ?? 0); }
    });
  }
  return result;
};

/* ===================== Hooks utilitários ===================== */
// Fecha um popover ao clicar fora ou pressionar ESC
const useOutsideClose = (open, onClose) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handleDown = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onClose?.();
    };
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);
  return ref;
};

/* ===================== Modern Date Picker ===================== */
const getMonthMatrix = (year, month /* 0-11 */) => {
  const first = new Date(year, month, 1);
  const firstWeekday = (first.getDay() + 6) % 7; // dom(0)->6; seg(1)->0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const ModernDatePicker = ({ valueISO, onChangeISO, minISO }) => {
  const initial = valueISO ? parseDateFlexible(valueISO) : new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const popRef = useOutsideClose(open, () => setOpen(false));

  const cells = useMemo(() => getMonthMatrix(viewYear, viewMonth), [viewYear, viewMonth]);
  const selected = valueISO ? parseDateFlexible(valueISO) : null;
  const minDate  = minISO ? parseDateFlexible(minISO) : null;

  const goPrev = () => setViewMonth((m) => (m === 0 ? (setViewYear((y)=>y-1), 11) : m-1));
  const goNext = () => setViewMonth((m) => (m === 11 ? (setViewYear((y)=>y+1), 0) : m+1));

  const handlePick = (d) => {
    if (!d) return;
    if (minDate) {
      const md = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
      if (d < md) return;
    }
    onChangeISO(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`);
    setOpen(false);
  };

  const weekLabels = ['S','T','Q','Q','S','S','D'];
  const monthLabels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  return (
    <div className="mdp-wrapper">
      <button type="button" className="mdp-input" onClick={() => setOpen(v=>!v)} aria-label="Abrir calendário">
        {valueISO ? toBRFromISO(valueISO) : 'dd/MM/yyyy'}
        <span className="mdp-icon">📅</span>
      </button>

      {open && (
        <div className="mdp-popover" ref={popRef}>
          <div className="mdp-header">
            <button className="mdp-nav" onClick={goPrev}>&lt;</button>
            <div className="mdp-title">{monthLabels[viewMonth]} {viewYear}</div>
            <button className="mdp-nav" onClick={goNext}>&gt;</button>
          </div>

          <div className="mdp-week">
            {weekLabels.map((w) => <div key={w} className="mdp-weekcell">{w}</div>)}
          </div>

          <div className="mdp-grid">
            {cells.map((d, i) => {
              const isDisabled = d && minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
              const isSelected = selected && d &&
                d.getFullYear()===selected.getFullYear() &&
                d.getMonth()===selected.getMonth() &&
                d.getDate()===selected.getDate();
              return (
                <button
                  key={i}
                  className={`mdp-cell ${!d?'empty':''} ${isSelected?'selected':''}`}
                  disabled={!d || isDisabled}
                  onClick={() => handlePick(d)}
                >
                  {d ? d.getDate() : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ===================== Modern Time Picker (24h) ===================== */
const ModernTimePicker = ({ value = '13:00', onChange }) => {
  const [open, setOpen] = useState(false);
  const [hSel, mSel] = value.split(':').map(Number);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const popRef = useOutsideClose(open, () => setOpen(false));

  const pick = (h, m) => { onChange?.(`${pad(h)}:${pad(m)}`); setOpen(false); };

  return (
    <div className="mtp-wrapper">
      <button type="button" className="mtp-input" onClick={() => setOpen(v=>!v)} aria-label="Selecionar horário">
        {pad(hSel)}:{pad(mSel)} <span className="mtp-icon">⏱</span>
      </button>
      {open && (
        <div className="mtp-popover" ref={popRef}>
          <div className="mtp-columns">
            <div className="mtp-col">
              <div className="mtp-col-title">Hora</div>
              <div className="mtp-grid">
                {hours.map(h => (
                  <button key={h} className={`mtp-cell ${h===hSel?'selected':''}`} onClick={() => pick(h, mSel)}>{pad(h)}</button>
                ))}
              </div>
            </div>
            <div className="mtp-col">
              <div className="mtp-col-title">Min</div>
              <div className="mtp-grid">
                {minutes.map(m => (
                  <button key={m} className={`mtp-cell ${m===mSel?'selected':''}`} onClick={() => pick(hSel, m)}>{pad(m)}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="mtp-footer">Formato 24h • Esc para fechar</div>
        </div>
      )}
    </div>
  );
};

/* ===================== Modern ComboBox (diárias) ===================== */
const ModernComboBox = ({ value, onChange, options = [], placeholder = 'Selecione...' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedOpt = options.find(o => o.value === value);
  const popRef = useOutsideClose(open, () => setOpen(false));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="mcb-wrapper">
      <button
        type="button"
        className={`mcb-input ${selectedOpt?.isCurrentRange ? 'current' : ''}`}
        onClick={() => setOpen(v=>!v)}
        aria-label="Abrir seleção de diárias"
      >
        <span className="mcb-text">{selectedOpt ? selectedOpt.label : placeholder}</span>
        {selectedOpt?.isCurrentRange && <span className="mcb-badge">Atual</span>}
        <span className="mcb-caret">▾</span>
      </button>

      {open && (
        <div className="mcb-popover" ref={popRef}>
          <input
            autoFocus
            className="mcb-search"
            placeholder="Buscar diária..."
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
          />
          <div className="mcb-list">
            {filtered.length === 0 && <div className="mcb-empty">Nenhuma opção</div>}
            {filtered.map(opt => (
              <button
                key={opt.value}
                className={`mcb-option ${opt.value===value?'selected':''} ${opt.isCurrentRange?'current':''}`}
                onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
                title={opt.isCurrentRange ? 'Diária atual (agora)' : 'Selecionar'}
              >
                <span>{opt.label}</span>
                {opt.isCurrentRange && <span className="mcb-badge">Atual</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ===================== Modal de Edição de Hóspedes ===================== */
const GuestEditModal = ({ isOpen, onClose, guests = [], onSave }) => {
  const [guestList, setGuestList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mock de dados de busca - substitua pela sua API
  const mockSearchData = [
    { id: 101, name: 'João Silva Santos', cpf: '123.456.789-01', phone: '(11) 9 8765-4321' },
    { id: 102, name: 'Maria Oliveira Costa', cpf: '987.654.321-09', phone: '(11) 9 1234-5678' },
    { id: 103, name: 'Pedro Almeida Souza', cpf: '456.789.123-45', phone: '(11) 9 5555-4444' },
    { id: 104, name: 'Ana Carolina Lima', cpf: '321.654.987-12', phone: '(11) 9 7777-8888' },
  ];

  useEffect(() => {
    if (isOpen) {
      setGuestList([...guests]);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, guests]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    // Simula busca - substitua pela sua API
    setTimeout(() => {
      const filtered = mockSearchData.filter(person => {
        const searchTerm = query.toLowerCase();
        return person.name.toLowerCase().includes(searchTerm) || 
               person.cpf.includes(searchTerm);
      });
      setSearchResults(filtered);
      setIsSearching(false);
    }, 300);
  };

  const addGuest = (person) => {
    const isAlreadyAdded = guestList.some(g => g.id === person.id);
    if (isAlreadyAdded) return;

    const newGuest = {
      id: person.id,
      name: person.name,
      phone: person.phone,
      cpf: person.cpf,
      isTitular: guestList.length === 0, // Primeiro hóspede é titular
      avatar: getInitials(person.name)
    };

    setGuestList(prev => [...prev, newGuest]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeGuest = (guestId) => {
    setGuestList(prev => {
      const filtered = prev.filter(g => g.id !== guestId);
      // Se remover o titular, o próximo vira titular
      if (filtered.length > 0 && !filtered.some(g => g.isTitular)) {
        filtered[0].isTitular = true;
      }
      return filtered;
    });
  };

  const setTitular = (guestId) => {
    setGuestList(prev => prev.map(g => ({
      ...g,
      isTitular: g.id === guestId
    })));
  };

  const handleSave = () => {
    onSave(guestList);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content guest-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="pernoite-icon">👥</span>
            <span>Editar Hóspedes</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Seção de Busca */}
          <section className="search-section">
            <h3>Buscar Hóspede</h3>
            <div className="search-input-container">
              <input
                type="text"
                className="search-input"
                placeholder="Digite o nome ou CPF do hóspede..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {isSearching && <div className="search-loading">Buscando...</div>}
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(person => (
                  <div key={person.id} className="search-result-item">
                    <div className="search-result-info">
                      <strong>{person.name}</strong>
                      <span className="search-result-details">CPF: {person.cpf} • Tel: {person.phone}</span>
                    </div>
                    <button 
                      className="add-search-btn"
                      onClick={() => addGuest(person)}
                      disabled={guestList.some(g => g.id === person.id)}
                    >
                      {guestList.some(g => g.id === person.id) ? 'Já adicionado' : '+ Adicionar'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Lista de Hóspedes Selecionados */}
          <section className="selected-guests-section">
            <h3>Hóspedes Selecionados ({guestList.length})</h3>
            {guestList.length === 0 ? (
              <div className="no-guests">Nenhum hóspede selecionado</div>
            ) : (
              <div className="guests-list scrollable-list">
                {guestList.map((guest) => (
                  <div key={guest.id} className="guest-card">
                    <div className="guest-avatar">{guest.avatar}</div>
                    <div className="guest-info">
                      <h4>{guest.name}</h4>
                      <p>Telefone: {guest.phone}</p>
                      {guest.cpf && <p>CPF: {guest.cpf}</p>}
                    </div>
                    <div className="guest-actions">
                      {guest.isTitular ? (
                        <span className="titular-badge">Titular</span>
                      ) : (
                        <>
                          <button className="action-link titular" onClick={() => setTitular(guest.id)}>
                            Definir titular
                          </button>
                          <button className="action-link remove" onClick={() => removeGuest(guest.id)}>
                            Remover
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancelar</button>
          <button className="save-btn" onClick={handleSave}>Concluir</button>
        </div>
      </div>
    </div>
  );
};

/* ===================== Modal de Edição de Consumo ===================== */
const ConsumptionEditModal = ({ isOpen, onClose, consumption = [], onSave }) => {
  const [consumptionList, setConsumptionList] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConsumption, setNewConsumption] = useState({
    category: '',
    item: '',
    quantity: 1,
    paymentMethod: 'PENDENTE'
  });

  // Mock de dados de categoria e itens
  const categories = [
    { id: 'bebidas', name: 'Bebidas' },
    { id: 'snacks', name: 'Snacks' },
    { id: 'refeicoes', name: 'Refeições' },
    { id: 'outros', name: 'Outros' }
  ];

  const itemsByCategory = {
    bebidas: [
      { id: 1, name: 'Água Mineral 500ml', price: 3.00 },
      { id: 2, name: 'Refrigerante Lata', price: 5.00 },
      { id: 3, name: 'Suco Natural', price: 8.00 },
      { id: 4, name: 'Cerveja Lata', price: 6.00 }
    ],
    snacks: [
      { id: 5, name: 'Salgadinho Cheetos 90g', price: 4.00 },
      { id: 6, name: 'Amendoim Torrado', price: 3.50 },
      { id: 7, name: 'Pipoca Doce', price: 2.50 },
      { id: 8, name: 'Chocolate Ao Leite', price: 6.50 }
    ],
    refeicoes: [
      { id: 9, name: 'Sanduíche Natural', price: 12.00 },
      { id: 10, name: 'Hambúrguer Simples', price: 18.00 },
      { id: 11, name: 'Pizza Individual', price: 25.00 }
    ],
    outros: [
      { id: 12, name: 'Shampoo Individual', price: 8.00 },
      { id: 13, name: 'Condicionador Individual', price: 8.00 }
    ]
  };

  const paymentMethods = [
    'PENDENTE',
    'DINHEIRO',
    'CARTÃO DE CRÉDITO',
    'CARTÃO DE DÉBITO',
    'PIX'
  ];

  useEffect(() => {
    if (isOpen) {
      setConsumptionList([...consumption]);
      setShowAddForm(false);
      setNewConsumption({
        category: '',
        item: '',
        quantity: 1,
        paymentMethod: 'PENDENTE'
      });
    }
  }, [isOpen, consumption]);

  const availableItems = newConsumption.category ? (itemsByCategory[newConsumption.category] || []) : [];
  const selectedItem = availableItems.find(item => item.id.toString() === newConsumption.item);

  const handleAddConsumption = () => {
    if (!newConsumption.category || !newConsumption.item || !selectedItem) return;

    const now = new Date();
    const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    const newItem = {
      id: Date.now(),
      item: `${newConsumption.quantity}x ${selectedItem.name}`,
      date: dateStr,
      paymentMethod: newConsumption.paymentMethod,
      value: selectedItem.price * newConsumption.quantity
    };

    setConsumptionList(prev => [...prev, newItem]);
    setShowAddForm(false);
    setNewConsumption({
      category: '',
      item: '',
      quantity: 1,
      paymentMethod: 'PENDENTE'
    });
  };

  const removeConsumption = (id) => {
    setConsumptionList(prev => prev.filter(item => item.id !== id));
  };

  const updatePaymentMethod = (id, newMethod) => {
    setConsumptionList(prev => prev.map(item => 
      item.id === id ? { ...item, paymentMethod: newMethod } : item
    ));
  };

  const handleSave = () => {
    onSave(consumptionList);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content consumption-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="pernoite-icon">🍽️</span>
            <span>Editar Consumo</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Lista de Consumo Existente */}
          <section className="existing-consumption-section">
            <div className="section-header">
              <h3>Itens de Consumo ({consumptionList.length})</h3>
              <button className="add-btn" onClick={() => setShowAddForm(true)}>+ Adicionar Item</button>
            </div>

            {consumptionList.length === 0 ? (
              <div className="no-consumption">Nenhum item de consumo registrado</div>
            ) : (
              <div className="consumption-list scrollable-list">
                {consumptionList.map((item) => (
                  <div key={item.id} className="consumption-item">
                    <div className="consumption-info">
                      <span className="consumption-name">{item.item}</span>
                      <span className="consumption-date">{item.date}</span>
                      <div className="consumption-payment">
                        {item.paymentMethod === 'PENDENTE' ? (
                          <select 
                            value={item.paymentMethod}
                            onChange={(e) => updatePaymentMethod(item.id, e.target.value)}
                            className="payment-select"
                          >
                            {paymentMethods.map(method => (
                              <option key={method} value={method}>{method}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="payment-method">{item.paymentMethod}</span>
                        )}
                      </div>
                    </div>
                    <div className="consumption-actions">
                      <span className="consumption-value">R$ {item.value.toFixed(2)}</span>
                      <button className="remove-item-btn" onClick={() => removeConsumption(item.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Formulário de Adicionar Consumo */}
          {showAddForm && (
            <section className="add-consumption-section">
              <h3>Adicionar Novo Item</h3>
              <div className="consumption-form">
                <div className="form-row">
                  <div className="form-field">
                    <label>Categoria</label>
                    <select 
                      value={newConsumption.category}
                      onChange={(e) => setNewConsumption(prev => ({ ...prev, category: e.target.value, item: '' }))}
                    >
                      <option value="">Selecione a categoria</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Item</label>
                    <select 
                      value={newConsumption.item}
                      onChange={(e) => setNewConsumption(prev => ({ ...prev, item: e.target.value }))}
                      disabled={!newConsumption.category}
                    >
                      <option value="">Selecione o item</option>
                      {availableItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} - R$ {item.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Quantidade</label>
                    <input 
                      type="number"
                      min="1"
                      max="20"
                      value={newConsumption.quantity}
                      onChange={(e) => setNewConsumption(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  <div className="form-field">
                    <label>Forma de Pagamento</label>
                    <select 
                      value={newConsumption.paymentMethod}
                      onChange={(e) => setNewConsumption(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    >
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>

                  {selectedItem && (
                    <div className="form-field">
                      <label>Total</label>
                      <div className="total-display">
                        R$ {(selectedItem.price * newConsumption.quantity).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button className="save-btn" onClick={handleAddConsumption} disabled={!selectedItem}>
                    Adicionar Item
                  </button>
                  <button className="cancel-btn" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Fechar</button>
          <button className="save-btn" onClick={handleSave}>Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
};

/* ===================== Modal de Edição de Pagamentos ===================== */
const PaymentEditModal = ({ isOpen, onClose, payments = [], onSave }) => {
  const [paymentList, setPaymentList] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPayment, setNewPayment] = useState({
    description: '',
    paymentMethod: 'DINHEIRO',
    value: ''
  });

  const paymentMethods = [
    'DINHEIRO',
    'CARTÃO DE CRÉDITO',
    'CARTÃO DE DÉBITO',
    'PIX',
    'TRANSFERÊNCIA BANCÁRIA'
  ];

  useEffect(() => {
    if (isOpen) {
      setPaymentList([...payments]);
      setShowAddForm(false);
      setNewPayment({
        description: '',
        paymentMethod: 'DINHEIRO',
        value: ''
      });
    }
  }, [isOpen, payments]);

  const handleValueChange = (value) => {
    // Remove tudo que não é dígito
    const numericValue = value.replace(/\D/g, '');
    
    // Aplica a máscara monetária
    if (numericValue === '') {
      setNewPayment(prev => ({ ...prev, value: '' }));
      return;
    }

    const floatValue = parseFloat(numericValue) / 100;
    const formatted = floatValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    setNewPayment(prev => ({ ...prev, value: formatted }));
  };

  const handleAddPayment = () => {
    if (!newPayment.description.trim() || !newPayment.value) return;

    const now = new Date();
    const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    const newItem = {
      id: Date.now(),
      type: newPayment.description,
      date: dateStr,
      paymentMethod: newPayment.paymentMethod,
      value: parseCurrency(newPayment.value)
    };

    setPaymentList(prev => [...prev, newItem]);
    setShowAddForm(false);
    setNewPayment({
      description: '',
      paymentMethod: 'DINHEIRO',
      value: ''
    });
  };

  const removePayment = (id) => {
    setPaymentList(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = () => {
    onSave(paymentList);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="pernoite-icon">💳</span>
            <span>Editar Pagamentos</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Lista de Pagamentos Existentes */}
          <section className="existing-payments-section">
            <div className="section-header">
              <h3>Pagamentos Registrados ({paymentList.length})</h3>
              <button className="add-btn" onClick={() => setShowAddForm(true)}>+ Adicionar Pagamento</button>
            </div>

            {paymentList.length === 0 ? (
              <div className="no-payments">Nenhum pagamento registrado</div>
            ) : (
              <div className="payments-list scrollable-list">
                {paymentList.map((payment) => (
                  <div key={payment.id} className="payment-item">
                    <div className="payment-info">
                      <span className="payment-type">{payment.type}</span>
                      <span className="payment-date">{payment.date} • {payment.paymentMethod}</span>
                    </div>
                    <div className="payment-actions">
                      <span className="payment-value">R$ {payment.value.toFixed(2)}</span>
                      <button className="remove-item-btn" onClick={() => removePayment(payment.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Formulário de Adicionar Pagamento */}
          {showAddForm && (
            <section className="add-payment-section">
              <h3>Adicionar Novo Pagamento</h3>
              <div className="payment-form">
                <div className="form-field">
                  <label>Descrição do Pagamento</label>
                  <input 
                    type="text"
                    placeholder="Ex: Pagamento parcial, Pagamento integral, Entrada..."
                    value={newPayment.description}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Forma de Pagamento</label>
                    <select 
                      value={newPayment.paymentMethod}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    >
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Valor</label>
                    <input 
                      type="text"
                      placeholder="R$ 0,00"
                      value={newPayment.value}
                      onChange={(e) => handleValueChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    className="save-btn" 
                    onClick={handleAddPayment} 
                    disabled={!newPayment.description.trim() || !newPayment.value}
                  >
                    Adicionar Pagamento
                  </button>
                  <button className="cancel-btn" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Fechar</button>
          <button className="save-btn" onClick={handleSave}>Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
};

/* ===================== Modal para Adicionar Diárias ===================== */
const AddDailyModal = ({ isOpen, onClose, currentRoom, currentGuests, checkoutDate, onSave }) => {
  const [newDaily, setNewDaily] = useState({
    room: currentRoom || '01',
    startDate: '',
    endDate: '',
    guests: [...currentGuests]
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Mock de quartos disponíveis
  const availableRooms = [
    { id: '01', name: 'Quarto 01 - Standard' },
    { id: '02', name: 'Quarto 02 - Standard' },
    { id: '03', name: 'Quarto 03 - Deluxe' },
    { id: '04', name: 'Quarto 04 - Suite' }
  ];

  // Mock de dados de busca
  const mockSearchData = [
    { id: 101, name: 'João Silva Santos', cpf: '123.456.789-01', phone: '(11) 9 8765-4321' },
    { id: 102, name: 'Maria Oliveira Costa', cpf: '987.654.321-09', phone: '(11) 9 1234-5678' }
  ];

  useEffect(() => {
    if (isOpen) {
      setNewDaily({
        room: currentRoom || '01',
        startDate: toISOFromBR(addDaysBR(checkoutDate, 1)),
        endDate: '',
        guests: [...currentGuests]
      });
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, currentRoom, currentGuests, checkoutDate]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const filtered = mockSearchData.filter(person => {
      const searchTerm = query.toLowerCase();
      return person.name.toLowerCase().includes(searchTerm) || 
             person.cpf.includes(searchTerm);
    });
    setSearchResults(filtered);
  };

  const addGuest = (person) => {
    const isAlreadyAdded = newDaily.guests.some(g => g.id === person.id);
    if (isAlreadyAdded) return;

    const guest = {
      id: person.id,
      name: person.name,
      phone: person.phone,
      cpf: person.cpf,
      isTitular: newDaily.guests.length === 0,
      avatar: getInitials(person.name)
    };

    setNewDaily(prev => ({
      ...prev,
      guests: [...prev.guests, guest]
    }));
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeGuest = (guestId) => {
    setNewDaily(prev => {
      const filtered = prev.guests.filter(g => g.id !== guestId);
      if (filtered.length > 0 && !filtered.some(g => g.isTitular)) {
        filtered[0].isTitular = true;
      }
      return { ...prev, guests: filtered };
    });
  };

  const setTitular = (guestId) => {
    setNewDaily(prev => ({
      ...prev,
      guests: prev.guests.map(g => ({
        ...g,
        isTitular: g.id === guestId
      }))
    }));
  };

  const totalDays = newDaily.startDate && newDaily.endDate ? 
    calculateDays(newDaily.startDate, newDaily.endDate) : 0;

  const dailyValue = 80.0; // Mock valor da diária
  const totalValue = totalDays * dailyValue;

  const handleSave = () => {
    if (!newDaily.startDate || !newDaily.endDate || newDaily.guests.length === 0) return;
    
    onSave({
      room: newDaily.room,
      startDate: toBRFromISO(newDaily.startDate),
      endDate: toBRFromISO(newDaily.endDate),
      guests: newDaily.guests,
      totalDays,
      totalValue
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-daily-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="pernoite-icon">📅</span>
            <span>Adicionar Diárias</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Configuração das Diárias */}
          <section className="daily-config-section">
            <h3>Configuração das Novas Diárias</h3>
            <div className="form-row">
              <div className="form-field">
                <label>Quarto</label>
                <select 
                  value={newDaily.room}
                  onChange={(e) => setNewDaily(prev => ({ ...prev, room: e.target.value }))}
                >
                  {availableRooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Data de Início</label>
                <ModernDatePicker
                  valueISO={newDaily.startDate}
                  onChangeISO={(date) => setNewDaily(prev => ({ ...prev, startDate: date }))}
                  minISO={toISOFromBR(addDaysBR(checkoutDate, 1))}
                />
              </div>

              <div className="form-field">
                <label>Data de Fim</label>
                <ModernDatePicker
                  valueISO={newDaily.endDate}
                  onChangeISO={(date) => setNewDaily(prev => ({ ...prev, endDate: date }))}
                  minISO={newDaily.startDate}
                />
              </div>
            </div>

            {totalDays > 0 && (
              <div className="daily-summary">
                <div className="summary-info">
                  <span>Total de diárias: <strong>{totalDays}</strong></span>
                  <span>Valor por diária: <strong>R$ {dailyValue.toFixed(2)}</strong></span>
                  <span>Valor total: <strong>R$ {totalValue.toFixed(2)}</strong></span>
                </div>
              </div>
            )}
          </section>

          {/* Buscar Hóspedes */}
          <section className="search-section">
            <h3>Buscar Hóspede</h3>
            <div className="search-input-container">
              <input
                type="text"
                className="search-input"
                placeholder="Digite o nome ou CPF do hóspede..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(person => (
                  <div key={person.id} className="search-result-item">
                    <div className="search-result-info">
                      <strong>{person.name}</strong>
                      <span className="search-result-details">CPF: {person.cpf} • Tel: {person.phone}</span>
                    </div>
                    <button 
                      className="add-search-btn"
                      onClick={() => addGuest(person)}
                      disabled={newDaily.guests.some(g => g.id === person.id)}
                    >
                      {newDaily.guests.some(g => g.id === person.id) ? 'Já adicionado' : '+ Adicionar'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Hóspedes Selecionados */}
          <section className="selected-guests-section">
            <h3>Hóspedes ({newDaily.guests.length})</h3>
            {newDaily.guests.length === 0 ? (
              <div className="no-guests">Nenhum hóspede selecionado</div>
            ) : (
              <div className="guests-list scrollable-list">
                {newDaily.guests.map((guest) => (
                  <div key={guest.id} className="guest-card">
                    <div className="guest-avatar">{guest.avatar}</div>
                    <div className="guest-info">
                      <h4>{guest.name}</h4>
                      <p>Telefone: {guest.phone}</p>
                      {guest.cpf && <p>CPF: {guest.cpf}</p>}
                    </div>
                    <div className="guest-actions">
                      {guest.isTitular ? (
                        <span className="titular-badge">Titular</span>
                      ) : (
                        <>
                          <button className="action-link titular" onClick={() => setTitular(guest.id)}>
                            Definir titular
                          </button>
                          <button className="action-link remove" onClick={() => removeGuest(guest.id)}>
                            Remover
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancelar</button>
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={!newDaily.startDate || !newDaily.endDate || newDaily.guests.length === 0}
          >
            Adicionar Diárias
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===================== Modal para Trocar Quarto ===================== */
const ChangeRoomModal = ({ isOpen, onClose, currentRoom, onSave }) => {
  const [selectedRoom, setSelectedRoom] = useState(currentRoom);

  // Mock de quartos disponíveis
  const availableRooms = [
    { id: '01', name: 'Quarto 01 - Standard', price: 80.0 },
    { id: '02', name: 'Quarto 02 - Standard', price: 80.0 },
    { id: '03', name: 'Quarto 03 - Deluxe', price: 120.0 },
    { id: '04', name: 'Quarto 04 - Suite', price: 200.0 }
  ];

  useEffect(() => {
    if (isOpen) {
      setSelectedRoom(currentRoom);
    }
  }, [isOpen, currentRoom]);

  const handleSave = () => {
    onSave(selectedRoom);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content change-room-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="pernoite-icon">🚪</span>
            <span>Trocar Quarto</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <section className="room-selection-section">
            <h3>Selecionar Novo Quarto</h3>
            <div className="rooms-list">
              {availableRooms.map((room) => (
                <div 
                  key={room.id} 
                  className={`room-card ${selectedRoom === room.id ? 'selected' : ''}`}
                  onClick={() => setSelectedRoom(room.id)}
                >
                  <div className="room-info">
                    <h4>{room.name}</h4>
                    <p>R$ {room.price.toFixed(2)} / diária</p>
                  </div>
                  {selectedRoom === room.id && <span className="selected-badge">✓</span>}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancelar</button>
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={selectedRoom === currentRoom}
          >
            Confirmar Troca
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===================== Modal Principal ===================== */
const OvernightModal = ({ isOpen, onClose, overnightData, onCancel, onFinalize }) => {
  const [selectedDaily, setSelectedDaily] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    checkin: '',
    checkout: '',
    expectedArrival: '13:00',
    expectedDeparture: '11:00',
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [activeSubTab, setActiveSubTab] = useState("daily-details");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddDailyModal, setShowAddDailyModal] = useState(false);
  const [showChangeRoomModal, setShowChangeRoomModal] = useState(false);

  // MOCK – troque pela sua fonte
  const [modalData, setModalData] = useState({
    id: '#435',
    checkin: '06/09/2025',
    checkout: '10/09/2025',
    expectedArrival: '13:00',
    expectedDeparture: '11:00',
    dailies: [{ room: '01', dailyValue: 80.0, consumptionValue: 10.0, guestCount: 2 }],
    guests: [
      { id: 1, name: 'Amelia Santos Andrade', phone: '(08) 9 8787-0090', cpf: '123.456.789-01', isTitular: true, avatar: getInitials('Amelia Santos Andrade') },
      { id: 2, name: 'Vicente Santos', phone: '(08) 9 8787-0090', cpf: '987.654.321-09', isTitular: false, avatar: getInitials('Vicente Santos') }
    ],
    consumption: [
      { id: 1, item: '2x Agua Mineral', date: '07/04/2025 15:09', paymentMethod: 'CARTÃO DE CRÉDITO', value: 6.0 },
      { id: 2, item: '1x SALGADINHO CHEETOS 90G', date: '07/04/2025 15:09', paymentMethod: 'PENDENTE', value: 4.0 }
    ],
    payments: [{ id: 1, type: 'Pagamento INTEGRAL', date: '07/04/2025 15:09', paymentMethod: 'CARTÃO DE CRÉDITO', value: 80.0 }]
  });

  const baseTemplate = modalData.dailies?.[0] || {};

  const effectiveCheckinBR  = isEditing ? toBRFromISO(editData.checkin)  : modalData.checkin;
  const effectiveCheckoutBR = isEditing ? toBRFromISO(editData.checkout) : modalData.checkout;

  const generatedDailies = useMemo(
    () => generateDailiesFromRange(effectiveCheckinBR, effectiveCheckoutBR, baseTemplate),
    [effectiveCheckinBR, effectiveCheckoutBR, baseTemplate]
  );

  useEffect(() => {
    if (!isOpen) return;
    setIsEditing(false);
    setEditData({
      checkin: toISOFromBR(modalData.checkin),
      checkout: toISOFromBR(modalData.checkout),
      expectedArrival: modalData.expectedArrival,
      expectedDeparture: modalData.expectedDeparture,
    });
  }, [isOpen, modalData.checkin, modalData.checkout, modalData.expectedArrival, modalData.expectedDeparture]);

  useEffect(() => {
    if (!generatedDailies.length) { setSelectedDaily(0); return; }
    const idxNow = generatedDailies.findIndex(isNowInDailyRangeStrict);
    if (idxNow >= 0) { setSelectedDaily(idxNow); return; }
    const idxToday = generatedDailies.findIndex(isDailyTodayFallback);
    setSelectedDaily(idxToday >= 0 ? idxToday : 0);
  }, [generatedDailies]);

  if (!isOpen) return null;

  const handleCheckinChange = (iso) => {
    setEditData((prev) => {
      const clamp = prev.checkout && parseDateFlexible(prev.checkout) < parseDateFlexible(iso);
      return { ...prev, checkin: iso, checkout: clamp ? iso : prev.checkout };
    });
  };
  const handleCheckoutChange = (iso) => setEditData((p) => ({ ...p, checkout: iso }));
  const handleEditSave = () => { setIsEditing(false); console.log('Salvar', editData); };

  const currentDaily = generatedDailies[selectedDaily];

  // Cálculos para o dashboard
  const totalPernoite = generatedDailies.reduce((sum, daily) => sum + daily.totalValue, 0);
  const totalPaid = modalData.payments.reduce((s, p) => s + p.value, 0);
  const totalDue = currentDaily ? (currentDaily.totalValue ?? 0) : 0;
  const totalPending = Math.max(0, totalDue - totalPaid);
  const totalPernoitePending = Math.max(0, totalPernoite - totalPaid);
  const paidPercent = totalDue ? Math.min(100, Math.max(0, (totalPaid / totalDue) * 100)) : 0;

  const dailyOptions = generatedDailies.map((d, i) => {
    const label = `${i + 1} - [${d.date} ${d.startTime}] → [${d.endDate} ${d.endTime}]`;
    const inRangeNow = isNowInDailyRangeStrict(d);
    const todayFallback = isDailyTodayFallback(d);
    return {
      value: i,
      label,
      isCurrentRange: inRangeNow || todayFallback,
    };
  });

  // Controle de navegação entre tabs
  const handleTabChange = (tab) => {
    if (isEditing && tab === 'daily-management') return; // Bloqueia se estiver editando
    setActiveTab(tab);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="pernoite-icon">🏨</span>
            <span>Pernoite {modalData.id}</span>
          </div>
          <button 
            className={`edit-data-btn ${activeTab === 'daily-management' ? 'disabled' : ''}`}
            onClick={() => activeTab !== 'daily-management' && setIsEditing((v) => !v)}
            disabled={activeTab === 'daily-management'}
          >
            {isEditing ? 'Fechar edição' : '+ Editar Dados'}
          </button>
        </div>

        <div className="modal-body">
          {/* Sistema de Tabs Principais */}
          <div className="tabs-container">
            <div className="tabs-header">
              <button 
                className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabChange('overview')}
              >
                📋 Dados do Pernoite
              </button>
              <button 
                className={`tab-button ${activeTab === 'daily-management' ? 'active' : ''} ${isEditing ? 'disabled' : ''}`}
                onClick={() => handleTabChange('daily-management')}
                disabled={isEditing}
              >
                📊 Informações da Diária
              </button>
            </div>

            <div className="tabs-content">
              {/* Tab Dados do Pernoite */}
              {activeTab === 'overview' && (
                <div className="tab-panel">
                  {/* Seção de Dados da Reserva */}
                  <section className="data-section">
                    <h3>Dados da Reserva</h3>

                    <div className="data-grid">
                      <div className="data-row">
                    

                        <div className="data-item">
                          <label>Checkout:</label>
                          {isEditing ? (
                            <ModernDatePicker
                              valueISO={editData.checkout}
                              onChangeISO={handleCheckoutChange}
                              minISO={editData.checkin || todayISO()}
                            />
                          ) : (
                            <span>{formatDateForDisplay(modalData.checkout)}</span>
                          )}
                        </div>

                        <div className="data-item">
                          <label>Total de Diárias:</label>
                          <span className="calculated-days">
                            {isEditing
                              ? calculateDays(editData.checkin, editData.checkout)
                              : calculateDays(modalData.checkin, modalData.checkout)}
                          </span>
                        </div>
                      </div>

                      <div className="data-row">
                        <div className="data-item">
                          <label>Chegada prevista:</label>
                          {isEditing ? (
                            <ModernTimePicker
                              value={editData.expectedArrival}
                              onChange={(val) => setEditData((p) => ({ ...p, expectedArrival: val }))}
                            />
                          ) : (
                            <span>{modalData.expectedArrival}</span>
                          )}
                        </div>

                        <div className="data-item">
                          <label>Saída Prevista:</label>
                          {isEditing ? (
                            <ModernTimePicker
                              value={editData.expectedDeparture}
                              onChange={(val) => setEditData((p) => ({ ...p, expectedDeparture: val }))}
                            />
                          ) : (
                            <span>{modalData.expectedDeparture}</span>
                          )}
                        </div>
                        <div className="data-item" />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="edit-actions">
                        <button className="save-btn" onClick={handleEditSave}>Salvar</button>
                        <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancelar</button>
                      </div>
                    )}
                  </section>

                  {/* Dashboard de Valores */}
                  <section className="dashboard-section">
                    <h3>Resumo Financeiro</h3>
                    <div className="dashboard-grid">
                      <div className="dashboard-card total">
                        <div className="dashboard-title">Valor Total do Pernoite</div>
                        <div className="dashboard-value">R$ {totalPernoite.toFixed(2)}</div>
                      </div>
                      <div className="dashboard-card paid">
                        <div className="dashboard-title">Total Pago</div>
                        <div className="dashboard-value">R$ {totalPaid.toFixed(2)}</div>
                      </div>
                      <div className="dashboard-card pending">
                        <div className="dashboard-title">Falta Pagar</div>
                        <div className="dashboard-value">R$ {totalPernoitePending.toFixed(2)}</div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* Tab Informações da Diária */}
              {activeTab === 'daily-management' && (
                <div className="tab-panel">
                  {/* Seletor de Diária - Sempre visível na área principal */}
                  <section className="daily-selector-section">
                    <div className="daily-selector-header">
                      <div className="daily-selector-main">
                        <label>Diária Selecionada:</label>
                        {generatedDailies.length > 0 ? (
                          <ModernComboBox
                            value={selectedDaily}
                            onChange={setSelectedDaily}
                            options={dailyOptions}
                            placeholder="Selecione a diária"
                          />
                        ) : (
                          <span className="no-dailies-hint">Defina check-in e check-out válidos</span>
                        )}
                      </div>
                      <div className="daily-actions">
                        <button className="change-room-btn" onClick={() => setShowChangeRoomModal(true)}>
                          🚪 Trocar Quarto
                        </button>
                        <button className="add-daily-btn" onClick={() => setShowAddDailyModal(true)}>
                          + Adicionar Diária
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Sub-tabs para informações da diária */}
                  <div className="sub-tabs-container">
                    <div className="sub-tabs-header">
                      <button 
                        className={`sub-tab-button ${activeSubTab === 'daily-details' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('daily-details')}
                      >
                        📊 Detalhes da Diária
                      </button>
                      <button 
                        className={`sub-tab-button ${activeSubTab === 'guests' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('guests')}
                      >
                        👥 Hóspedes
                      </button>
                      <button 
                        className={`sub-tab-button ${activeSubTab === 'consumption' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('consumption')}
                      >
                        🍽️ Consumo
                      </button>
                      <button 
                        className={`sub-tab-button ${activeSubTab === 'payments' ? 'active' : ''}`}
                        onClick={() => setActiveSubTab('payments')}
                      >
                        💳 Pagamentos
                      </button>
                    </div>

                    <div className="sub-tabs-content">
                      {/* Sub-tab Detalhes da Diária */}
                      {activeSubTab === 'daily-details' && currentDaily && (
                        <div className="sub-tab-panel">
                          {/* Informações da diária selecionada */}
                          <div className="daily-info-grid">
                            <div className="daily-left">
                              <div className="info-item">
                                <label>Valor Diária:</label>
                                <span>R$ {currentDaily.dailyValue.toFixed(2)}</span>
                              </div>
                              <div className="info-item">
                                <label>Valor Consumo:</label>
                                <span>R$ {currentDaily.consumptionValue.toFixed(2)}</span>
                              </div>
                              <div className="info-item total">
                                <label>Valor Total:</label>
                                <span>R$ {currentDaily.totalValue.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="daily-right">
                              <div className="info-item">
                                <label>Quarto:</label>
                                <span>{currentDaily.room}</span>
                              </div>
                              <div className="info-item">
                                <label>Qtd. Pessoas:</label>
                                <span>{currentDaily.guestCount}</span>
                              </div>
                              <div className="info-item">
                                <label>Período:</label>
                                <span>{currentDaily.date} {currentDaily.startTime} → {currentDaily.endDate} {currentDaily.endTime}</span>
                              </div>
                            </div>
                          </div>

                          {/* Resumo + Progresso da diária específica */}
                          <div className="payment-summary">
                            <div className="summary-card paid">
                              <div className="summary-title">Pago</div>
                              <div className="summary-value">R$ {totalPaid.toFixed(2)}</div>
                            </div>
                            <div className="summary-card pending">
                              <div className="summary-title">Falta pagar</div>
                              <div className="summary-value">R$ {totalPending.toFixed(2)}</div>
                            </div>
                          </div>

                          <div className="payment-progress">
                            <div className="payment-progress-track">
                              <div className="payment-progress-bar" style={{ width: `${paidPercent}%` }} />
                            </div>
                            <div className="payment-progress-labels">
                              <span className="pct">{paidPercent.toFixed(0)}%</span>
                              <span className="total">Total: R$ {totalDue.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Sub-tab Hóspedes */}
                      {activeSubTab === 'guests' && (
                        <div className="sub-tab-panel">
                          <div className="sub-tab-panel-header">
                            <button className="add-btn" onClick={() => setShowGuestModal(true)}>✏️ Editar Hóspedes</button>
                          </div>
                          <div className="guests-list scrollable-list">
                            {modalData.guests.map((guest) => (
                              <div key={guest.id} className="guest-card">
                                <div className="guest-avatar">{guest.avatar}</div>
                                <div className="guest-info">
                                  <h4>{guest.name}</h4>
                                  <p>Telefone: {guest.phone}</p>
                                  <p>CPF: {guest.cpf}</p>
                                </div>
                                <div className="guest-actions">
                                  {guest.isTitular && <span className="titular-badge">Titular</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sub-tab Consumo */}
                      {activeSubTab === 'consumption' && (
                        <div className="sub-tab-panel">
                          <div className="sub-tab-panel-header">
                            <button className="add-btn" onClick={() => setShowConsumptionModal(true)}>✏️ Editar Consumo</button>
                          </div>
                          <div className="consumption-list scrollable-list">
                            {modalData.consumption.map((item) => (
                              <div key={item.id} className="consumption-item">
                                <div className="consumption-info">
                                  <span className="consumption-name">{item.item}</span>
                                  <span className="consumption-date">{item.date} • {item.paymentMethod}</span>
                                </div>
                                <span className="consumption-value">R$ {item.value.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sub-tab Pagamentos */}
                      {activeSubTab === 'payments' && (
                        <div className="sub-tab-panel">
                          <div className="sub-tab-panel-header">
                            <button className="add-btn" onClick={() => setShowPaymentModal(true)}>✏️ Editar Pagamentos</button>
                          </div>
                          <div className="payments-list scrollable-list">
                            {modalData.payments.map((payment) => (
                              <div key={payment.id} className="payment-item">
                                <div className="payment-info">
                                  <span className="payment-type">{payment.type}</span>
                                  <span className="payment-date">{payment.date} • {payment.paymentMethod}</span>
                                </div>
                                <span className="payment-value">R$ {payment.value.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-reservation-btn" onClick={onCancel}>Cancelar</button>
          <button className="finalize-btn" onClick={onFinalize}>Finalizar</button>
        </div>
      </div>

      {/* Modais */}
      {showGuestModal && <GuestEditModal 
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        guests={modalData.guests}
        onSave={(updatedGuests) => {
          setModalData(prev => ({ ...prev, guests: updatedGuests }));
          setShowGuestModal(false);
        }}
      />}

      {showConsumptionModal && <ConsumptionEditModal 
        isOpen={showConsumptionModal}
        onClose={() => setShowConsumptionModal(false)}
        consumption={modalData.consumption}
        onSave={(updatedConsumption) => {
          setModalData(prev => ({ ...prev, consumption: updatedConsumption }));
          setShowConsumptionModal(false);
        }}
      />}

      {showPaymentModal && <PaymentEditModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        payments={modalData.payments}
        onSave={(updatedPayments) => {
          setModalData(prev => ({ ...prev, payments: updatedPayments }));
          setShowPaymentModal(false);
        }}
      />}

      {showAddDailyModal && <AddDailyModal 
        isOpen={showAddDailyModal}
        onClose={() => setShowAddDailyModal(false)}
        currentRoom={currentDaily?.room}
        currentGuests={modalData.guests}
        checkoutDate={modalData.checkout}
        onSave={(newDailies) => {
          console.log('Novas diárias:', newDailies);
          setShowAddDailyModal(false);
        }}
      />}

      {showChangeRoomModal && <ChangeRoomModal 
        isOpen={showChangeRoomModal}
        onClose={() => setShowChangeRoomModal(false)}
        currentRoom={currentDaily?.room}
        onSave={(newRoom) => {
          console.log('Novo quarto:', newRoom);
          setShowChangeRoomModal(false);
        }}
      />}
    </div>
  );
};

export default OvernightModal;