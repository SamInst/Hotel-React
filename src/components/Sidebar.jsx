import React,{forwardRef,useEffect,useRef} from "react";
import "./Sidebar.css";
import icDashboard from "../icons/dashboard.png";
import icPernoites from "../icons/pernoites.png";
import icQuartos from "../icons/quartos.png";
import icDayUse from "../icons/entrada.png";
import icReservas from "../icons/reservas.png";
import icFinanceiro from "../icons/relatorios.png";
import icItens from "../icons/itens.png";
import icClientes from "../icons/hospedes.png";
import icPrecos from "../icons/precos.png";

const items=[
  {key:"dashboard",label:"Dashboard",icon:icDashboard},
  {key:"pernoites",label:"Pernoites",icon:icPernoites},
  {key:"apartamentos",label:"Apartamentos",icon:icQuartos},
  {key:"dayuse",label:"Day Use",icon:icDayUse},
  {key:"reservas",label:"Reservas",icon:icReservas},
  {key:"financeiro",label:"Financeiro",icon:icFinanceiro},
  {key:"itens",label:"Itens",icon:icItens},
  {key:"clientes",label:"Clientes",icon:icClientes},
  {key:"precos",label:"Preços",icon:icPrecos},
];

const Sidebar=forwardRef(function Sidebar({collapsed,page,onNavigate},ref){
  const menuRef=useRef(null);

  useEffect(()=>{
    const el=menuRef.current; if(!el) return;
    const isMobile=()=>window.matchMedia("(max-width:1024px)").matches;

    const updateState=()=>{
      const overflowing=el.scrollWidth>el.clientWidth+1;
      el.classList.toggle("menu--overflowing",overflowing);
      const atStart=el.scrollLeft<=2,atEnd=Math.ceil(el.scrollLeft+el.clientWidth)>=el.scrollWidth-2;
      el.classList.toggle("menu--fade-left",overflowing && !atStart);
      el.classList.toggle("menu--fade-right",overflowing && !atEnd);
      if(!overflowing && el.scrollLeft!==0) el.scrollTo({left:0,behavior:"instant"});
    };
    updateState();

    const onScroll=()=>updateState();
    el.addEventListener("scroll",onScroll,{passive:true});

    const onWheel=(e)=>{ if(!isMobile())return; if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){ el.scrollLeft+=e.deltaY; e.preventDefault(); } };

    let mDown=false,mStartX=0,mStartL=0;
    const md=(e)=>{ if(!isMobile())return; mDown=true;mStartX=e.pageX;mStartL=el.scrollLeft;el.style.cursor="grabbing";e.preventDefault(); };
    const mm=(e)=>{ if(!mDown)return; el.scrollLeft=mStartL-(e.pageX-mStartX); };
    const mu=()=>{ mDown=false; el.style.cursor=""; };

    let tDown=false,tStartX=0,tStartL=0;
    const ts=(e)=>{ if(!isMobile())return; const t=e.touches[0]; tDown=true;tStartX=t.clientX;tStartL=el.scrollLeft; };
    const tm=(e)=>{ if(!tDown)return; const t=e.touches[0]; el.scrollLeft=tStartL-(t.clientX-tStartX); e.preventDefault(); };
    const te=()=>{ tDown=false; };

    el.addEventListener("wheel",onWheel,{passive:false});
    el.addEventListener("mousedown",md);
    window.addEventListener("mousemove",mm);
    window.addEventListener("mouseup",mu);
    el.addEventListener("touchstart",ts,{passive:true});
    el.addEventListener("touchmove",tm,{passive:false});
    el.addEventListener("touchend",te); el.addEventListener("touchcancel",te);

    const ro=new ResizeObserver(updateState); ro.observe(el);
    const mo=new MutationObserver(updateState); mo.observe(el,{childList:true,subtree:true});

    return()=>{ el.removeEventListener("scroll",onScroll); el.removeEventListener("wheel",onWheel);
      el.removeEventListener("mousedown",md); window.removeEventListener("mousemove",mm); window.removeEventListener("mouseup",mu);
      el.removeEventListener("touchstart",ts); el.removeEventListener("touchmove",tm); el.removeEventListener("touchend",te); el.removeEventListener("touchcancel",te);
      ro.disconnect(); mo.disconnect();
    };
  },[]);

  return(
    <aside className={collapsed?"layout__sidebar layout__sidebar--collapsed":"layout__sidebar"} aria-label="Menu lateral" ref={ref}>
      <section className="user" aria-label="Usuário">
        <img className="user__avatar" src="https://randomuser.me/api/portraits/men/32.jpg" alt="Foto do usuário"/>
        <strong className="user__name">Vicente</strong>
        <p className="user__role">Recepcionista</p>
      </section>
      <nav className="menu" aria-label="Navegação principal" ref={menuRef}>
        {items.map(it=>(
          <a key={it.key} href="#" className="menu__item" aria-current={page===it.key?"page":undefined}
             onClick={(e)=>{e.preventDefault();onNavigate(it.key);}}>
            <img className="menu__icon" alt="" src={it.icon}/>
            <span className="menu__label">{it.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
});
export default Sidebar;
