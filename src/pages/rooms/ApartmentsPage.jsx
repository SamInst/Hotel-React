import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  AddCategoryModal,
  AddRoomModal,
  RoomDetailsModal,
} from "../../components/Modals.jsx";
import "./ApartmentsPage.css";


import {
  getRooms,
  getCategories,
  createRoomFromUI,
  updateRoomFromUI,
  adaptRoomsResponseToUI,
  adaptCategoriesToLegacyMap,
  ROOM_STATUS_CODE,
} from "../../config/endpoints.js";


/* ===================== Toasts ===================== */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((type, message, { timeout = 4500 } = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts, { id, type, message }]);
    if (timeout) setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), timeout);
  }, []);
  const remove = useCallback((id) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  return { toasts, push, remove };
}


function Toasts({ toasts, onClose }) {
  return (
    <div className="toasts-container" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`} role="alert">
          <div className="toast-content">
            <span className="toast-icon">{t.type === "error" ? "⚠️" : "ℹ️"}</span>
            <span className="toast-message">{t.message}</span>
          </div>
          <button className="toast-close" onClick={() => onClose(t.id)} aria-label="Fechar">×</button>
        </div>
      ))}
    </div>
  );
}


/* ===================== Loading overlay ===================== */
function LoadingOverlay({ show, label = "Carregando..." }) {
  if (!show) return null;
  return (
    <div className="loading-overlay" aria-busy="true" aria-live="polite">
      <div className="spinner" />
      <div className="loading-text">{label}</div>
    </div>
  );
}


/* ===================== Helpers ===================== */
function statusClass(s) {
  switch (s) {
    case 1: return "card--ocupado";
    case 2: return "card--disponivel";
    case 3: return "card--reservado";
    case 4: return "card--limpeza";
    case 5: return "card--diaria";
    case 6: return "card--manutencao";
    default: return "";
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 1: return "Ocupado";
    case 2: return "Disponível";
    case 3: return "Reservado";
    case 4: return "Em Limpeza";
    case 5: return "Diária Encerrada";
    case 6: return "Manutenção";
    default: return "Indefinido";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 1: return "👤";
    case 2: return "✓";
    case 3: return "📅";
    case 4: return "🧹";
    case 5: return "⏰";
    case 6: return "🔧";
    default: return "❓";
  }
}

function getStatusColor(status) {
  switch (status) {
    case 1: return "#ef4444";
    case 2: return "#22c55e";
    case 3: return "#f59e0b";
    case 4: return "#eab308";
    case 5: return "#a855f7";
    case 6: return "#6b7280";
    default: return "#9ca3af";
  }
}

function brToDate(s) {
  if (!s) return null;
  const [d, m, y] = s.split("/").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function within(target, start, end) {
  if (!target || !start || !end) return false;
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return t >= a && t <= b;
}

function statusByDate(room, date) {
  if (!date) return room.status;
  const inOcc =
    room.entrada && room.saida &&
    within(date, brToDate(room.entrada), brToDate(room.saida));
  if (inOcc) return 1;
  const hasReserva =
    room.reservaInicio && room.reservaFim &&
    within(date, brToDate(room.reservaInicio), brToDate(room.reservaFim));
  if (hasReserva) return 3;
  return room.status;
}

function initialsFromName(name) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || (parts.length > 1 ? parts[parts.length - 1]?.[0] : "");
  return (first + second).toUpperCase();
}

function formatBeds(room) {
  const b = room?.beds || mockBedsByCapacity(room?.pessoas);
  const map = { casal: "casal", solteiro: "solteiro", rede: "rede", beliche: "beliche" };
  const chunks = [];
  Object.entries(map).forEach(([key, label]) => {
    const qtd = Number(b[key] || 0);
    if (qtd > 0) chunks.push(`${qtd} ${label}${qtd > 1 ? "s" : ""}`);
  });
  return chunks.length ? chunks.join(", ") : "disposição não informada";
}

function mockBedsByCapacity(cap = 1) {
  if (cap <= 1) return { solteiro: 1 };
  if (cap === 2) return { casal: 1 };
  if (cap === 3) return { casal: 1, solteiro: 1 };
  if (cap === 4) return { casal: 1, solteiro: 2 };
  return { beliche: Math.ceil(cap / 2) };
}

function allowedTransitions(current) {
  if ([1, 3, 5].includes(current)) return [];
  if (current === 2) return [4, 6];
  if ([4, 6].includes(current)) return [2];
  return [];
}

const roomCardStyles = {
  card: {
    background: "#fff",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    transition: "0.2s",
    display: "flex",
    flexDirection: "column",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderLeft: "4px solid",
    gap: "12px",
  },
  roomNumberSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
  },
  statusIcon: { fontSize: "24px" },
  roomNumber: { fontSize: "16px", fontWeight: 600, margin: "0 0 4px 0" },
  roomType: { fontSize: "12px", color: "#6b7280" },
  statusBadge: {
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  cardBody: {
    padding: "16px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  description: {
    fontSize: "13px",
    color: "#374151",
    margin: 0,
    background: "#f3f4f6",
    padding: "8px",
    borderRadius: "6px",
  },
  guestSection: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    paddingBottom: "12px",
    borderBottom: "1px solid #e5e7eb",
  },
  guestAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#3b82f6",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    flexShrink: 0,
  },
  guestInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  guestName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  guestDetail: {
    fontSize: "12px",
    color: "#6b7280",
    margin: 0,
  },
  roomDetails: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    fontSize: "13px",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  detailLabel: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: "13px",
    color: "#1f2937",
    fontWeight: "500",
  },
  checkDates: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  dateItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  dateLabel: {
    fontSize: "11px",
    color: "#6b7280",
    fontWeight: "600",
  },
  dateValue: {
    fontSize: "13px",
    color: "#1f2937",
    fontWeight: "500",
  },
  time: {
    fontSize: "11px",
    color: "#9ca3af",
    marginLeft: "4px",
  },
  infoBox: {
    background: "#f3f4f6",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
  },
  infoMessage: {
    fontSize: "13px",
    color: "#374151",
    margin: "0 0 8px 0",
    fontWeight: "500",
  },
  maintenanceInfo: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "4px 0",
  },
  cardFooter: {
    display: "flex",
    gap: "8px",
    padding: "12px 16px",
    borderTop: "1px solid #e5e7eb",
    background: "#f9fafb",
  },
  detailsBtn: {
    flex: 1,
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#3b82f6",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "0.2s",
  }
};


// Novo componente para renderização dos cards no novo design
function RoomCard({ room, displayStatus, onDetails }) {
  const statusColor = getStatusColor(displayStatus);
  const statusIcon = getStatusIcon(displayStatus);

  // Conteúdo do card conforme status
  function renderContent() {
    if (displayStatus === 2) {
      return (
        <>
          {room.descricao && <p style={roomCardStyles.description}>📝 {room.descricao}</p>}
          <div style={roomCardStyles.roomDetails}>
            <div style={roomCardStyles.detailItem}>
              <span style={roomCardStyles.detailLabel}>Capacidade</span>
              <span style={roomCardStyles.detailValue}>{room.pessoas} pessoa(s)</span>
            </div>
            <div style={roomCardStyles.detailItem}>
              <span style={roomCardStyles.detailLabel}></span>
              <span style={roomCardStyles.detailValue}>{formatBeds(room)}</span>
            </div>
          </div>
        </>
      );
    }
    if (displayStatus === 1 || displayStatus === 3 || displayStatus === 5) {
      const name = room.representante || room.reservaNome;
      return (
        <>
          <div style={roomCardStyles.guestSection}>
            <div style={roomCardStyles.guestAvatar}>{initialsFromName(name)}</div>
            <div style={roomCardStyles.guestInfo}>
              <p style={roomCardStyles.guestName}>{name}</p>
              <p style={roomCardStyles.guestDetail}>{room.cpf || room.reservaCpf || "—"}</p>
              <p style={roomCardStyles.guestDetail}>{room.telefone || room.reservaTelefone || "—"}</p>
            </div>
          </div>
          <div style={roomCardStyles.checkDates}>
            {displayStatus !== 5 && (room.entrada || room.reservaInicio) && (
              <div style={roomCardStyles.dateItem}>
                <span style={roomCardStyles.dateLabel}>Check-in</span>
                <span style={roomCardStyles.dateValue}>
                  {room.entrada || room.reservaInicio} <span style={roomCardStyles.time}>{room.horaEntrada || room.horaReservaEntrada || "--:--"}</span>
                </span>
              </div>
            )}
            {(room.saida || room.reservaFim) && (
              <div style={roomCardStyles.dateItem}>
                <span style={roomCardStyles.dateLabel}>Check-out</span>
                <span style={roomCardStyles.dateValue}>
                  {room.saida || room.reservaFim} {displayStatus !== 3 && <span style={roomCardStyles.time}>{room.horaSaida || room.horaReservaSaida || "--:--"}</span>}
                </span>
              </div>
            )}
          </div>
        </>
      );
    }
    if ([4, 6].includes(displayStatus)) {
      return (
        <div style={roomCardStyles.infoBox}>
          <p style={roomCardStyles.infoMessage}>
            {displayStatus === 4
              ? "🧹 Quarto em processo de limpeza. Será liberado para disponível após conclusão."
              : "🔧 Quarto em manutenção"}
          </p>
          {displayStatus === 6 && room.manutencaoInicio && (
            <p style={roomCardStyles.maintenanceInfo}>Início: {room.manutencaoInicio}</p>
          )}
          {displayStatus === 6 && room.manutencaoFim && (
            <p style={roomCardStyles.maintenanceInfo}>Término: {room.manutencaoFim}</p>
          )}
        </div>
      );
    }
  }

  return (
    <div style={roomCardStyles.card}>
      <div style={{ ...roomCardStyles.cardHeader, borderLeftColor: statusColor, backgroundColor: statusColor + "15" }}>
        <div style={roomCardStyles.roomNumberSection}>
          <span style={roomCardStyles.statusIcon}>{statusIcon}</span>
          <div>
            <h3 style={{ ...roomCardStyles.roomNumber, color: statusColor }}>Quarto {room.numero}</h3>
            <span style={roomCardStyles.roomType}>{room.tipo}</span>
          </div>
        </div>
        <span style={{ ...roomCardStyles.statusBadge, backgroundColor: statusColor }}>
          {getStatusLabel(displayStatus)}
        </span>
      </div>

      <div style={roomCardStyles.cardBody}>
        {renderContent()}
      </div>

      <div style={roomCardStyles.cardFooter}>
        <button style={roomCardStyles.detailsBtn} onClick={() => onDetails(room)}>
          Ver Detalhes
        </button>
      </div>
    </div>
  );
}


/* ===================== Página Principal ===================== */
export function ApartmentsPage() {
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusDate, setStatusDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toasts, push: notify, remove: closeToast } = useToasts();
  const [categoriesMap, setCategoriesMap] = useState({});


  const reloadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const dateIso = statusDate || undefined;
      const statusCode = filter === "all" ? undefined : Number(filter);
      const search = searchTerm || undefined;
      const apiData = await getRooms({ date: dateIso, statusCode, search });
      const adapted = adaptRoomsResponseToUI(apiData);
      const withBeds = adapted.map((r) =>
        r.status === ROOM_STATUS_CODE.DISPONIVEL && !r.beds
          ? { ...r, beds: mockBedsByCapacity(r.pessoas) }
          : r
      );
      setRooms(withBeds);
    } catch (err) {
      console.error(err);
      notify("error", "Não foi possível carregar os quartos. Verifique o servidor.");
    } finally {
      setLoading(false);
    }
  }, [filter, statusDate, searchTerm, notify]);


  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const cats = await getCategories();
        if (!isCancelled) setCategoriesMap(adaptCategoriesToLegacyMap(cats));
      } catch (e) {
        console.error(e);
        notify("error", "Falha ao carregar categorias.");
      }
    })();
    return () => { isCancelled = true; };
  }, [notify]);


  useEffect(() => { reloadRooms(); }, [reloadRooms]);


  const dateView = useMemo(() => {
    if (!statusDate) return null;
    const [y, m, d] = statusDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [statusDate]);


  const counts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, all: rooms.length };
    rooms.forEach((r) => {
      const s = statusByDate(r, dateView);
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [rooms, dateView]);


  const filtered = useMemo(() => {
    let result = rooms.slice();
    if (filter !== "all") result = result.filter((r) => statusByDate(r, dateView) === filter);

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      const numeric = searchTerm.replace(/\D/g, "");
      result = result.filter((r) => {
        const numero = String(r.numero || "").toLowerCase();
        const nome = String(r.representante || r.reservaNome || "").toLowerCase();
        const cpf = String(r.cpf || r.reservaCpf || "").replace(/\D/g, "");
        return (
          numero.includes(termLower) ||
          nome.includes(termLower) ||
          (numeric && cpf.includes(numeric))
        );
      });
    }
    return result;
  }, [rooms, filter, searchTerm, dateView]);


  const groups = useMemo(() => {
    const g = {};
    filtered.forEach((r) => {
      if (!g[r.tipo]) g[r.tipo] = [];
      g[r.tipo].push(r);
    });
    return g;
  }, [filtered]);


  const openDetails = (room) => {
    setSelectedRoom(room);
    setShowDetails(true);
  };

  const FILTERS = [
    { key: "all", label: "Todos", count: counts.all, color: "blue", icon: "🏠" },
    { key: 2, label: "Disponíveis", count: counts[2], color: "green", icon: "✓" },
    { key: 1, label: "Ocupados", count: counts[1], color: "red", icon: "👤" },
    { key: 3, label: "Reservados", count: counts[3], color: "orange", icon: "📅" },
    { key: 5, label: "Diária Encerrada", count: counts[5], color: "purple", icon: "⏰" },
    { key: 4, label: "Em limpeza", count: counts[4], color: "yellow", icon: "🧹" },
    { key: 6, label: "Manutenção", count: counts[6], color: "gray", icon: "🔧" },
  ];


  return (
    <div className="apartments-page" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <Toasts toasts={toasts} onClose={closeToast} />
      <LoadingOverlay show={loading} />
      <div className="apartments-header">
        <h1 className="apartments-title">Quartos</h1>
        <div className="header-actions">
          <button className="add-button" onClick={() => setShowAddRoom(true)}>
            <span className="add-icon">+</span> Adicionar Quarto
          </button>
          <button className="add-button secondary" onClick={() => setShowAddCategory(true)}>
            <span className="add-icon">+</span> Categoria
          </button>
        </div>
      </div>

      <div className="apartments-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por número, nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Buscar por número, nome ou CPF"
            />
          </div>
        </div>

        <div className="date-filter">
          <label htmlFor="statusDate">Status na data:</label>
          <input
            id="statusDate"
            type="date"
            className="date-input"
            value={statusDate}
            onChange={(e) => setStatusDate(e.target.value)}
          />
          {statusDate && (
            <button className="clear-date-btn" onClick={() => setStatusDate("")}>
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={String(f.key)}
            className={`filter-tab ${String(filter) === String(f.key) ? "active" : ""} ${f.color}`}
            onClick={() => setFilter(f.key === "all" ? "all" : Number(f.key))}
          >
            <span className="filter-icon">{f.icon}</span>
            {f.label}
            <span className="filter-count">{f.count}</span>
          </button>
        ))}
      </div>

      <div className="apartments-content">
        {Object.keys(groups).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <p>Nenhum quarto encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          Object.entries(groups).map(([categoria, lista]) => (
            <div key={categoria} className="category-section" style={{ marginBottom: 32 }}>
              <h2 className="category-title">{categoria}</h2>
              <div className="rooms-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {lista.map((room) => {
                  const displayStatus = statusByDate(room, dateView);
                  return (
                    <RoomCard
                      key={room.numero}
                      room={room}
                      displayStatus={displayStatus}
                      onDetails={openDetails}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <AddRoomModal
        open={showAddRoom}
        onClose={() => setShowAddRoom(false)}
        categories={categoriesMap}
        onSave={async (data) => {
          try {
            setLoading(true);
            const name = data?.tipo;
            const catId = categoriesMap?.[name]?.id ?? data?.categoriaId ?? "";
            await createRoomFromUI({
              descricao: data?.descricao,
              pessoas: data?.pessoas,
              status: data?.status ?? ROOM_STATUS_CODE.DISPONIVEL,
              categoriaId: catId,
              beds: data?.beds,
            });
            notify("info", "Quarto criado com sucesso.");
            await reloadRooms();
            setShowAddRoom(false);
          } catch (e) {
            console.error(e);
            notify("error", e.message || "Erro ao criar quarto.");
          } finally {
            setLoading(false);
          }
        }}
      />

      <AddCategoryModal
        open={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSave={(name) => notify("info", `Categoria "${name}" salva (mock).`)}
      />

      <RoomDetailsModal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        room={selectedRoom}
      />
    </div>
  );
}
