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

/* ===================== Modal ===================== */
const OvernightModal = ({ isOpen, onClose, overnightData, onCancel, onFinalize }) => {
  const [selectedDaily, setSelectedDaily] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    checkin: '',
    checkout: '',
    expectedArrival: '13:00',
    expectedDeparture: '11:00',
  });

  // MOCK – troque pela sua fonte
  const [modalData] = useState({
    id: '#435',
    checkin: '06/09/2025',
    checkout: '10/09/2025',
    expectedArrival: '13:00',
    expectedDeparture: '11:00',
    dailies: [{ room: '01', dailyValue: 80.0, consumptionValue: 10.0, guestCount: 2 }],
    guests: [
      { id: 1, name: 'Amelia Santos Andrade', phone: '(08) 9 8787-0090', isTitular: true,  avatar: '👩' },
      { id: 2, name: 'Vicente Santos',        phone: '(08) 9 8787-0090', isTitular: false, avatar: '👨' }
    ],
    consumption: [
      { id: 1, item: '2x Agua Mineral',           date: '07/04/2025 15:09', paymentMethod: 'CARTÃO DE CRÉDITO', value: 6.0 },
      { id: 2, item: '1x SALGADINHO CHEETOS 90G', date: '07/04/2025 15:09', paymentMethod: 'CARTÃO DE CRÉDITO', value: 4.0 }
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

  // pagamentos / destaques
  const totalPaid = modalData.payments.reduce((s, p) => s + p.value, 0);
  const totalDue = currentDaily ? (currentDaily.totalValue ?? 0) : 0;
  const totalPending = Math.max(0, totalDue - totalPaid);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="pernoite-icon">🏨</span>
            <span>Pernoite {modalData.id}</span>
          </div>
          <button className="edit-data-btn" onClick={() => setIsEditing((v) => !v)}>
            {isEditing ? 'Fechar edição' : '+ Editar Dados'}
          </button>
        </div>

        <div className="modal-body">
          {/* Seção de Dados */}
          <section className="data-section">
            <h3>Dados da Reserva</h3>

            <div className="data-grid">
              <div className="data-row">
                <div className="data-item">
                  <label>Checkin:</label>
                  {isEditing ? (
                    <ModernDatePicker
                      valueISO={editData.checkin}
                      onChangeISO={handleCheckinChange}
                      minISO={todayISO()}
                    />
                  ) : (
                    <span>{formatDateForDisplay(modalData.checkin)}</span>
                  )}
                </div>

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

          {/* Divisores coloridos */}
          <div className="section-divider daily">
            <h2>Diárias</h2>
            <div className="bar" />
          </div>

          {/* Diárias - ComboBox moderno */}
          <section className="daily-section">
            <div className="daily-header">
              <label>Diária:</label>
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
              <button className="add-daily-btn">+ Adicionar Diária</button>
            </div>

            {currentDaily && (
              <>
                {/* esquerda (valores), direita (quarto e pessoas) */}
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
                  </div>
                </div>

                {/* Resumo + Progresso */}
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
              </>
            )}
          </section>

          <div className="section-divider guests">
            <h2>Hóspedes</h2>
            <div className="bar" />
          </div>

          {/* Hóspedes */}
          <section className="guests-section">
            <div className="section-header">
              <span></span>
              <button className="add-btn">+ Adicionar Hóspede</button>
            </div>
            <div className="guests-list">
              {modalData.guests.map((guest) => (
                <div key={guest.id} className="guest-card">
                  <div className="guest-avatar">{guest.avatar}</div>
                  <div className="guest-info">
                    <h4>{guest.name}</h4>
                    <p>Telefone: {guest.phone}</p>
                  </div>
                  <div className="guest-actions">
                    {guest.isTitular ? (
                      <span className="titular-badge">Titular</span>
                    ) : (
                      <>
                        <button className="action-link titular" onClick={() => console.log('Definir titular', guest.id)}>Definir titular</button>
                        <button className="action-link remove" onClick={() => console.log('Remover', guest.id)}>Remover</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="section-divider consumption">
            <h2>Consumo</h2>
            <div className="bar" />
          </div>

          {/* Consumo */}
          <section className="consumption-section">
            <div className="section-header">
              <span></span>
              <button className="add-btn">+ Adicionar Consumo</button>
            </div>
            <div className="consumption-list">
              {modalData.consumption.map((item) => (
                <div key={item.id} className="consumption-item">
                  <div className="consumption-info">
                    <span className="consumption-name">{item.item}</span>
                    <span className="consumption-date">{item.date} {item.paymentMethod}</span>
                  </div>
                  <span className="consumption-value">R$ {item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="section-divider payments">
            <h2>Pagamentos</h2>
            <div className="bar" />
          </div>

          {/* Pagamentos */}
          <section className="payments-section">
            <div className="section-header">
              <span></span>
              <button className="add-btn">+ Adicionar Pagamento</button>
            </div>
            <div className="payments-list">
              {modalData.payments.map((payment) => (
                <div key={payment.id} className="payment-item">
                  <div className="payment-info">
                    <span className="payment-type">{payment.type}</span>
                    <span className="payment-date">{payment.date} {payment.paymentMethod}</span>
                  </div>
                  <span className="payment-value">R$ {payment.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="cancel-reservation-btn" onClick={onCancel}>Cancelar</button>
          <button className="finalize-btn" onClick={onFinalize}>Finalizar</button>
        </div>
      </div>
    </div>
  );
};

export default OvernightModal;