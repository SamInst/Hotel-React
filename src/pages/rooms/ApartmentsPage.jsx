// src/pages/Apartments/ApartmentsPage.jsx
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

/* ===================== Helpers existentes ===================== */
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
  const map = { casal: "cama casal", solteiro: "cama solteiro", rede: "rede", beliche: "beliche" };
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

// ... dentro do ApartmentsPage.jsx

function EditRoomModal({
  open, onClose, initialRoom, categoriesMap, onSaved, onError, setGlobalLoading
}) {
  const [descricao, setDescricao] = useState(initialRoom?.descricao ?? "");
  const [pessoas, setPessoas] = useState(initialRoom?.pessoas ?? 1);
  const [status, setStatus] = useState(initialRoom?.status ?? ROOM_STATUS_CODE.DISPONIVEL);
  const [categoriaId, setCategoriaId] = useState("");
  const [beds, setBeds] = useState({
    casal: Number(initialRoom?.beds?.casal || 0),
    solteiro: Number(initialRoom?.beds?.solteiro || 0),
    rede: Number(initialRoom?.beds?.rede || 0),
    beliche: Number(initialRoom?.beds?.beliche || 0),
  });

  useEffect(() => {
    if (!open) return;
    setDescricao(initialRoom?.descricao ?? "");
    setPessoas(initialRoom?.pessoas ?? 1);
    setStatus(initialRoom?.status ?? ROOM_STATUS_CODE.DISPONIVEL);
    setBeds({
      casal: Number(initialRoom?.beds?.casal || 0),
      solteiro: Number(initialRoom?.beds?.solteiro || 0),
      rede: Number(initialRoom?.beds?.rede || 0),
      beliche: Number(initialRoom?.beds?.beliche || 0),
    });

    // 🔧 tenta selecionar a categoria automaticamente (case-insensitive)
    const roomTipo = String(initialRoom?.tipo ?? "").trim().toLowerCase();
    const match = Object.entries(categoriesMap || {}).find(
      ([name]) => String(name).trim().toLowerCase() === roomTipo
    );
    setCategoriaId(match ? String(match[1]?.id ?? "") : "");
  }, [open, initialRoom, categoriesMap]);

  if (!open) return null;

  const canSave = Number(pessoas) > 0 && !!categoriaId;

  return (
    <div className="modal-backdrop edit-room-modal">
      <div className="modal">
        <h3>Editar Quarto #{initialRoom?.numero}</h3>

        <div className="form-grid">
          <div className="form-row">
            <label className="field-label">Descrição</label>
            <input
              className="field-control"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Vista Jardim"
            />
          </div>

          <div className="form-row">
            <label className="field-label">Capacidade (pessoas)</label>
            <input
              className="field-control"
              type="number"
              min={1}
              value={pessoas}
              onChange={(e) => setPessoas(Number(e.target.value || 1))}
            />
          </div>

          <div className="form-row">
            <label className="field-label">Status</label>
            <select
              className="field-control"
              value={status}
              onChange={(e) => setStatus(Number(e.target.value))}
            >
              <option value={ROOM_STATUS_CODE.DISPONIVEL}>Disponível</option>
              <option value={ROOM_STATUS_CODE.LIMPEZA}>Em Limpeza</option>
              <option value={ROOM_STATUS_CODE.MANUTENCAO}>Manutenção</option>
              <option value={ROOM_STATUS_CODE.RESERVADO}>Reservado</option>
              <option value={ROOM_STATUS_CODE.OCUPADO}>Ocupado</option>
              <option value={ROOM_STATUS_CODE.DIARIA_ENCERRADA}>Diária Encerrada</option>
            </select>
          </div>

          <div className="form-row">
            <label className="field-label">Categoria</label>
            <select
              className="field-control"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {Object.entries(categoriesMap || {}).map(([name, obj]) => (
                <option key={obj.id ?? name} value={obj.id ?? ""}>{name}</option>
              ))}
            </select>
          </div>

          <div className="form-row form-row--full">
            <label className="field-label">Camas (disposição)</label>
            <div className="beds-grid">
              <div className="bed-item">
                <span>Casal</span>
                <input
                  className="field-control"
                  type="number"
                  min={0}
                  value={beds.casal}
                  onChange={(e) => setBeds((b) => ({ ...b, casal: Number(e.target.value || 0) }))}
                />
              </div>
              <div className="bed-item">
                <span>Solteiro</span>
                <input
                  className="field-control"
                  type="number"
                  min={0}
                  value={beds.solteiro}
                  onChange={(e) => setBeds((b) => ({ ...b, solteiro: Number(e.target.value || 0) }))}
                />
              </div>
              <div className="bed-item">
                <span>Rede</span>
                <input
                  className="field-control"
                  type="number"
                  min={0}
                  value={beds.rede}
                  onChange={(e) => setBeds((b) => ({ ...b, rede: Number(e.target.value || 0) }))}
                />
              </div>
              <div className="bed-item">
                <span>Beliche</span>
                <input
                  className="field-control"
                  type="number"
                  min={0}
                  value={beds.beliche}
                  onChange={(e) => setBeds((b) => ({ ...b, beliche: Number(e.target.value || 0) }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary"
            disabled={!canSave}
            onClick={async () => {
              try {
                setGlobalLoading?.(true);
                await updateRoomFromUI(initialRoom.numero, {
                  descricao, pessoas, status, categoriaId, beds,
                });
                onSaved?.();
              } catch (e) {
                onError?.(e.message);
              } finally {
                setGlobalLoading?.(false);
              }
            }}
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}


/* ===================== Página ===================== */
export function ApartmentsPage() {
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // novo: modal de edição (separado para não mexer no seu RoomDetailsModal)
  const [showEdit, setShowEdit] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusDate, setStatusDate] = useState("");

  const [loading, setLoading] = useState(false);
  const { toasts, push: notify, remove: closeToast } = useToasts();

  // categorias no formato ANTIGO do seu AddRoomModal: { [nome]: {id} }
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

  // Carregar categorias 1x (e manter no shape antigo que seu AddRoomModal espera)
  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const cats = await getCategories();
        if (!isCancelled) setCategoriesMap(adaptCategoriesToLegacyMap(cats)); // { SIMPLES: {id:1}, ... }
      } catch (e) {
        console.error(e);
        notify("error", "Falha ao carregar categorias.");
      }
    })();
    return () => { isCancelled = true; };
  }, [notify]);

  // Carregar quartos quando filtros mudarem
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
  const openEdit = (room) => {
    setSelectedRoom(room);
    setShowEdit(true);
  };
  const updateStatus = (numero, next) => {
    const v = parseInt(next, 10);
    setRooms((rs) => rs.map((r) => (r.numero === numero ? { ...r, status: v } : r)));
  };

  // handlers para AddRoomModal (sem alterar o visual dele!)
  const handleAddRoomSave = async (dataDoModal) => {
    try {
      setLoading(true);
      // seu modal antigo provavelmente envia algo como:
      // { numero?, tipo, status, pessoas, beds, ... }
      // Vamos montar um payload robusto:
      const name = dataDoModal?.tipo; // nome da categoria escolhido
      const catId = categoriesMap?.[name]?.id ?? dataDoModal?.categoriaId ?? "";
      await createRoomFromUI({
        descricao: dataDoModal?.descricao,
        pessoas: dataDoModal?.pessoas,
        status: dataDoModal?.status ?? ROOM_STATUS_CODE.DISPONIVEL,
        categoriaId: catId,
        beds: dataDoModal?.beds,
      });
      notify("info", "Quarto criado com sucesso.");
      await reloadRooms();
    } catch (e) {
      console.error(e);
      notify("error", e.message || "Erro ao criar quarto.");
    } finally {
      setLoading(false);
    }
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
    <div className="apartments-page">
      <Toasts toasts={toasts} onClose={closeToast} />
      <LoadingOverlay show={loading} />

      <div className="apartments-header">
        <h1 className="apartments-title">Quartos</h1>
        <div className="header-actions">
          <button className="add-button" onClick={() => setShowAddRoom(true)}>
            <span className="add-icon">+</span> Adicionar Quarto
          </button>
          <button
            className="add-button secondary"
            onClick={() => setShowAddCategory(true)}
          >
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
            <div key={categoria} className="category-section">
              <h2 className="category-title">{categoria}</h2>
              <div className="rooms-grid">
                {lista.map((room) => {
                  const displayStatus = statusByDate(room, dateView);
                  const colorClass = statusClass(displayStatus);
                  const transitions = allowedTransitions(displayStatus);
                  const disabledSelect = transitions.length === 0 || !!dateView;
                  const icon = getStatusIcon(displayStatus);

                  const name = room.representante || room.reservaNome;
                  const cpf = room.cpf || room.reservaCpf;
                  const telefone = room.telefone || room.reservaTelefone;
                  const hospedes =
                    (room.hospedes ?? room.reservaHospedes ?? room.pessoas) || 1;

                  const checkinDate = room.entrada || room.reservaInicio;
                  const checkoutDate = room.saida || room.reservaFim;
                  const checkinTime =
                    room.horaEntrada || room.horaReservaEntrada || "--:--";
                  const checkoutTime =
                    room.horaSaida || room.horaReservaSaida || "--:--";

                  return (
                    <div key={room.numero} className={`room-card ${colorClass}`}>
                      <div className="room-card-header-colored">
                        <div className="header-content">
                          <div className="room-info-header">
                            <span className="room-icon">{icon}</span>
                            <div className="room-title-section">
                              <h3 className="room-title">Quarto {room.numero}</h3>
                              <div className="status-below">
                                <div className="status-dropdown-container">
                                  <select
                                    className="status-dropdown-header"
                                    value={room.status}
                                    onChange={(e) => updateStatus(room.numero, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={`Alterar status do quarto ${room.numero}`}
                                    disabled={disabledSelect}
                                  >
                                    <option value={room.status}>
                                      {getStatusLabel(room.status)}
                                    </option>
                                    {transitions
                                      .filter((v) => v !== room.status)
                                      .map((v) => (
                                        <option key={v} value={v}>
                                          {getStatusLabel(v)}
                                        </option>
                                      ))}
                                  </select>
                                  <div className="dropdown-arrow-header">▼</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="room-card-body">
                        {[1, 3, 5].includes(displayStatus) && (
                          <>
                            <div className="guests-section">
                              {name && (
                                <div className="guest-item">
                                  <div className="guest-avatar-initials">
                                    {initialsFromName(name)}
                                  </div>
                                  <div className="guest-details">
                                    <span className="guest-name">{name}</span>
                                    <div className="guest-info">
                                      <span><b>CPF:</b> {cpf || "—"}</span>
                                      <span><b>Telefone:</b> {telefone || "—"}</span>
                                      <span><b>Acompanhantes:</b> {Math.max(hospedes - 1, 0)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="dates-info">
                              {checkinDate && (
                                <div className="date-row">
                                  <span className="date-label">Check-in</span>
                                  <span className="date-value">
                                    {checkinDate} <span className="time">{checkinTime}</span>
                                  </span>
                                </div>
                              )}
                              {checkoutDate && (
                                <div className="date-row">
                                  <span className="date-label">Check-out</span>
                                  <span className="date-value">
                                    {checkoutDate} <span className="time">{checkoutTime}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {displayStatus === 2 && (
                          <div className="capacity-section">
                            <div className="capacity-info block-fullwidth">
                              <div className="capacity-item">
                                <span className="capacity-label">Capacidade</span>
                                <span className="capacity-value">{room.pessoas} pessoa(s)</span>
                              </div>

                              <div className="bed-configuration">
                                <div className="bed-lines">
                                  {formatBeds(room).split(", ").map((line, idx) => (
                                    <div className="bed-line" key={idx}>
                                      <span className="bed-icon">🛏️</span>
                                      <span className="bed-text">{line}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {[4, 6].includes(displayStatus) && (
                          <div className="maintenance-section">
                            <div className="status-info">
                              <div className="status-message">
                                {displayStatus === 4
                                  ? 'Quarto em processo de limpeza. Pode ser liberado para "Disponível" quando finalizar.'
                                  : 'Quarto em manutenção. Libere para "Disponível" quando concluir.'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="room-card-footer">
                        <button className="details-btn" onClick={() => openDetails(room)}>
                          Ver Detalhes
                        </button>
                        {/* Novo botão Editar (sem tocar no RoomDetailsModal) */}
                        <button className="details-btn secondary" onClick={() => openEdit(room)}>
                          Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mantém seu AddRoomModal ORIGINAL (categorias = objeto antigo; onSave = callback antigo) */}
      <AddRoomModal
        open={showAddRoom}
        onClose={() => setShowAddRoom(false)}
        categories={categoriesMap}   // <— mesmo shape que você já usava
        onSave={async (data) => {    // <— nós plugamos a API aqui fora
          await handleAddRoomSave(data);
          setShowAddRoom(false);
        }}
      />

      {/* Mantém seu AddCategoryModal como antes */}
      <AddCategoryModal
        open={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSave={(name) => notify("info", `Categoria "${name}" salva (mock).`)}
      />

      {/* Mantém seu RoomDetailsModal ORIGINAL, só para leitura */}
      <RoomDetailsModal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        room={selectedRoom}
      />

      {/* Novo modal de edição — com as MESMAS classes dos seus modais */}
      <EditRoomModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        initialRoom={selectedRoom}
        categoriesMap={categoriesMap}
        setGlobalLoading={setLoading}
        onSaved={async () => {
          setShowEdit(false);
          notify("info", "Quarto atualizado com sucesso.");
          await reloadRooms();
        }}
        onError={(msg) => notify("error", msg || "Erro ao atualizar quarto.")}
      />
    </div>
  );
}
