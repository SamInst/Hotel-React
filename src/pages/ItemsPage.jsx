// src/pages/ItemsPage.jsx
import React, { useMemo, useState } from 'react';
import { Modal } from '../components/Modal.jsx';

const money = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n||0));

const CATS_INIT = ['BEBIDA','DOCE','SALGADO'];
const ITEMS_INIT = [
  { id:1, nome:'Agua Mineral 350ml', categoria:'BEBIDA', compra:0.89, venda:3.00, estoque:24, last:'2025-04-20' },
  { id:2, nome:'Biscoito Oreo 90g',  categoria:'DOCE',   compra:2.45, venda:5.00, estoque:72, last:'2025-02-20' },
  { id:3, nome:'Salgadinho FEST 130g', categoria:'SALGADO', compra:1.36, venda:4.00, estoque:64, last:'2025-03-20' },
];
const HIST_INIT = {
  1:[{date:'2025-03-20',qty:10,buy:0.89,sell:3.00},{date:'2025-04-20',qty:15,buy:0.89,sell:3.00}],
  2:[{date:'2025-03-20',qty:10,buy:2.45,sell:5.00},{date:'2025-04-20',qty:15,buy:2.45,sell:5.00}],
  3:[{date:'2025-03-20',qty:40,buy:1.36,sell:4.00},{date:'2025-04-20',qty:12,buy:1.36,sell:4.00},{date:'2025-05-20',qty:12,buy:1.36,sell:4.00}],
};

