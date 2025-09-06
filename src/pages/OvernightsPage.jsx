// src/pages/OvernightsPage.jsx
import React, { useState, useMemo, useCallback } from 'react';
import './OvernightsPage.css';
import OvernightModal from './OvernightModal';

const OvernightsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ativos');

  // Estado do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOvernight, setSelectedOvernight] = useState(null);

  // Mock de dados - troque pela sua fonte
  const [overnights] = useState([
    { id: '02', guestName: 'Sam Helson Nunes Diniz', guestCpf: '123.456.789-00', checkinDate: '05/09/2025', checkoutDate: '07/09/2025', status: 'ativo',     room: 'Quarto 102' },
    { id: '03', guestName: 'Sam Helson Nunes Diniz', guestCpf: '123.456.789-00', checkinDate: '05/09/2025', checkoutDate: '07/09/2025', status: 'ativo',     room: 'Quarto 103' },
    { id: '05', guestName: 'Sam Helson Nunes Diniz', guestCpf: '123.456.789-00', checkinDate: '05/09/2025', checkoutDate: '07/09/2025', status: 'pendente',  room: 'Quarto 105' },
    { id: '04', guestName: 'Maria Silva Santos',      guestCpf: '987.654.321-00', checkinDate: '03/09/2025', checkoutDate: '06/09/2025', status: 'encerrada', room: 'Quarto 104' },
    { id: '06', guestName: 'João Oliveira Costa',     guestCpf: '456.789.123-00', checkinDate: '01/09/2025', checkoutDate: '04/09/2025', status: 'encerrada', room: 'Quarto 106' }
  ]);

  const filterConfig = {
    ativos:       { label: 'Ativos',      count: 0, color: 'green' },
    encerradas:   { label: 'Diaria Encerradas',  count: 0, color: 'blue' },
    pendentes:    { label: 'Pendentes',   count: 0, color: 'orange' },
    finalizados:  { label: 'Finalizados', count: 0, color: 'gray' }
  };

  const statusToFilterKey = {
    ativo: 'ativos',
    encerrada: 'encerradas',
    pendente: 'pendentes',
    finalizado: 'finalizados'
  };

  // Contagem + filtro memorizados
  const { filteredOvernights, filters } = useMemo(() => {
    const counts = { ...filterConfig };

    // contabiliza por status (mapeando para as chaves dos filtros)
    overnights.forEach((o) => {
      const key = statusToFilterKey[o.status];
      if (key && counts[key]) counts[key].count++;
    });

    // filtro por aba ativa
    let filtered = overnights.filter((o) => {
      if (activeFilter === 'ativos') return o.status === 'ativo';
      if (activeFilter === 'encerradas') return o.status === 'encerrada';
      if (activeFilter === 'pendentes') return o.status === 'pendente';
      if (activeFilter === 'finalizados') return o.status === 'finalizado';
      return true;
    });

    // filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const numeric = searchTerm.replace(/\D/g, '');
      filtered = filtered.filter(
        (o) =>
          o.guestName.toLowerCase().includes(term) ||
          o.guestCpf.replace(/\D/g, '').includes(numeric)
      );
    }

    return { filteredOvernights: filtered, filters: counts };
  }, [overnights, activeFilter, searchTerm]);

  // Ações de linha
  const openModal = useCallback((overnight) => {
    setSelectedOvernight(overnight);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedOvernight(null);
  }, []);

  const handleCancelReservation = useCallback(() => {
    console.log('Cancelar reserva:', selectedOvernight?.id);
    setIsModalOpen(false);
  }, [selectedOvernight]);

  const handleFinalizeReservation = useCallback(() => {
    console.log('Finalizar/Checkout da reserva:', selectedOvernight?.id);
    setIsModalOpen(false);
  }, [selectedOvernight]);

  const handleCheckout = (id) => {
    const ov = overnights.find((o) => o.id === id);
    openModal(ov);
  };

  const handlePayment = (id) => {
    const ov = overnights.find((o) => o.id === id);
    openModal(ov);
  };

  return (
    <div className="overnights-page">
      <div className="overnights-header">
        <h1 className="overnights-title">Pernoites</h1>
        <button className="add-button" onClick={() => openModal(null)}>
          <span className="add-icon">+</span>
          Adicionar
        </button>
      </div>

      <div className="overnights-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por hóspede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="date-filters">
          <div className="filter-group">
            <span className="filter-icon">📅</span>
            <span>Checkin</span>
          </div>
          <div className="filter-group">
            <span className="filter-icon">📅</span>
            <span>Checkout</span>
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
              {key === 'ativos' && '✓'}
              {key === 'encerradas' && '✓'}
              {key === 'pendentes' && '⚠'}
              {key === 'finalizados' && '✓'}
            </span>
            {config.label}
            <span className="filter-count">{config.count}</span>
          </button>
        ))}
      </div>

      <div className="overnights-content">
        <div className="overnights-list">
          {filteredOvernights.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum pernoite encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            filteredOvernights.map((overnight) => (
              <div key={overnight.id} className={`overnight-card ${overnight.status}`}>
                <div className="overnight-id">{overnight.id}</div>

                <div className="overnight-info">
                  <h3 className="guest-name">{overnight.guestName}</h3>
                  <p className="guest-details">
                    CPF: {overnight.guestCpf} • {overnight.room}
                  </p>
                  <p className="dates">{overnight.checkinDate}</p>
                </div>

                <div className="overnight-dates">
                  <div className="date-info">
                    <span className="date-label">
                      {overnight.status === 'ativo'
                        ? 'Check-out'
                        : overnight.status === 'pendente'
                        ? 'Vencimento'
                        : 'Check-out'}
                    </span>
                    <span className="date-value">{overnight.checkoutDate}</span>
                  </div>
                </div>

                <div className="overnight-actions">
                  {overnight.status === 'ativo' && (
                    <button className="action-button checkout" onClick={() => handleCheckout(overnight.id)}>
                      Check-out
                    </button>
                  )}
                  {overnight.status === 'pendente' && (
                    <button className="action-button payment" onClick={() => handlePayment(overnight.id)}>
                      Cobrar
                    </button>
                  )}
                  {overnight.status === 'encerrada' && (
                    <button className="action-button checkout" onClick={() => handleCheckout(overnight.id)}>
                      Check-out
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <OvernightModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        overnightData={selectedOvernight}
        onCancel={handleCancelReservation}
        onFinalize={handleFinalizeReservation}
      />
    </div>
  );
};

export default OvernightsPage;
