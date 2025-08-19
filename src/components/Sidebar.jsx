import React, { forwardRef } from 'react'
import icDashboard   from '../icons/dashboard.png';
import icPernoites   from '../icons/pernoites.png';
import icQuartos     from '../icons/quartos.png';
import icDayUse      from '../icons/entrada.png';
import icReservas    from '../icons/reservas.png';
import icFinanceiro  from '../icons/relatorios.png';
import icItens       from '../icons/itens.png';
import icClientes    from '../icons/pessoas.png';
import icPrecos      from '../icons/precos.png';

const items = [
  { key: 'dashboard',     label: 'Dashboard',     icon: icDashboard },
  { key: 'pernoites',     label: 'Pernoites',     icon: icPernoites },
  { key: 'apartamentos',  label: 'Apartamentos',  icon: icQuartos },
  { key: 'dayuse',        label: 'Day Use',       icon: icDayUse },
  { key: 'reservas',      label: 'Reservas',      icon: icReservas },
  { key: 'financeiro',    label: 'Financeiro',    icon: icFinanceiro },
  { key: 'itens',         label: 'Itens',         icon: icItens },
  { key: 'clientes',      label: 'Clientes',      icon: icClientes },
  { key: 'precos',        label: 'Preços',        icon: icPrecos },
];

const Sidebar = forwardRef(function Sidebar({ collapsed, page, onNavigate, onLogout }, ref){
  return (
    <aside className={collapsed ? 'layout__sidebar layout__sidebar--collapsed' : 'layout__sidebar'} aria-label="Menu lateral" ref={ref}>
      <section className="user" aria-label="Usuário">
        <img className="user__avatar" src="https://randomuser.me/api/portraits/men/32.jpg" alt="Foto do usuário"/>
        <strong className="user__name">Vicente</strong>
        <p className="user__role">Recepcionista</p>
        
      </section>
      <nav className="menu" aria-label="Navegação principal">
        {items.map(it => (
          <a
            key={it.key}
            href="#"
            className="menu__item"
            aria-current={page === it.key ? 'page' : undefined}
            onClick={(e)=>{e.preventDefault(); onNavigate(it.key);}}
          >
            <img className="menu__icon" alt="" src={it.icon}/>
            <span className="menu__label">{it.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
})

export default Sidebar
