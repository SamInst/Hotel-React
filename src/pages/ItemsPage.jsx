// src/pages/ItemsPage.jsx
import React, { useMemo, useState } from 'react';
import { Modal } from '../components/Modal.jsx';

const money = n =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(n || 0),
  );

const CATS_INIT = ['BEBIDA', 'DOCE', 'SALGADO'];
const ITEMS_INIT = [
  { id: 1, nome: 'Agua Mineral 350ml', categoria: 'BEBIDA', compra: 0.89, venda: 3.0, estoque: 24, last: '2025-04-20' },
  { id: 2, nome: 'Biscoito Oreo 90g', categoria: 'DOCE', compra: 2.45, venda: 5.0, estoque: 72, last: '2025-02-20' },
  { id: 3, nome: 'Salgadinho FEST 130g', categoria: 'SALGADO', compra: 1.36, venda: 4.0, estoque: 64, last: '2025-03-20' },
];
const HIST_INIT = {
  1: [
    { date: '2025-03-20', qty: 10, buy: 0.89, sell: 3.0 },
    { date: '2025-04-20', qty: 15, buy: 0.89, sell: 3.0 },
  ],
  2: [
    { date: '2025-03-20', qty: 10, buy: 2.45, sell: 5.0 },
    { date: '2025-04-20', qty: 15, buy: 2.45, sell: 5.0 },
  ],
  3: [
    { date: '2025-03-20', qty: 40, buy: 1.36, sell: 4.0 },
    { date: '2025-04-20', qty: 12, buy: 1.36, sell: 4.0 },
    { date: '2025-05-20', qty: 12, buy: 1.36, sell: 4.0 },
  ],
};

