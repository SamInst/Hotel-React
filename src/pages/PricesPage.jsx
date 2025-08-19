import React, { useMemo, useState } from 'react';
import { Modal } from '../components/Modal.jsx';

const money = (n)=> new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(Number(n||0));

const INITIAL_CATEGORIES = [
  { id: 1, nome: 'SIMPLES' },
  { id: 2, nome: 'COMPLETO' },
  { id: 3, nome: 'MASTER DELUXE' },
];

const INITIAL_PRICES = {
  1: [{ qtd:1, valor:90 }, { qtd:2, valor:140 }, { qtd:3, valor:200 }],
  2: [{ qtd:1, valor:110 }, { qtd:2, valor:170 }, { qtd:3, valor:250 }],
  3: [],
};

export default function PricesPage(){
  const [cats, setCats] = useState(INITIAL_CATEGORIES);
  const [prices, setPrices] = useState(INITIAL_PRICES);

  const [qtd, setQtd] = useState('');
  const [catSel, setCatSel] = useState(1);
  const [valor, setValor] = useState('');

  const [newCat, setNewCat] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editCatId, setEditCatId] = useState(null);
  const [editRows, setEditRows] = useState([]);

  const byCat = useMemo(()=> {
    return cats.map(c => ({
      cat: c,
      rows: (prices[c.id] || []).slice().sort((a,b)=>a.qtd-b.qtd)
    }));
  }, [cats, prices]);

  function addPrice(){
    const q = Number(qtd);
    const v = Number(valor);
    const cid = Number(catSel);
    if(!q || Number.isNaN(v) || !cid) return;
    setPrices(p => {
      const arr = (p[cid] || []).slice();
      const i = arr.findIndex(x=>x.qtd===q);
      if(i>=0) arr[i] = { qtd:q, valor:v };
      else arr.push({ qtd:q, valor:v });
      return { ...p, [cid]: arr };
    });
    setQtd('');
    setValor('');
  }

  function addCategory(){
    const name = newCat.trim().toUpperCase();
    if(!name) return;
    const id = Math.max(0, ...cats.map(c=>c.id)) + 1;
    setCats([{ id, nome:name }, ...cats]);
    setPrices(p => ({ ...p, [id]: [] }));
    setNewCat('');
  }

  function openEditor(cid){
    setEditCatId(cid);
    setEditRows((prices[cid] || []).slice().sort((a,b)=>a.qtd-b.qtd));
    setEditOpen(true);
  }

  function saveEditor(){
    setPrices(p => ({ ...p, [editCatId]: editRows.filter(r=>r.qtd && r.valor!=='') }));
    setEditOpen(false);
  }

  return (
    <div className="form-page" style={{gap:20}}>
      <section className="form-card">
        <h2 className="form-card__title" style={{display:'flex',alignItems:'center',gap:10}}>
          <span role="img" aria-label="prices">💰🛏️</span> Valores das Diárias
        </h2>

        <div className="form-grid" style={{alignItems:'end'}}>
          <div className="field col-4">
            <label>Quantidade de Pessoas</label>
            <input className="control" type="number" min="1" value={qtd} onChange={e=>setQtd(e.target.value)} />
          </div>
          <div className="field col-4">
            <label>Categoria</label>
            <select className="control" value={catSel} onChange={e=>setCatSel(e.target.value)}>
              {cats.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="field col-3">
            <label>Valor</label>
            <input className="control" inputMode="decimal" placeholder="R$" value={valor} onChange={e=>setValor(e.target.value)} />
          </div>
          <div className="field col-1" style={{display:'flex',justifyContent:'flex-end'}}>
            <button className="btn btn--primary" type="button" onClick={addPrice}>Adicionar</button>
          </div>
        </div>

        {byCat.map(({cat, rows})=>(
          <div key={cat.id} className="price-cat" onClick={()=>openEditor(cat.id)} role="button" tabIndex={0} onKeyDown={(e)=>e.key==='Enter'&&openEditor(cat.id)}>
            <div className="price-cat__title">{cat.nome}</div>
            <div className="price-cat__body">
              {rows.length===0 && <div className="price-line"><span className="price-line__left" style={{opacity:.7}}>Sem valores cadastrados</span></div>}
              {rows.map(r=>(
                <div key={r.qtd} className="price-line">
                  <span className="price-line__left">{r.qtd} {r.qtd===1?'pessoa':'pessoas'}</span>
                  <span className="price-line__right">{money(r.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="form-card">
        <h2 className="form-card__title" style={{display:'flex',alignItems:'center',gap:10}}>
          <span role="img" aria-label="tag">🗂️</span> Categoria - Preço
        </h2>

        <div className="form-grid" style={{alignItems:'end'}}>
          <div className="field col-10">
            <label>Categoria</label>
            <input className="control" value={newCat} onChange={e=>setNewCat(e.target.value)} />
          </div>
          <div className="field col-2" style={{display:'flex',justifyContent:'flex-end'}}>
            <button className="btn btn--primary" type="button" onClick={addCategory}>Adicionar</button>
          </div>
        </div>

        <div className="price-table">
          <div className="price-table__head">Categoria</div>
          <div className="price-table__body">
            {cats.map(c=>(
              <div key={c.id} className="price-table__row">{c.nome}</div>
            ))}
          </div>
        </div>
      </section>

      <Modal open={editOpen} onClose={()=>setEditOpen(false)}>
        <div className="form-card" style={{boxShadow:'none', padding:0}}>
          <h3 className="form-card__title">Editar preços — {cats.find(c=>c.id===editCatId)?.nome || ''}</h3>
          <div className="form-grid" style={{gridTemplateColumns:'repeat(12, 1fr)'}}>
            {editRows.map((r,idx)=>(
              <React.Fragment key={idx}>
                <div className="field col-4">
                  <label>Qtd pessoas</label>
                  <input className="control" type="number" min="1" value={r.qtd}
                         onChange={e=>{
                           const v = Number(e.target.value);
                           setEditRows(rows => rows.map((x,i)=> i===idx ? {...x, qtd:v} : x));
                         }} />
                </div>
                <div className="field col-6">
                  <label>Valor</label>
                  <input className="control" inputMode="decimal" value={r.valor}
                         onChange={e=>{
                           const v = e.target.value;
                           setEditRows(rows => rows.map((x,i)=> i===idx ? {...x, valor:v} : x));
                         }} />
                </div>
                <div className="field col-2" style={{display:'flex',alignItems:'end'}}>
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={()=> setEditRows(rows => rows.filter((_,i)=>i!==idx))}
                  >Remover</button>
                </div>
              </React.Fragment>
            ))}
            <div className="col-12" style={{display:'flex',justifyContent:'flex-start',marginTop:6}}>
              <button
                type="button"
                className="btn"
                onClick={()=> setEditRows(rows => [...rows, { qtd: (rows.at(-1)?.qtd||0)+1, valor:'' }])}
              >Adicionar Linha</button>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn" onClick={()=>setEditOpen(false)}>Cancelar</button>
            <button className="btn btn--primary" onClick={saveEditor}>Salvar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
