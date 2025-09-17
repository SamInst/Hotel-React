// src/pages/CompanyPage.jsx
import React, { useMemo, useState } from 'react';
import { COMPANIES } from '../data/companies.js';
import { CompanyDetailsModal } from '../components/CompanyDetailsModal.jsx';
import { CompanyRegistrationModal } from '../components/CompanyRegistrationModal.jsx';

export default function CompanyPage() {
  const [companies, setCompanies] = useState(COMPANIES);
  const [q, setQ] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return companies;
    return companies.filter(c =>
      c.nome_empresa.toLowerCase().includes(s) ||
      c.cnpj.toLowerCase().includes(s)
    );
  }, [q, companies]);

  const openDetails = (company) => {
    setSelected(company);
    setDetailsOpen(true);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Empresas</h1>
        <button 
          type="button" 
          className="btn btn--primary btn--add"
          onClick={() => setRegistrationOpen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Adicionar Empresa
        </button>
      </div>

      <div className="page-content">
        <div className="companies-container">
          <div className="companies-filters">
            <div className="search-field">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <input 
                className="search-input" 
                placeholder="Buscar por nome da empresa ou CNPJ..." 
                value={q} 
                onChange={e=>setQ(e.target.value)} 
              />
            </div>
          </div>

          <div className="companies-grid">
            {filtered.map(c => (
              <div
                key={c.id}
                className="company-card"
                onClick={() => openDetails(c)}
              >
                <div className="company-header">
                  <div className="company-avatar-container">
                    <div className="company-avatar">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M3 21H21V19H20V4C20 3.45 19.55 3 19 3H5C4.45 3 4 3.45 4 4V19H3V21ZM6 5H18V19H6V5Z" fill="currentColor"/>
                        <rect x="8" y="7" width="2" height="2" fill="currentColor"/>
                        <rect x="14" y="7" width="2" height="2" fill="currentColor"/>
                        <rect x="8" y="11" width="2" height="2" fill="currentColor"/>
                        <rect x="14" y="11" width="2" height="2" fill="currentColor"/>
                        <rect x="11" y="15" width="2" height="4" fill="currentColor"/>
                      </svg>
                    </div>
                  </div>
                  <div className="company-info">
                    <h3 className="company-name">{c.nome_empresa}</h3>
                    <div className="company-meta">
                      <span className="company-cnpj">CNPJ: {c.cnpj}</span>
                    </div>
                  </div>
                </div>

                <div className="company-contact">
                  <div className="contact-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>{c.email || '-'}</span>
                  </div>
                  <div className="contact-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M22 16.92V19.92C22 20.52 21.39 21 20.66 21C9.44 21 0.58 12.14 0.58 0.92C0.58 0.19 1.06 -0.42 1.66 -0.42H4.66C5.25 -0.42 5.83 0.04 5.96 0.62L6.96 5.62C7.09 6.2 6.83 6.79 6.3 7.17L4.1 8.9C5.74 12.38 8.62 15.26 12.1 16.9L13.83 14.7C14.21 14.17 14.8 13.91 15.38 14.04L20.38 15.04C20.96 15.17 21.42 15.75 21.42 16.34V19.34C21.42 20 20.83 20.58 20.17 20.58H20.08C20.08 20.58 20.08 20.58 22 16.92Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                    <span>{c.telefone || '-'}</span>
                  </div>
                </div>

                <div className="company-footer">
                  <div className="company-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 5.03 7.03 1 12 1S21 5.03 21 10Z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>{c.municipio}, {c.estado}</span>
                  </div>
                  <div className="company-status">
                    <span className={`status-badge status-badge--${c.situacao?.toLowerCase()}`}>
                      {c.situacao}
                    </span>
                  </div>
                </div>

                {c.vinculados && c.vinculados.length > 0 && (
                  <div className="company-linked">
                    <div className="linked-count">
                      {c.vinculados.length} pessoa{c.vinculados.length !== 1 ? 's' : ''} vinculada{c.vinculados.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M3 21H21V19H20V4C20 3.45 19.55 3 19 3H5C4.45 3 4 3.45 4 4V19H3V21ZM6 5H18V19H6V5Z" stroke="currentColor" strokeWidth="2"/>
                    <rect x="8" y="7" width="2" height="2" fill="currentColor"/>
                    <rect x="14" y="7" width="2" height="2" fill="currentColor"/>
                    <rect x="8" y="11" width="2" height="2" fill="currentColor"/>
                    <rect x="14" y="11" width="2" height="2" fill="currentColor"/>
                    <rect x="11" y="15" width="2" height="4" fill="currentColor"/>
                  </svg>
                </div>
                <div className="empty-text">Nenhuma empresa encontrada</div>
                <div className="empty-subtext">Tente ajustar os filtros ou cadastrar uma nova empresa</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CompanyDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        company={selected}
      />

      <CompanyRegistrationModal
        open={registrationOpen}
        onClose={() => setRegistrationOpen(false)}
        onSuccess={(newCompany) => {
          setCompanies([newCompany, ...companies]);
          setRegistrationOpen(false);
        }}
      />
    </div>
  );
}