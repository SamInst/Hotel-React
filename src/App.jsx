import React, { useEffect, useRef, useState, useCallback } from "react";
import Sidebar from "./components/Sidebar.jsx";
import { ApartmentsPage } from "./pages/ApartmentsPage.jsx";
import PeopleRegister from "./pages/PeopleRegister.jsx";
import FinancePage from "./pages/FinancePage.jsx";
import PricesPage from './pages/PricesPage.jsx';
import ItemsPage from './pages/ItemsPage.jsx';
import ReservationsPage from './pages/ReservationsPage.jsx';

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(true);
  const sidebarRef = useRef(null);
  const edgeRef = useRef(null);
  const collapseTimer = useRef(null);

  const expand = useCallback(() => setCollapsed(false), []);
  const scheduleCollapse = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setCollapsed(true), 200);
  }, []);

  useEffect(() => {
    const edge = edgeRef.current;
    const sb = sidebarRef.current;
    if (!edge || !sb) return;

    edge.addEventListener("mouseenter", expand);
    edge.addEventListener("mouseleave", scheduleCollapse);
    sb.addEventListener("mouseenter", expand);
    sb.addEventListener("mouseleave", scheduleCollapse);

    return () => {
      edge.removeEventListener("mouseenter", expand);
      edge.removeEventListener("mouseleave", scheduleCollapse);
      sb.removeEventListener("mouseenter", expand);
      sb.removeEventListener("mouseleave", scheduleCollapse);
    };
  }, [expand, scheduleCollapse]);

  return (
    <div className="app">
      <div className="layout">
        <div className="hover-edge" ref={edgeRef} aria-hidden="true"></div>
        <Sidebar
          ref={sidebarRef}
          collapsed={collapsed}
          page={page}
          onNavigate={setPage}
          onLogout={() => window.location.reload()}
        />
        <section className="layout__content" id="conteudo" tabIndex={-1}>
  {page === 'dashboard' && (
    <div>
      <h2 className="header__title" style={{marginBottom: 8}}>Bem-vindo, Vicente!</h2>
      <p>Selecione uma opção no menu à esquerda.</p>
    </div>
  )}

  {page === 'apartamentos' && <ApartmentsPage />}
  {page === 'clientes' && <PeopleRegister />}
  {page === 'financeiro' && <FinancePage />}
  {page === 'precos' && <PricesPage />}
  {page === 'itens' && <ItemsPage />}
  {page === 'reservas' && <ReservationsPage />}

  
</section>

      </div>
    </div>
  );
}
