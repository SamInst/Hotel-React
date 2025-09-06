// Dashboard component - adicione antes do calendário
import React, { useMemo, useState, useEffect } from 'react';
import { Modal } from "../components/Modal.jsx";

// Ícones (caminhos informados)
import keyIcon from "../icons/chave.png";
import solicitacaoIcon from "../icons/solicitacao de reserva.png";
import pessoasIcon from "../icons/pessoas.png";

/* =========================
   Componente para animar números
   ========================= */
function AnimatedNumber({ value, duration = 700 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime = null;
    const start = 0; // sempre anima a partir de 0 para dar sensação de atualização
    const end = Number(value) || 0;
    let raf;

    const animate = (t) => {
      if (startTime === null) startTime = t;
      const progress = Math.min((t - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(start + (end - start) * eased);
      setDisplayValue(current);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

/* =========================
   MiniCard Estatístico (ícone + valor + legenda)
   ========================= */
function MiniStat({ iconSrc, value, label, accent = '#2d3748' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      minWidth: 160,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#eef2ff', border: '1px solid #e5e7eb'
      }}>
        <img src={iconSrc} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
      </div>
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: accent }}>
          <AnimatedNumber value={value} />
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Modal de Solicitação de Reserva
   ========================= */
function ReservationRequestModal({
  open,
  onClose,
  reservation,
  onConfirm,
  onCancel,
  rooms = []
}) {
  if (!reservation) return null;

  // inicialmente não deixar nenhum quarto selecionado
  const [selectedRoom, setSelectedRoom] = useState('');
  const [observacao, setObservacao] = useState('');

  // sempre que abrir um novo "reservation", resetar seleção
  useEffect(() => {
    setSelectedRoom('');
    setObservacao('');
  }, [reservation]);

  const checkinDate = new Date(reservation.start);
  const checkoutDate = new Date(reservation.end);
  const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
  const dailyRate = 80;
  const totalValue = nights * dailyRate;
  const paidAmount = 160;
  const remainingAmount = totalValue - paidAmount;

  // Mock de dados dos hóspedes (em um sistema real, viria da reserva)
  const guests = [
    {
      id: 1,
      name: "Amelia Santos Andrade",
      cpf: "123.456.789-00",
      phone: "(98) 9 8787-9090",
      birthDate: "12/12/2002",
      rg: "033.567.765.009-2",
      email: "EMAIL@EMAIL.COM",
      gender: "Feminino",
      nationality: "Viana, Maranhão, Brasil",
      profession: "Engenheira de Software",
      isRepresentative: true
    },
    {
      id: 2,
      name: "Vicente Santos",
      cpf: "123.456.789-00", 
      phone: "(98) 9 8787-9090",
      birthDate: "12/12/2002",
      rg: "033.567.765.009-2",
      email: "EMAIL@EMAIL.COM",
      gender: "Feminino",
      nationality: "Viana, Maranhão, Brasil",
      profession: "Engenheira de Software",
      isRepresentative: false
    }
  ];

  const formatDate = (date) => date.toLocaleDateString("pt-BR");

  // Opções do combo de quartos (fallback simples se não vier "rooms")
  const roomOptions = (rooms && rooms.length > 0)
    ? rooms.map(r => ({ id: r.id ?? r.roomId ?? r, label: `Quarto ${String((r.id ?? r.roomId ?? r)).toString().padStart(2, '0')}` }))
    : Array.from({ length: 20 }, (_, i) => ({ id: i + 1, label: `Quarto ${String(i + 1).padStart(2, '0')}` }));

  return (
    <Modal 
      open={open} 
      onClose={onClose}
      dialogStyle={{
        width: '760px',
        maxWidth: '95vw',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}
      backdropStyle={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Cabeçalho enxuto */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f9fafb",
          flexShrink: 0,
          gap: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, background: "#f97316",
              borderRadius: 10, display: "flex", alignItems: "center",
              justifyContent: "center", color: "#fff", fontWeight: 800
            }}>R</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1f2937" }}>
              Solicitação de Reserva
            </h2>
          </div>
        </div>

        {/* Conteúdo com rolagem (botões fixos ficam fora desta área) */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
          {/* Dados solicitados */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 700, color: "#1f2937" }}>
              Dados solicitados
            </h3>

            {/* Linha 1: Quarto (combo) ocupando a linha inteira */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>Quarto</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  outline: "none",
                  fontSize: 14,
                  background: "#fff"
                }}
              >
                <option value="" disabled>Selecione um quarto</option>
                {roomOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Demais campos abaixo, em grid responsivo */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16
            }}>
              <div>
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 4, fontWeight: 600 }}>
                  Check-in
                </div>
                <div style={{ fontSize: 16, color: "#111827" }}>
                  {formatDate(checkinDate)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 4, fontWeight: 600 }}>
                  Chegada Prevista
                </div>
                <div style={{ fontSize: 16, color: "#111827" }}>13:00</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 4, fontWeight: 600 }}>
                  Diárias
                </div>
                <div style={{ fontSize: 16, color: "#111827" }}>{nights}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 4, fontWeight: 600 }}>
                  Checkout
                </div>
                <div style={{ fontSize: 16, color: "#111827" }}>
                  {formatDate(checkoutDate)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 4, fontWeight: 600 }}>
                  Saída Prevista
                </div>
                <div style={{ fontSize: 16, color: "#111827" }}>11:00</div>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 700, color: "#1f2937" }}>
              Valores
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 32
            }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: "#1f2937" }}><strong>Valor Diária:</strong></span>
                  <span style={{ fontSize: 14, color: "#1f2937" }}>R$ {dailyRate.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, color: "#1f2937" }}><strong>Valor Total:</strong></span>
                  <span style={{ fontSize: 14, color: "#1f2937" }}>R$ {totalValue.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: "#10b981" }}><strong>Pago:</strong></span>
                  <span style={{ fontSize: 14, color: "#10b981", fontWeight: 700 }}>R$ {paidAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, color: "#f59e0b" }}><strong>Falta Pagar:</strong></span>
                  <span style={{ fontSize: 14, color: "#f59e0b", fontWeight: 700 }}>R$ {remainingAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Observação */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
              Observação
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              placeholder="Escreva aqui alguma observação relevante para a reserva..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #d1d5db',
                outline: 'none',
                fontSize: 14,
                resize: 'vertical',
                background: '#fff'
              }}
            />
          </div>

          {/* Pessoas */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ 
              margin: "0 0 16px 0", 
              fontSize: 18, 
              fontWeight: 700, 
              color: "#1f2937",
              background: "#f3f4f6",
              padding: "10px 14px",
              borderRadius: 10
            }}>
              Pessoas
            </h3>
            
            <div style={{ background: "#ffffff" }}>
              {guests.map((guest, index) => (
                <div key={guest.id} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  padding: "16px 0",
                  borderBottom: index < guests.length - 1 ? "1px solid #e5e7eb" : "none"
                }}>
                  <div style={{ marginRight: 16, position: "relative" }}>
                    <img
                      src={`https://i.pravatar.cc/80?u=${guest.id}`}
                      alt={guest.name}
                      style={{ width: 72, height: 72, borderRadius: "50%" }}
                    />
                    {guest.isRepresentative && (
                      <div style={{
                        position: "absolute",
                        bottom: -8,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#3b82f6",
                        color: "white",
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        whiteSpace: "nowrap"
                      }}>
                        Titular
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
                      {guest.name}
                    </h4>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "6px 24px",
                      fontSize: 14,
                      color: "#4b5563"
                    }}>
                      <div><strong>CPF:</strong> {guest.cpf}</div>
                      <div><strong>Nascimento:</strong> {guest.birthDate} (21 anos)</div>
                      <div><strong>Telefone:</strong> {guest.phone}</div>
                      <div><strong>RG:</strong> {guest.rg}</div>
                      <div><strong>Email:</strong> {guest.email}</div>
                      <div><strong>Gênero:</strong> {guest.gender}</div>
                      <div><strong>Nacionalidade:</strong> {guest.nationality}</div>
                      <div><strong>Estado Civil:</strong> Solteira</div>
                      <div style={{ gridColumn: "1 / -1" }}><strong>Profissão:</strong> {guest.profession}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagamentos */}
          <div>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 18, fontWeight: 700, color: "#1f2937" }}>
              Pagamentos
            </h3>
            <div style={{ background: "#f9fafb", borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1f2937", marginBottom: 4 }}>
                    Pagamento de 50%
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    07/04/2025 15:09 CARTÃO DE CRÉDITO
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
                  R$ {paidAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé fixo com botões (separados da rolagem) */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid #e5e7eb",
          background: "#fff",
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          flexShrink: 0
        }}>
          <button
            onClick={onCancel}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm({ roomId: selectedRoom, observacao })}
            disabled={!selectedRoom}
            style={{
              background: !selectedRoom ? "#93c5fd" : "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 700,
              cursor: !selectedRoom ? "not-allowed" : "pointer",
              opacity: !selectedRoom ? 0.8 : 1
            }}
            title={!selectedRoom ? "Selecione um quarto" : "Confirmar reserva"}
          >
            Confirmar Reserva
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* =========================
   Dashboard
   ========================= */
