import React, { useState } from "react";
import { Modal } from "./Modal.jsx";
import { ROOMS } from "../data/rooms.js";

// Mock de hóspedes existentes (busca por nome ou CPF)
const ALL_GUESTS = [
  {
    id: 1,
    name: "Amelia Santos Andrade",
    cpf: "123.456.789-00",
    phone: "(98) 9 8787-9090",
  },
  {
    id: 2,
    name: "Vicente Santos",
    cpf: "987.654.321-00",
    phone: "(98) 9 8787-9090",
  },
  {
    id: 3,
    name: "Maria Lima",
    cpf: "111.222.333-44",
    phone: "(98) 98888-2222",
  },
];

export default function NewReservationModal({ open, onClose, onSave }) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [activeTab, setActiveTab] = useState("reserva");

  // Campos principais da reserva
  const [roomId, setRoomId] = useState("");
  const [checkin, setCheckin] = useState(today);
  const [checkout, setCheckout] = useState(tomorrow);
  const [arrival, setArrival] = useState("13:00");
  const [departure, setDeparture] = useState("11:00");

  // Hóspedes
  const [guests, setGuests] = useState([]);
  const [guestSearch, setGuestSearch] = useState("");

  // Pagamentos
  const [payments, setPayments] = useState([]);
  const [addingPayment, setAddingPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    description: "",
    method: "DINHEIRO",
    amount: "",
  });

  // Hóspedes
  function handleAddGuest(guest) {
    if (!guests.some((g) => g.id === guest.id)) {
      setGuests([
        ...guests,
        { ...guest, representative: guests.length === 0 }, // primeiro é representante
      ]);
    }
    setGuestSearch("");
  }
  function handleRemoveGuest(id) {
    const guest = guests.find((g) => g.id === id);
    if (guest?.representative) {
      alert("Não é possível remover o representante da reserva.");
      return;
    }
    setGuests(guests.filter((g) => g.id !== id));
  }
  function handleSetRepresentative(id) {
    setGuests(guests.map((g) => ({ ...g, representative: g.id === id })));
  }

  // Pagamentos
  function handleConfirmPayment() {
    if (!newPayment.description || !newPayment.amount) {
      alert("Preencha a descrição e o valor do pagamento.");
      return;
    }
    setPayments([
      ...payments,
      {
        id: Date.now(),
        description: newPayment.description,
        date: new Date().toLocaleString("pt-BR"),
        method: newPayment.method,
        amount: Number(newPayment.amount),
      },
    ]);
    setAddingPayment(false);
    setNewPayment({ description: "", method: "DINHEIRO", amount: "" });
  }
  function handleRemovePayment(id) {
    setPayments(payments.filter((p) => p.id !== id));
  }

  // Finalizar criação
  function handleSave() {
    const newReservation = {
      id: Date.now(),
      roomId,
      checkin: checkin.toISOString().split("T")[0],
      checkout: checkout.toISOString().split("T")[0],
      arrival,
      departure,
      guests,
      payments,
      people: guests.length,
      ratePerPerson: 80,
    };
    onSave(newReservation);
    onClose();
  }

  const filteredGuests = ALL_GUESTS.filter(
    (g) =>
      g.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
      g.cpf.includes(guestSearch)
  );

  return (
    <Modal open={open} onClose={onClose}>
      <div
        className="form-card"
        style={{
          maxWidth: 720,
          width: "100%",
          height: "80vh", // altura fixa
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Cabeçalho + Tabs */}
        <div style={{ borderBottom: "2px solid #eee", paddingBottom: 8 }}>
          <h3 className="form-card__title" style={{ marginBottom: 12 }}>
            Nova Reserva
          </h3>
          <div style={{ display: "flex", borderBottom: "2px solid #e0e0e0" }}>
            {[
              { key: "reserva", label: "Reserva" },
              { key: "hospedes", label: "Hóspedes" },
              { key: "pagamentos", label: "Pagamentos" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  color: activeTab === tab.key ? "#1976d2" : "#555",
                  background: activeTab === tab.key ? "#f1f7ff" : "transparent",
                  border: "none",
                  borderBottom:
                    activeTab === tab.key
                      ? "3px solid #1976d2"
                      : "3px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 6px" }}>
          {/* Aba Reserva */}
          {activeTab === "reserva" && (
            <>
              <div className="kv" style={{ marginBottom: 16 }}>
                <strong>Quarto:</strong>
                <select
                  className="control"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                >
                  <option value="">Selecione um quarto</option>{" "}
                  {/* 🔹 opção inicial */}
                  {ROOMS.map((r, idx) => (
                    <option key={idx} value={idx + 1}>
                      {r.numero} ({r.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="cd-split"
                style={{
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div>
                  <div
                    className="kv"
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <strong>Checkin:</strong>
                    <input
                      type="date"
                      min={today.toISOString().split("T")[0]}
                      value={checkin.toISOString().split("T")[0]}
                      onChange={(e) => setCheckin(new Date(e.target.value))}
                      className="control"
                    />
                  </div>
                  <div
                    className="kv"
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <strong>Checkout:</strong>
                    <input
                      type="date"
                      min={checkin.toISOString().split("T")[0]}
                      value={checkout.toISOString().split("T")[0]}
                      onChange={(e) => setCheckout(new Date(e.target.value))}
                      className="control"
                    />
                  </div>
                </div>
                <div>
                  <div
                    className="kv"
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <strong>Chegada prevista:</strong>
                    <input
                      type="time"
                      value={arrival}
                      onChange={(e) => setArrival(e.target.value)}
                      className="control"
                    />
                    <input
                      type="time"
                      value={departure}
                      onChange={(e) => setDeparture(e.target.value)}
                      className="control"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Aba Hóspedes */}
          {activeTab === "hospedes" && (
            <>
              <input
                type="text"
                placeholder="Buscar por nome ou CPF"
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                style={{
                  padding: "6px 10px",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  marginBottom: 12,
                  width: "100%",
                }}
              />
              {guestSearch && (
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #ddd",
                    marginBottom: 12,
                    maxHeight: 120,
                    overflowY: "auto",
                  }}
                >
                  {filteredGuests.length > 0 ? (
                    filteredGuests.map((g) => (
                      <div
                        key={g.id}
                        onClick={() => handleAddGuest(g)}
                        style={{
                          padding: "6px 10px",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {g.name} — {g.cpf}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 6, color: "#777" }}>
                      Nenhum hóspede encontrado
                    </div>
                  )}
                </div>
              )}
              <div
                className="form-card"
                style={{ padding: 0, marginBottom: 24 }}
              >
                {guests.map((g) => (
                  <div
                    key={g.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <img
                      src={`https://i.pravatar.cc/40?u=${g.id}`}
                      alt={g.name}
                      style={{ borderRadius: "50%" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>
                        {g.name}{" "}
                        {g.representative && (
                          <span style={{ color: "#1976d2", fontSize: 12 }}>
                            Representante
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "#555" }}>
                        Telefone: {g.phone}
                      </div>
                    </div>
                    {!g.representative && (
                      <button
                        className="btn"
                        onClick={() => handleSetRepresentative(g.id)}
                      >
                        Definir Representante
                      </button>
                    )}
                    {!g.representative && (
                      <button
                        className="btn btn--danger"
                        onClick={() => handleRemoveGuest(g.id)}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Aba Pagamentos */}
          {activeTab === "pagamentos" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: 12,
                }}
              >
                {!addingPayment && (
                  <button
                    className="btn btn--primary"
                    onClick={() => setAddingPayment(true)}
                  >
                    + Adicionar Pagamento
                  </button>
                )}
              </div>
              {addingPayment && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 16,
                    border: "1px solid #ddd",
                    padding: "10px",
                    borderRadius: 6,
                    background: "#fafafa",
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Descrição"
                    value={newPayment.description}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        description: e.target.value,
                      })
                    }
                    className="control"
                    style={{ flex: "1 1 150px" }}
                  />
                  <select
                    value={newPayment.method}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, method: e.target.value })
                    }
                    className="control"
                    style={{ flex: "1 1 120px" }}
                  >
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="PIX">Pix</option>
                    <option value="CARTAO_DEBITO">Cartão Débito</option>
                    <option value="CARTAO_CREDITO">Cartão Crédito</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Valor"
                    value={newPayment.amount}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, amount: e.target.value })
                    }
                    className="control"
                    style={{ flex: "1 1 100px" }}
                  />
                  <button
                    className="btn btn--primary"
                    onClick={handleConfirmPayment}
                  >
                    Confirmar
                  </button>
                  <button
                    className="btn btn--danger"
                    onClick={() => setAddingPayment(false)}
                  >
                    Cancelar
                  </button>
                </div>
              )}
              <div
                className="form-card"
                style={{ padding: 0, marginBottom: 24 }}
              >
                {payments.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <div>
                      <div>{p.description}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {p.date} {p.method}
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <strong>R$ {p.amount},00</strong>
                      <button
                        className="btn btn--danger"
                        onClick={() => handleRemovePayment(p.id)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Rodapé fixo */}
        <div
          className="form-actions"
          style={{
            borderTop: "1px solid #eee",
            padding: "12px 0",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn--primary" onClick={handleSave}>
            Confirmar Reserva
          </button>
        </div>
      </div>
    </Modal>
  );
}
