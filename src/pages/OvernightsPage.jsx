import React, { useState, useMemo, useEffect, useCallback } from "react";
import "./OvernightsPage.css";
import OvernightModal from "./OvernightModal";
import { usePernoiteOperations } from "../config/pernoiteApi.js";
import { Toasts, LoadingOverlay } from "../config/uiUtilities.jsx";

const statusConfig = {
  ativo: { label: "Ativo", color: "#22c55e" },
  diaria_encerrada: { label: "Encerrada", color: "#3b82f6" },
  finalizado_pagamento_pendente: { label: "Pendente", color: "#f97316" },
  finalizado: { label: "Finalizado", color: "#9ca3af" },
};

const OvernightsPage = () => {
  const {
    carregarPernoites,
    loading,
    loadingMessage,
    toasts,
    closeToast,
    notifyError,
  } = usePernoiteOperations();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOvernight, setSelectedOvernight] = useState(null);
  const [overnights, setOvernights] = useState([]);

  const fetchPernoites = useCallback(async () => {
    try {
      const statusMap = {
        todos: null,
        ativos: "ATIVO",
        encerradas: "DIARIA_ENCERRADA",
        pendentes: "FINALIZADO_PAGAMENTO_PENDENTE",
        finalizados: "FINALIZADO",
      };
      const statusParam = statusMap[activeFilter] || null;
      const data = await carregarPernoites(statusParam);

      const adaptados = data.map((p) => ({
        id: p.id,
        quartoNumero: p.quartoId,
        guestName: p.representanteNome || "—",
        guestCpf: p.representanteCpf || "—",
        checkinDate: p.dataEntrada,
        checkoutDate: p.dataSaida,
        status: p.status?.toLowerCase(),
      }));
      setOvernights(adaptados);
    } catch {
      notifyError("Erro ao carregar pernoites");
    }
  }, [activeFilter, carregarPernoites, notifyError]);

  useEffect(() => {
    fetchPernoites();
  }, [activeFilter]);

  const filterConfig = {
    todos: { label: "Todos", color: "gray" },
    ativos: { label: "Ativos", color: "green" },
    encerradas: { label: "Encerradas", color: "blue" },
    pendentes: { label: "Pendentes", color: "orange" },
    finalizados: { label: "Finalizados", color: "gray" },
  };

  const statusToFilterKey = {
    ativo: "ativos",
    diaria_encerrada: "encerradas",
    finalizado_pagamento_pendente: "pendentes",
    finalizado: "finalizados",
  };

  const { filteredOvernights, filters } = useMemo(() => {
    const counts = { ...filterConfig };
    overnights.forEach((o) => {
      const key = statusToFilterKey[o.status];
      if (key && counts[key]) counts[key].count++;
      counts.todos.count++;
    });

    let filtered = activeFilter === "todos"
      ? overnights
      : overnights.filter((o) => {
          if (activeFilter === "ativos") return o.status === "ativo";
          if (activeFilter === "encerradas") return o.status === "diaria_encerrada";
          if (activeFilter === "pendentes") return o.status === "finalizado_pagamento_pendente";
          if (activeFilter === "finalizados") return o.status === "finalizado";
          return true;
        });

    // 🔍 Busca local: nome ou número do quarto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const numeric = searchTerm.replace(/\D/g, "");
      filtered = filtered.filter(
        (o) =>
          o.guestName.toLowerCase().includes(term) ||
          String(o.quartoNumero).includes(numeric)
      );
    }

    return { filteredOvernights: filtered, filters: counts };
  }, [overnights, activeFilter, searchTerm]);

  const openModal = useCallback((overnight) => {
    setSelectedOvernight(overnight);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedOvernight(null);
  }, []);

  return (
    <div className="overnights-page">
      <div className="overnights-header">
        <h1 className="overnights-title">Pernoites</h1>
        <button className="add-button" onClick={() => openModal(null)}>
          <span className="add-icon">+</span> Adicionar
        </button>
      </div>

      <div className="overnights-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por nome ou número do quarto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="filter-tabs">
        {Object.entries(filters).map(([key, config]) => (
          <button
            key={key}
            className={`filter-tab ${activeFilter === key ? "active" : ""} ${config.color}`}
            onClick={() => setActiveFilter(key)}
          >
            {config.label}
            <span className="filter-count">{config.count}</span>
          </button>
        ))}
      </div>

      <div className="overnights-content">
        <div className="overnights-list">
          {filteredOvernights.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum pernoite encontrado.</p>
            </div>
          ) : (
            filteredOvernights.map((o) => {
              const cfg = statusConfig[o.status] || {
                label: "—",
                color: "#ccc",
              };
              const dateLabel =
                o.status === "finalizado_pagamento_pendente"
                  ? "Vencimento"
                  : "Check-out";

              return (
                <div key={o.id} className="overnight-card">
                  <div className="overnight-id">
                    <div className="room-number">
                      {String(o.quartoNumero || 0).padStart(2, "0")}
                    </div>
                    <div className="room-id">#{o.id}</div>
                  </div>

                  <div className="overnight-info">
                    <h3 className="guest-name">{o.guestName}</h3>
                    <p className="guest-details">CPF: {o.guestCpf}</p>
                    <p className="dates">{o.checkinDate}</p>
                  </div>

                  <div className="overnight-dates">
                    <div className="date-info-horizontal">
                      <span
                        className="status-tag"
                        style={{ backgroundColor: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      <div className="date-box">
                        <span className="date-label">{dateLabel}</span>
                        <span className="date-value">{o.checkoutDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="overnight-actions">
                    <button
                      className="action-button checkout"
                      style={{ backgroundColor: cfg.color }}
                      onClick={() => openModal(o)}
                    >
                      Verificar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <OvernightModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        overnightData={selectedOvernight}
      />
      <LoadingOverlay show={loading} label={loadingMessage} />
      <Toasts toasts={toasts} onClose={closeToast} />
    </div>
  );
};

export default OvernightsPage;
