// src/pages/ClientsPage.jsx
import React, { useMemo, useState } from 'react';
import { PEOPLE } from '../data/people.js';
import { ClientDetailsModal } from '../components/ClientDetailsModal.jsx';
import { ClientRegistrationModal } from '../components/ClientRegistrationModal.jsx';

function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function onlyDigits(s) {
  return (s || '').replace(/\D/g, '');
}

export function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const filteredPeople = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const queryDigits = onlyDigits(searchQuery);
    
    if (!query) return PEOPLE;
    
    return PEOPLE.filter(p => {
      const matchName = p.nome.toLowerCase().includes(query);
      const matchCpf = queryDigits && onlyDigits(p.cpf).includes(queryDigits);
      return matchName || matchCpf;
    });
  }, [searchQuery]);

  const openDetails = (p) => { 
    setSelected(p); 
    setDetailsOpen(true); 
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <button 
          type="button" 
          className="btn btn--primary btn--add"
          onClick={() => setRegistrationOpen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Adicionar Cliente
        </button>
      </div>

      <div className="page-content">
        <div className="clients-container">
          <div className="clients-filters">
            <div className="search-field">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <input 
                className="search-input" 
                placeholder="Buscar por nome ou CPF..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>

          <div className="clients-grid">
            {filteredPeople.map(p => (
              <div
                key={p.id}
                className="client-card"
                onClick={() => openDetails(p)}
              >
                <div className="client-header">
                  <div className="client-avatar-container">
                    <img className="client-avatar" src={p.avatar} alt="" />
                  </div>
                  <div className="client-info">
                    <h3 className="client-name">{p.nome}</h3>
                    <div className="client-meta">
                      <span className="client-cpf">CPF: {p.cpf}</span>
                    </div>
                  </div>
                </div>
                
                <div className="client-contact">
                  <div className="contact-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>{p.email || '-'}</span>
                  </div>
                  <div className="contact-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M22 16.92V19.92C22 20.52 21.39 21 20.66 21C9.44 21 0.58 12.14 0.58 0.92C0.58 0.19 1.06 -0.42 1.66 -0.42H4.66C5.25 -0.42 5.83 0.04 5.96 0.62L6.96 5.62C7.09 6.2 6.83 6.79 6.3 7.17L4.1 8.9C5.74 12.38 8.62 15.26 12.1 16.9L13.83 14.7C14.21 14.17 14.8 13.91 15.38 14.04L20.38 15.04C20.96 15.17 21.42 15.75 21.42 16.34V19.34C21.42 20 20.83 20.58 20.17 20.58H20.08C20.08 20.58 20.08 20.58 22 16.92Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                    <span>{p.telefone || '-'}</span>
                  </div>
                </div>

                <div className="client-footer">
                  <div className="last-stay">
                    <div className="last-stay-label">Última Hospedagem</div>
                    <div className="last-stay-dates">
                      {fmtDate(p.ultimaHospedagemInicio)} - {fmtDate(p.ultimaHospedagemFim)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredPeople.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="empty-text">Nenhum cliente encontrado</div>
                <div className="empty-subtext">Tente ajustar os filtros ou cadastrar um novo cliente</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ClientDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        person={selected}
      />

      <ClientRegistrationModal
        open={registrationOpen}
        onClose={() => setRegistrationOpen(false)}
      />
    </div>
  );
}