function ModernDashboard({ reservations, rooms, selectedDay }) {
  const today = new Date();

  // Estado para o modal de solicitação
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const isSameDate = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const formatDateShort = (d) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const stats = useMemo(() => {
    const selectedKey = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`;

    // Reservas no dia selecionado (ocupação por quarto)
    const dayReservations = reservations.filter(r =>
      selectedKey >= r.start && selectedKey <= r.end
    );

    // "Solicitações pelo site" → exemplo: próximas chegadas nos próximos 7 dias
    const upcomingArrivals = reservations.filter(r => {
      const startDate = new Date(r.start);
      const diffTime = startDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });

    const totalRooms = rooms.length;
    const dayOccupied = dayReservations.length;
    const dayAvailable = Math.max(0, totalRooms - dayOccupied);
    const dayOccupancyRate = totalRooms > 0 ? Math.round((dayOccupied / totalRooms) * 100) : 0;

    // Se você tiver "people" em cada reserva, troque o cálculo abaixo por essa soma
    const dayGuests = dayReservations.length;

    return {
      totalRooms,
      dayOccupied,
      dayAvailable,
      dayOccupancyRate,
      dayGuests,
      arrivalsList: upcomingArrivals.slice(0, 3),
      arrivalsCount: upcomingArrivals.length
    };
  }, [reservations, rooms, selectedDay, today]);

  // Modal handlers
  const handleRequestClick = (reservation) => {
    setSelectedRequest(reservation);
    setRequestModalOpen(true);
  };
  const handleConfirmReservation = (payload) => {
    console.log('Reserva confirmada:', selectedRequest, payload);
    setRequestModalOpen(false);
    setSelectedRequest(null);
  };
  const handleCancelReservation = () => {
    console.log('Reserva cancelada:', selectedRequest);
    setRequestModalOpen(false);
    setSelectedRequest(null);
  };

  const ProgressBar = ({ value, max, color = '#4f8c79' }) => (
    <div style={{
      width: '100%',
      height: 8,
      backgroundColor: '#e2e8f0',
      borderRadius: 4,
      overflow: 'hidden'
    }}>
      <div style={{
        width: `${Math.min(100, (value / max) * 100)}%`,
        height: '100%',
        backgroundColor: color,
        borderRadius: 4,
        transition: 'width 0.4s ease'
      }} />
    </div>
  );

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        {/* GRID DE DETALHES */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
          gap: 20
        }}>
          {/* Card: Reservas Solicitadas pelo site (com MiniCard) */}
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={solicitacaoIcon} alt="Solicitações" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#2d3748' }}>
                  Reservas Solicitadas pelo site
                </h3>
              </div>
              <MiniStat
                iconSrc={solicitacaoIcon}
                value={stats.arrivalsCount}
                label="Solicitações (7 dias)"
                accent="#1f2937"
              />
            </div>

            {stats.arrivalsList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.arrivalsList.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => handleRequestClick(res)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 12,
                      background: '#f7fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      width: '100%',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#edf2f7';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f7fafc';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#2d3748' }}>
                        Quarto {String(res.roomId).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: 12, color: '#718096' }}>
                        {res.title?.length > 28 ? `${res.title.substring(0, 28)}...` : res.title}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#4f8c79' }}>
                        {new Date(res.start).toLocaleDateString('pt-BR')}
                      </div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                        Clique para ver detalhes
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#718096', padding: 20, fontSize: 14 }}>
                Nenhuma solicitação nos próximos 7 dias
              </div>
            )}
          </div>

          {/* Card: Status dos Quartos (data selecionada) + MiniCard "Hóspedes" */}
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={keyIcon} alt="Status dos Quartos" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#2d3748' }}>
                  {isSameDate(selectedDay, today)
                    ? "Status dos Quartos Hoje"
                    : `Status dos Quartos ${formatDateShort(selectedDay)}`}
                </h3>
              </div>
              <MiniStat
                iconSrc={pessoasIcon}
                value={stats.dayGuests}
                label="Hóspedes"
                accent="#2d3748"
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#2d3748' }}>Ocupados</span>
                  <span style={{ fontSize: 14, color: '#718096' }}>
                    <AnimatedNumber value={stats.dayOccupied} />/{stats.totalRooms}
                  </span>
                </div>
                <ProgressBar value={stats.dayOccupied} max={stats.totalRooms} color="#e53e3e" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#2d3748' }}>Disponíveis</span>
                  <span style={{ fontSize: 14, color: '#718096' }}>
                    <AnimatedNumber value={stats.dayAvailable} />/{stats.totalRooms}
                  </span>
                </div>
                <ProgressBar value={stats.dayAvailable} max={stats.totalRooms} color="#38a169" />
              </div>
            </div>

            {/* Taxa de Ocupação */}
            <div style={{
              marginTop: 20,
              padding: 16,
              background: '#f0fff4',
              borderRadius: 8,
              border: '1px solid #c6f6d5'
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#2f855a', textAlign: 'center' }}>
                Taxa de Ocupação: <AnimatedNumber value={stats.dayOccupancyRate} />%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Solicitação de Reserva */}
      <ReservationRequestModal
        open={requestModalOpen}
        onClose={() => {
          setRequestModalOpen(false);
          setSelectedRequest(null);
        }}
        reservation={selectedRequest}
        rooms={rooms}
        onConfirm={handleConfirmReservation}
        onCancel={handleCancelReservation}
      />
    </>
  );
}

export default ModernDashboard;