export default function ItemsPage() {
  const [cats, setCats] = useState(CATS_INIT);
  const [tab, setTab] = useState('TODOS');
  const [items, setItems] = useState(ITEMS_INIT);
  const [hist, setHist] = useState(HIST_INIT);

  const [fItem, setFItem] = useState({ nome: '', categoria: 'DOCE', compra: '', venda: '' });
  const [fCat, setFCat] = useState('');
  const [fStock, setFStock] = useState({ itemId: ITEMS_INIT[0].id, qty: '', buy: '', sell: '' });

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [modalManageCatOpen, setModalManageCatOpen] = useState(false);
  const [modalStockOpen, setModalStockOpen] = useState(false);

  const filtered = useMemo(() => {
    if (tab === 'TODOS') return items;
    return items.filter(i => i.categoria === tab);
  }, [items, tab]);

  function addCategory() {
    const name = fCat.trim().toUpperCase();
    if (!name || cats.includes(name)) return;
    setCats([...cats, name]);
    setFCat('');
  }

  function addItem() {
    if (!fItem.nome.trim()) return;
    const id = Math.max(...items.map(i => i.id)) + 1;
    const novo = {
      id,
      nome: fItem.nome.trim(),
      categoria: fItem.categoria || cats[0],
      compra: Number(fItem.compra || 0),
      venda: Number(fItem.venda || 0),
      estoque: 0,
      last: '',
    };
    setItems([novo, ...items]);
    setFItem({ nome: '', categoria: cats[0] || 'BEBIDA', compra: '', venda: '' });
  }

  function openEdit(i) {
    setEditItem({ ...i });
    setEditOpen(true);
  }

  function saveEdit() {
    setItems(
      items.map(it =>
        it.id === editItem.id
          ? { ...editItem, compra: Number(editItem.compra || 0), venda: Number(editItem.venda || 0) }
          : it,
      ),
    );
    setEditOpen(false);
  }

  function addStock() {
    const itemId = Number(fStock.itemId);
    const qty = Number(fStock.qty);
    if (!itemId || !qty) return;
    const buy = Number(fStock.buy || 0);
    const sell = Number(fStock.sell || 0);
    const today = new Date().toISOString().slice(0, 10);

    setItems(
      items.map(i => {
        if (i.id !== itemId) return i;
        return {
          ...i,
          estoque: i.estoque + qty,
          compra: buy || i.compra,
          venda: sell || i.venda,
          last: today,
        };
      }),
    );

    setHist(h => {
      const arr = h[itemId] ? [...h[itemId]] : [];
      const base = items.find(i => i.id === itemId);
      arr.unshift({ date: today, qty, buy: buy || base?.compra || 0, sell: sell || base?.venda || 0 });
      return { ...h, [itemId]: arr };
    });

    setFStock(s => ({ ...s, qty: '', buy: '', sell: '' }));
  }

  const stockItem = items.find(i => i.id === Number(fStock.itemId)) || items[0];
  const stockHist = hist[stockItem?.id] || [];

  return (
    <div className="form-page">
      <style>{`
        .row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}
        .cell{flex:1 1 220px;min-width:180px}
        .cell--wide{flex:2 1 320px}
        .cell--button{flex:0 0 auto}
        .control,.btn{height:40px}
        .pillbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
        .pill{padding:8px 12px;border-radius:10px;border:1px solid #e6e6e6;background:#fff}
        .pill[aria-pressed="true"]{font-weight:700;box-shadow:0 0 0 2px #7aa7ff33}
        .clients-thead>div,.client-row>.client-dates{text-align:center}
        .client-row .client-name{text-align:left}
        @media (max-width:640px){.cell{min-width:140px}}
      `}</style>

      <div className="pillbar">
        {['TODOS', ...cats].map(t => (
          <button
            key={t}
            className="pill"
            type="button"
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="form-card">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Novo Item</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => setModalManageCatOpen(true)}>+ Adicionar categoria</button>
            <button className="btn" onClick={() => setModalStockOpen(true)}>+ Adicionar estoque</button>
          </div>
        </div>

        <div className="row">
          <div className="field cell cell--wide">
            <label>Descrição do Item</label>
            <input
              className="control"
              value={fItem.nome}
              onChange={e => setFItem(s => ({ ...s, nome: e.target.value }))}
            />
          </div>

          <div className="field cell">
            <label>Categoria</label>
            <select
              className="control"
              value={fItem.categoria}
              onChange={e => setFItem(s => ({ ...s, categoria: e.target.value }))}
            >
              {cats.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="field cell">
            <label>Valor unitário de Compra</label>
            <input
              className="control"
              placeholder="R$"
              value={fItem.compra}
              onChange={e => setFItem(s => ({ ...s, compra: e.target.value }))}
            />
          </div>

          <div className="field cell">
            <label>Valor de venda</label>
            <input
              className="control"
              placeholder="R$"
              value={fItem.venda}
              onChange={e => setFItem(s => ({ ...s, venda: e.target.value }))}
            />
          </div>

          <div className="cell cell--button">
            <button className="btn btn--primary" onClick={addItem}>Adicionar</button>
          </div>
        </div>

        <div className="clients-table" style={{ marginTop: 16 }}>
          <div className="clients-thead" style={{ gridTemplateColumns: '1fr 160px 160px 180px 180px' }}>
            <div className="left">Item</div>
            <div>Qtd. restantes</div>
            <div>Categoria</div>
            <div>Valor unitário de compra</div>
            <div>Valor de venda</div>
          </div>
          <div>
            {filtered.map(i => (
              <button
                key={i.id}
                type="button"
                className="client-row client-row--button"
                style={{ gridTemplateColumns: '1fr 160px 160px 180px 180px' }}
                onClick={() => openEdit(i)}
              >
                <div className="client-name">{i.nome}</div>
                <div className="client-dates">{i.estoque}</div>
                <div className="client-dates">{i.categoria}</div>
                <div className="client-dates" style={{ color: '#e86d5a' }}>{money(i.compra)}</div>
                <div className="client-dates" style={{ color: '#1f6feb' }}>{money(i.venda)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        {editItem && (
          <div className="form-card" style={{ boxShadow: 'none', padding: 0 }}>
            <h3 className="form-card__title">Editar Item</h3>
            <div className="row">
              <div className="field cell cell--wide">
                <label>Nome</label>
                <input
                  className="control"
                  value={editItem.nome}
                  onChange={e => setEditItem(s => ({ ...s, nome: e.target.value }))}
                />
              </div>
              <div className="field cell">
                <label>Categoria</label>
                <select
                  className="control"
                  value={editItem.categoria}
                  onChange={e => setEditItem(s => ({ ...s, categoria: e.target.value }))}
                >
                  {cats.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="field cell">
                <label>Estoque</label>
                <input
                  className="control"
                  value={editItem.estoque}
                  onChange={e => setEditItem(s => ({ ...s, estoque: Number(e.target.value || 0) }))}
                />
              </div>
              <div className="field cell">
                <label>Valor compra (un.)</label>
                <input
                  className="control"
                  value={editItem.compra}
                  onChange={e => setEditItem(s => ({ ...s, compra: e.target.value }))}
                />
              </div>
              <div className="field cell">
                <label>Valor venda (un.)</label>
                <input
                  className="control"
                  value={editItem.venda}
                  onChange={e => setEditItem(s => ({ ...s, venda: e.target.value }))}
                />
              </div>
              <div className="cell cell--button">
                <button className="btn" onClick={() => setEditOpen(false)}>Cancelar</button>
              </div>
              <div className="cell cell--button">
                <button className="btn btn--primary" onClick={saveEdit}>Salvar</button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modalManageCatOpen} onClose={() => setModalManageCatOpen(false)}>
        <div className="form-card" style={{ boxShadow: 'none', padding: 0 }}>
          <h3 className="form-card__title">Categoria — Item</h3>
          <div className="row">
            <div className="field cell cell--wide">
              <label>Categoria</label>
              <input className="control" value={fCat} onChange={e => setFCat(e.target.value.toUpperCase())} />
            </div>
            <div className="cell cell--button">
              <button className="btn btn--primary" onClick={addCategory}>Adicionar</button>
            </div>
          </div>
          <div className="clients-table" style={{ marginTop: 12 }}>
            <div className="clients-thead">
              <div>Categoria</div>
            </div>
            <div>
              {cats.map(c => (
                <div key={c} className="client-row">
                  <div className="client-name">{c}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={modalStockOpen} onClose={() => setModalStockOpen(false)}>
        <div className="form-card" style={{ boxShadow: 'none', padding: 0 }}>
          <h3 className="form-card__title">Estoque — Item</h3>

          <div className="row">
            <div className="field cell cell--wide">
              <label>Item</label>
              <select
                className="control"
                value={fStock.itemId}
                onChange={e => setFStock(s => ({ ...s, itemId: e.target.value }))}
              >
                {items.map(i => (
                  <option key={i.id} value={i.id}>{i.nome}</option>
                ))}
              </select>
            </div>
            <div className="field cell">
              <label>Quantidade</label>
              <input className="control" value={fStock.qty} onChange={e => setFStock(s => ({ ...s, qty: e.target.value }))} />
            </div>
            <div className="field cell">
              <label>Valor unitário de Compra</label>
              <input className="control" placeholder="R$" value={fStock.buy} onChange={e => setFStock(s => ({ ...s, buy: e.target.value }))} />
            </div>
            <div className="field cell">
              <label>Valor de venda</label>
              <input className="control" placeholder="R$" value={fStock.sell} onChange={e => setFStock(s => ({ ...s, sell: e.target.value }))} />
            </div>
            <div className="cell cell--button">
              <button className="btn btn--primary" onClick={addStock}>Adicionar</button>
            </div>
          </div>

          <div className="clients-table" style={{ marginTop: 12 }}>
            <div className="clients-thead" style={{ gridTemplateColumns: '160px 160px 1fr 1fr' }}>
              <div>Data reposição</div>
              <div>Qtd. Estoque</div>
              <div>Valor compra unidade</div>
              <div>Valor de venda unidade</div>
            </div>
            <div>
              {stockHist.map((h, idx) => (
                <div key={idx} className="client-row" style={{ gridTemplateColumns: '160px 160px 1fr 1fr' }}>
                  <div className="client-dates">{h.date}</div>
                  <div className="client-dates">{h.qty}</div>
                  <div className="client-dates" style={{ color: '#e86d5a' }}>{money(h.buy)}</div>
                  <div className="client-dates" style={{ color: '#1f6feb' }}>{money(h.sell)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
