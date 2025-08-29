// src/components/ReservationEditorModal.jsx
import React, { useState } from "react";
import { Modal } from "./Modal.jsx";
import ReservationEditFormModal from "./ReservationEditFormModal.jsx";

// utilitário de formatação de valores em BRL
const brl = (n) =>
  (isFinite(n) ? n : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function ReservationEditorModal({
  open,
  onClose,
  reservation, // { id, roomId, checkin:'YYYY-MM-DD', checkout:'YYYY-MM-DD', people, ratePerPerson, guests:[], payments:[] }
  rooms = [],
  onUpdate, // <- vamos permitir que o pai (ReservationsPage) atualize a lista
}) {
  if (!reservation) return null;

  // controle do modal de edição
  const [editFormOpen, setEditFormOpen] = useState(false);

  const checkinDate = new Date(reservation.checkin);
  const checkoutDate = new Date(reservation.checkout);
  const nights = Math.max(
    1,
    Math.round((checkoutDate - checkinDate) / 86400000)
  );

  const nightly = reservation.ratePerPerson || 80;
  const total = nightly * nights * (reservation.people || 1);

  // usa hóspedes reais ou mocks
  const guests =
    reservation.guests && reservation.guests.length > 0
      ? reservation.guests
      : [
          {
            id: 1,
            name: "Amelia Santos Andrade",
            phone: "(98) 9 8787-9090",
            representative: true,
            checkin: reservation.checkin,
            checkout: reservation.checkout,
          },
          {
            id: 2,
            name: "Vicente Santos",
            phone: "(98) 9 8787-9090",
            representative: false,
            checkin: reservation.checkin,
            checkout: reservation.checkout,
          },
        ];

  // usa pagamentos reais ou mocks
  const payments =
    reservation.payments && reservation.payments.length > 0
      ? reservation.payments
      : [
          {
            id: 1,
            description: "Pagamento de meia diária",
            date: "07/04/2025 15:09",
            method: "CARTAO DE CREDITO",
            amount: total / 2,
          },
        ];

  const paid = payments.reduce((sum, p) => sum + p.amount, 0);
  const pending = total - paid;

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <div className="form-card" style={{ minWidth: 600 }}>
          {/* Cabeçalho */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <h3 className="form-card__title" style={{ margin: 0 }}>
              Reserva #{reservation.id}
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={() => setEditFormOpen(true)}>
                Editar Reserva
              </button>
              <button className="btn btn--danger">Cancelar</button>
            </div>
          </div>

          {/* Dados e Valores lado a lado */}
          <div
            className="cd-split"
            style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}
          >
            {/* Dados */}
            <div>
              <h4>Dados</h4>
              <div className="kv">
                <strong>Quarto:</strong>
                <span>{String(reservation.roomId).padStart(2, "0")}</span>
              </div>
              <div className="kv">
                <strong>Diárias:</strong>
                <span>{nights}</span>
              </div>
              <div className="kv">
                <strong>Checkin:</strong>
                <span>{checkinDate.toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="kv">
                <strong>Checkout:</strong>
                <span>{checkoutDate.toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="kv">
                <strong>Chegada prevista:</strong>
                <span>13:00</span>
              </div>
              <div className="kv">
                <strong>Saída prevista:</strong>
                <span>11:00</span>
              </div>
            </div>

            {/* Valores */}
            <div>
              <h4>Valores</h4>
              <div className="kv">
                <strong>Valor Diária:</strong>
                <span>{brl(nightly)}</span>
              </div>
              <div className="kv">
                <strong>Valor Total:</strong>
                <span>{brl(total)}</span>
              </div>
              <div className="kv" style={{ color: "green" }}>
                <strong>Pago:</strong>
                <span>{brl(paid)}</span>
              </div>
              <div className="kv" style={{ color: "red" }}>
                <strong>Falta Pagar:</strong>
                <span>{brl(pending)}</span>
              </div>
            </div>
          </div>

          {/* Hóspedes */}
          <h4>Hóspedes</h4>
          <div className="form-card" style={{ padding: 0 }}>
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
                <div style={{ fontSize: 12, color: "#444" }}>
                  {new Date(g.checkin).toLocaleDateString("pt-BR")} -{" "}
                  {new Date(g.checkout).toLocaleDateString("pt-BR")}
                </div>
              </div>
            ))}
          </div>

          {/* Pagamentos */}
          <h4 style={{ marginTop: 16 }}>Pagamentos</h4>
          <div className="form-card" style={{ padding: 0 }}>
            {payments.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
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
                <div style={{ fontWeight: 600 }}>{brl(p.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal de edição */}
      <ReservationEditFormModal
        open={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        reservation={reservation}
        onSave={(updated) => {
          if (onUpdate) onUpdate(updated); // avisa o pai para atualizar a lista
          setEditFormOpen(false);
        }}
      />
    </>
  );
}
