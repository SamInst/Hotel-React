import React, { useState, useMemo } from "react";
import "./OvernightModal.css";
import DateRangePicker from "../components/DateRangePicker";

const pad = (n) => n.toString().padStart(2, "0");

// utilitários simples
const formatCurrency = (value) =>
  (value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const AddOvernightModal = ({ isOpen, onClose, onSave }) => {
  const [room, setRoom] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [checkinTime, setCheckinTime] = useState("13:00");
  const [checkoutTime, setCheckoutTime] = useState("11:00");
  const [guests, setGuests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);

  const availableRooms = [
    { id: "01", name: "Quarto 01 - Standard", price: 80 },
    { id: "02", name: "Quarto 02 - Deluxe", price: 120 },
    { id: "03", name: "Quarto 03 - Suite", price: 200 },
  ];

  const handleAddGuest = () => {
    const name = prompt("Nome do hóspede:");
    if (name)
      setGuests((prev) => [
        ...prev,
        { id: Date.now(), name, avatar: name.charAt(0).toUpperCase() },
      ]);
  };

  const handleRemoveGuest = (id) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  const handleAddPayment = () => {
    const val = prompt("Valor do pagamento (R$):");
    if (!val) return;
    const numeric = parseFloat(val.replace(",", "."));
    setPayments((prev) => [
      ...prev,
      {
        id: Date.now(),
        description: "Pagamento",
        paymentMethod: "DINHEIRO",
        value: numeric,
      },
    ]);
  };

  // cálculo de valor total
  const totalDiarias = useMemo(() => {
    if (!room || !startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dias = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const roomPrice = availableRooms.find((r) => r.id === room)?.price || 0;
    return dias * roomPrice;
  }, [room, startDate, endDate]);

  const totalPayments = payments.reduce((sum, p) => sum + p.value, 0);
  const totalPending = Math.max(0, totalDiarias - totalPayments);

  const handleSave = () => {
    onSave?.({
      room,
      startDate,
      endDate,
      checkinTime,
      checkoutTime,
      guests,
      payments,
      total: totalDiarias,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content add-daily-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <span className="pernoite-icon">🛏️</span>
            <span>Adicionar Novo Pernoite</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Seleção de quarto */}
          <section>
            <h3>Selecionar Quarto</h3>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 8 }}
            >
              <option value="">Selecione o quarto</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — R$ {r.price.toFixed(2)}/dia
                </option>
              ))}
            </select>
          </section>

          {/* Período */}
          <section>
            <h3>Período da Estadia</h3>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
              }}
              placeholder="Selecionar período"
            />
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "12px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <label>Hora de Check-in:</label>
                <input
                  type="time"
                  value={checkinTime}
                  onChange={(e) => setCheckinTime(e.target.value)}
                />
              </div>
              <div>
                <label>Hora de Check-out:</label>
                <input
                  type="time"
                  value={checkoutTime}
                  onChange={(e) => setCheckoutTime(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Hóspedes */}
          <section>
            <div className="section-header">
              <h3>Hóspedes ({guests.length})</h3>
              <button className="add-btn" onClick={handleAddGuest}>
                + Adicionar Hóspede
              </button>
            </div>
            {guests.length === 0 ? (
              <div className="no-guests">Nenhum hóspede adicionado</div>
            ) : (
              <div className="guests-list scrollable-list">
                {guests.map((g) => (
                  <div key={g.id} className="guest-card">
                    <div className="guest-avatar">{g.avatar}</div>
                    <div className="guest-info">
                      <h4>{g.name}</h4>
                    </div>
                    <button
                      className="action-link remove"
                      onClick={() => handleRemoveGuest(g.id)}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pagamentos */}
          <section>
            <div className="section-header">
              <h3>Pagamentos ({payments.length})</h3>
              <button className="add-btn" onClick={handleAddPayment}>
                + Adicionar Pagamento
              </button>
            </div>
            {payments.length === 0 ? (
              <div className="no-payments">Nenhum pagamento registrado</div>
            ) : (
              <div className="payments-list scrollable-list">
                {payments.map((p) => (
                  <div key={p.id} className="payment-item">
                    <div className="payment-info">
                      <span className="payment-type">{p.description}</span>
                      <span className="payment-date">{p.paymentMethod}</span>
                    </div>
                    <span className="payment-value">
                      {formatCurrency(p.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Resumo */}
          <section>
            <h3>Resumo Financeiro</h3>
            <div className="summary-info">
              <span>
                Valor Total do Pernoite: <strong>{formatCurrency(totalDiarias)}</strong>
              </span>
              <span>
                Total Pago: <strong>{formatCurrency(totalPayments)}</strong>
              </span>
              <span>
                Falta Pagar: <strong>{formatCurrency(totalPending)}</strong>
              </span>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!room || !startDate || !endDate}
          >
            Salvar Pernoite
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOvernightModal;