export default function ItemsPage(){
  const [cats, setCats] = useState(CATS_INIT);
  const [tab, setTab] = useState('TODOS');
  const [items, setItems] = useState(ITEMS_INIT);
  const [hist, setHist] = useState(HIST_INIT);

  const [fItem, setFItem] = useState({ nome:'', categoria:'DOCE', compra:'', venda:'' });
  const [fCat, setFCat]   = useState('');
  const [fStock, setFStock] = useState({ itemId: ITEMS_INIT[0].id, qty:'', buy:'', sell:'' });

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [histOpen, setHistOpen] = useState(false);
  const [histItem, setHistItem] = useState(null);

  const filtered = useMemo(()=>{
    if(tab==='TODOS') return items;
    return items.filter(i=>i.categoria===tab);
  },[items,tab]);

  function addCategory(){
    const name = fCat.trim().toUpperCase();
    if(!name || cats.includes(name)) return;
    setCats([...cats,name]);
    setFCat('');
  }

  function addItem(){
    if(!fItem.nome.trim()) return;
    const id = Math.max(...items.map(i=>i.id))+1;
    const novo = {
      id,
      nome: fItem.nome.trim(),
      categoria: fItem.categoria || cats[0],
      compra: Number(fItem.compra||0),
      venda: Number(fItem.venda||0),
      estoque: 0,
      last:''
    };
    setItems([novo, ...items]);
    setFItem({ nome:'', categoria: cats[0]||'BEBIDA', compra:'', venda:'' });
  }

  function openEdit(i){ setEditItem({...i}); setEditOpen(true); }
  function saveEdit(){
    setItems(items.map(it=>it.id===editItem.id ? {...editItem, compra:Number(editItem.compra||0), venda:Number(editItem.venda||0)} : it));
    setEditOpen(false);
  }

  function addStock(){
    const itemId = Number(fStock.itemId);
    const qty = Number(fStock.qty);
    if(!itemId || !qty) return;
    const buy = Number(fStock.buy||0);
    const sell = Number(fStock.sell||0);
    const today = new Date().toISOString().slice(0,10);

    setItems(items.map(i=>{
      if(i.id!==itemId) return i;
      return {
        ...i,
        estoque: i.estoque + qty,
        compra: buy || i.compra,
        venda: sell || i.venda,
        last: today
      };
    }));

    setHist(h=>{
      const arr = h[itemId] ? [...h[itemId]] : [];
      const base = items.find(i=>i.id===itemId);
      arr.unshift({date:today, qty, buy: buy || base?.compra || 0, sell: sell || base?.venda || 0});
      return {...h,[itemId]:arr};
    });

    setFStock(s=>({...s, qty:'', buy:'', sell:''}));
  }

  function openHistoryFor(item){ setHistItem(item); setHistOpen(true); }

  return (
    <div className="form-page">

      <div className="form-card">
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
          <img src="https://cdn-icons-png.flaticon.com/128/1046/1046890.png" alt="" width="28" height="28"/>
          <h2 style={{margin:'0 8px 0 0'}}>Novo Item</h2>
          <div style={{display:'flex',gap:8}}>
            {['TODOS',...cats].map(t=>(
              <button
                key={t}
                type="button"
                className="btn"
                onClick={()=>setTab(t)}
                aria-pressed={tab===t}
                style={{fontWeight: tab===t?700:500}}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="form-grid">
          <div className="field col-5">
            <label>Descrição do Item</label>
            <input className="control" value={fItem.nome} onChange={e=>setFItem(s=>({...s,nome:e.target.value}))}/>
          </div>
        <div className="field col-3">
            <label>Categoria</label>
            <select className="control" value={fItem.categoria} onChange={e=>setFItem(s=>({...s,categoria:e.target.value}))}>
              {cats.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field col-2">
            <label>Valor unitário de Compra</label>
            <input className="control" placeholder="R$" value={fItem.compra} onChange={e=>setFItem(s=>({...s,compra:e.target.value}))}/>
          </div>
          <div className="field col-2">
            <label>Valor de venda</label>
            <input className="control" placeholder="R$" value={fItem.venda} onChange={e=>setFItem(s=>({...s,venda:e.target.value}))}/>
          </div>
          <div className="col-12">
            <button className="btn btn--primary" style={{width:'100%'}} onClick={addItem}>Adicionar</button>
          </div>
        </div>

        <div className="clients-table" style={{marginTop:16}}>
          <div className="clients-thead" style={{gridTemplateColumns:'1fr 160px 160px 180px 180px'}}>
            <div>Item</div>
            <div>Qtd. restantes</div>
            <div>Categoria</div>
            <div>Valor unitário de compra</div>
            <div>Valor de venda</div>
          </div>
          <div>
            {filtered.map(i=>(
              <button
                key={i.id}
                type="button"
                className="client-row client-row--button"
                style={{gridTemplateColumns:'1fr 160px 160px 180px 180px'}}
                onClick={()=>openEdit(i)}
              >
                <div className="client-name">{i.nome}</div>
                <div className="client-dates">{i.estoque}</div>
                <div className="client-dates">{i.categoria}</div>
                <div className="client-dates" style={{color:'#e86d5a'}}>{money(i.compra)}</div>
                <div className="client-dates" style={{color:'#1f6feb'}}>{money(i.venda)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-card">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
          <img src="https://cdn-icons-png.flaticon.com/128/1040/1040238.png" alt="" width="28" height="28"/>
          <h3 className="form-card__title" style={{margin:0}}>Categoria - Item</h3>
        </div>
        <div className="form-grid" style={{alignItems:'end'}}>
          <div className="field col-9">
            <label>Categoria</label>
            <input className="control" value={fCat} onChange={e=>setFCat(e.target.value.toUpperCase())}/>
          </div>
          <div className="col-3">
            <button className="btn btn--primary" style={{width:'100%'}} onClick={addCategory}>Adicionar</button>
          </div>
        </div>

        <div className="clients-table" style={{marginTop:12}}>
          <div className="clients-thead"><div>Categoria</div></div>
          <div>
            {cats.map(c=>(
              <div key={c} className="client-row">
                <div className="client-name">{c}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="form-card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <img src="https://cdn-icons-png.flaticon.com/128/679/679922.png" alt="" width="28" height="28"/>
            <h3 className="form-card__title" style={{margin:0}}>Estoque - Item</h3>
          </div>
          <button className="btn" onClick={()=>openHistoryFor(items.find(i=>i.id===Number(fStock.itemId)) || items[0])}>Ver histórico</button>
        </div>

        <div className="form-grid" style={{alignItems:'end'}}>
          <div className="field col-5">
            <label>Item</label>
            <select className="control" value={fStock.itemId} onChange={e=>setFStock(s=>({...s,itemId:e.target.value}))}>
              {items.map(i=><option key={i.id} value={i.id}>{i.nome}</option>)}
            </select>
          </div>
          <div className="field col-2">
            <label>Quantidade</label>
            <input className="control" value={fStock.qty} onChange={e=>setFStock(s=>({...s,qty:e.target.value}))}/>
          </div>
          <div className="field col-2">
            <label>Valor unitário de Compra</label>
            <input className="control" placeholder="R$" value={fStock.buy} onChange={e=>setFStock(s=>({...s,buy:e.target.value}))}/>
          </div>
          <div className="field col-2">
            <label>Valor de venda</label>
            <input className="control" placeholder="R$" value={fStock.sell} onChange={e=>setFStock(s=>({...s,sell:e.target.value}))}/>
          </div>
          <div className="col-1">
            <button className="btn btn--primary" style={{width:'100%'}} onClick={addStock}>Adicionar</button>
          </div>
        </div>

        <div className="clients-table" style={{marginTop:14}}>
          <div className="clients-thead" style={{gridTemplateColumns:'160px 1fr 180px 180px 180px'}}>
            <div>Data última reposição</div>
            <div>Item</div>
            <div>Unidades em estoque</div>
            <div>Valor compra unidade</div>
            <div>Valor de venda unidade</div>
          </div>
          <div>
            {items.map(i=>(
              <button
                key={'s-'+i.id}
                type="button"
                className="client-row client-row--button"
                style={{gridTemplateColumns:'160px 1fr 180px 180px 180px'}}
                onClick={()=>openHistoryFor(i)}
              >
                <div className="client-dates">{i.last || '—'}</div>
                <div className="client-name">{i.nome}</div>
                <div className="client-dates">{i.estoque}</div>
                <div className="client-dates" style={{color:'#e86d5a'}}>{money(i.compra)}</div>
                <div className="client-dates" style={{color:'#1f6feb'}}>{money(i.venda)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Modal open={editOpen} onClose={()=>setEditOpen(false)}>
        {editItem && (
          <div className="form-card" style={{boxShadow:'none',padding:0}}>
            <h3 className="form-card__title">Editar Item</h3>
            <div className="form-grid">
              <div className="field col-6">
                <label>Nome</label>
                <input className="control" value={editItem.nome} onChange={e=>setEditItem(s=>({...s,nome:e.target.value}))}/>
              </div>
              <div className="field col-3">
                <label>Categoria</label>
                <select className="control" value={editItem.categoria} onChange={e=>setEditItem(s=>({...s,categoria:e.target.value}))}>
                  {cats.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field col-3">
                <label>Estoque</label>
                <input className="control" value={editItem.estoque} onChange={e=>setEditItem(s=>({...s,estoque:Number(e.target.value||0)}))}/>
              </div>
              <div className="field col-6">
                <label>Valor compra (un.)</label>
                <input className="control" value={editItem.compra} onChange={e=>setEditItem(s=>({...s,compra:e.target.value}))}/>
              </div>
              <div className="field col-6">
                <label>Valor venda (un.)</label>
                <input className="control" value={editItem.venda} onChange={e=>setEditItem(s=>({...s,venda:e.target.value}))}/>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn" onClick={()=>setEditOpen(false)}>Cancelar</button>
              <button className="btn btn--primary" onClick={saveEdit}>Salvar</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={histOpen} onClose={()=>setHistOpen(false)}>
        {histItem && (
          <div className="form-card" style={{boxShadow:'none',padding:0}}>
            <h3 className="form-card__title">Histórico de itens — {histItem.nome}</h3>
            <div className="clients-table" style={{marginTop:10}}>
              <div className="clients-thead" style={{gridTemplateColumns:'160px 160px 1fr 1fr'}}>
                <div>Data reposição</div>
                <div>Qtd. Estoque</div>
                <div>Valor compra unidade</div>
                <div>Valor de venda unidade</div>
              </div>
              <div>
                {(hist[histItem.id]||[]).map((h,idx)=>(
                  <div key={idx} className="client-row" style={{gridTemplateColumns:'160px 160px 1fr 1fr'}}>
                    <div className="client-dates">{h.date}</div>
                    <div className="client-dates">{h.qty}</div>
                    <div className="client-dates" style={{color:'#e86d5a'}}>{money(h.buy)}</div>
                    <div className="client-dates" style={{color:'#1f6feb'}}>{money(h.sell)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
