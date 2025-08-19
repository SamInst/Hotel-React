import React, { useEffect, useState } from 'react'
import { Modal } from './Modal.jsx'

export function AddRoomModal({ open, onClose, categories, onSave }){
  const [roomNumber, setRoomNumber] = useState('')
  const [roomType, setRoomType] = useState('')
  const [roomCategory, setRoomCategory] = useState('')
  const [doubleBeds, setDoubleBeds] = useState(0)
  const [singleBeds, setSingleBeds] = useState(0)
  const [hammocks, setHammocks] = useState(0)
  const [bunkBeds, setBunkBeds] = useState(0)

  useEffect(()=>{
    if(!open){
      setRoomNumber(''); setRoomType(''); setRoomCategory('')
      setDoubleBeds(0); setSingleBeds(0); setHammocks(0); setBunkBeds(0)
    }
  }, [open])

  const save = () => {
    if(!roomNumber || !roomType || !roomCategory){ alert('Preencha os campos obrigatórios!'); return; }
    const cap = doubleBeds*2 + singleBeds + hammocks + bunkBeds*2 || 1
    onSave({
      numero: roomNumber, status: 2, tipo: roomType, pessoas: cap,
      qtd_cama_casal: doubleBeds, qtd_cama_solteiro: singleBeds, qtd_rede: hammocks, qtd_beliche: bunkBeds,
      fk_categoria: roomCategory
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2>Adicionar Novo Quarto</h2>
      <div className="form__group">
        <label>Número do Quarto</label>
        <input className="form__control" type="text" value={roomNumber} onChange={e=>setRoomNumber(e.target.value)} />
      </div>
      <div className="form__group">
        <label>Tipo de Quarto</label>
        <select className="form__control" value={roomType} onChange={e=>setRoomType(e.target.value)}>
          <option value="">Selecione...</option>
          <option value="SIMPLES">SIMPLES</option>
          <option value="DUPLO">DUPLO</option>
          <option value="TRIPLO">TRIPLO</option>
          <option value="LUXO">LUXO</option>
          <option value="PRESIDENCIAL">PRESIDENCIAL</option>
        </select>
      </div>
      <div className="form__group">
        <label>Categoria</label>
        <select className="form__control" value={roomCategory} onChange={e=>setRoomCategory(e.target.value)}>
          <option value="">Selecione...</option>
          {Object.keys(categories).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <div className="form__group"><label>Camas de Casal</label><input className="form__control" type="number" min="0" value={doubleBeds} onChange={e=>setDoubleBeds(+e.target.value||0)} /></div>
      <div className="form__group"><label>Camas de Solteiro</label><input className="form__control" type="number" min="0" value={singleBeds} onChange={e=>setSingleBeds(+e.target.value||0)} /></div>
      <div className="form__group"><label>Redes</label><input className="form__control" type="number" min="0" value={hammocks} onChange={e=>setHammocks(+e.target.value||0)} /></div>
      <div className="form__group"><label>Beliches</label><input className="form__control" type="number" min="0" value={bunkBeds} onChange={e=>setBunkBeds(+e.target.value||0)} /></div>
      <div className="modal__footer">
        <button className="btn btn--danger" onClick={onClose}>Cancelar</button>
        <button className="btn btn--primary" onClick={save}>Salvar</button>
      </div>
    </Modal>
  )
}

export function AddCategoryModal({ open, onClose, onSave }){
  const [name, setName] = useState('')
  const [rows, setRows] = useState([{qtd:'', valor:''}])

  useEffect(()=>{
    if(open){ setName(''); setRows([{qtd:'', valor:''}]); }
  }, [open])

  const addRow = () => setRows(v => [...v, {qtd:'', valor:''}])
  const removeRow = (idx) => setRows(v => v.filter((_,i)=>i!==idx))
  const updateRow = (idx, field, value) => setRows(v => v.map((r,i)=> i===idx ? {...r, [field]: value} : r))

  const save = () => {
    if(!name){ alert('Informe a descrição'); return; }
    const prices = {}
    rows.forEach(r=>{ if(r.qtd && r.valor) prices[r.qtd] = parseFloat(r.valor) })
    onSave(name, { prices })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2>Adicionar Nova Categoria</h2>
      <div className="form__group">
        <label>Descrição</label>
        <input className="form__control" type="text" value={name} onChange={e=>setName(e.target.value)} />
      </div>
      <h3>Tabela de Preços</h3>
      <table className="price-table">
        <thead>
          <tr><th>Qtd Pessoas</th><th>Valor (R$)</th><th>Ação</th></tr>
        </thead>
        <tbody>
          {rows.map((r,idx)=>(
            <tr key={idx}>
              <td><input className="form__control" type="number" min="1" value={r.qtd} onChange={e=>updateRow(idx,'qtd',e.target.value)} placeholder="Qtd"/></td>
              <td><input className="form__control" type="number" min="0" step="0.01" value={r.valor} onChange={e=>updateRow(idx,'valor',e.target.value)} placeholder="0,00"/></td>
              <td><button type="button" className="btn btn--muted" onClick={()=>removeRow(idx)}>Remover</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{marginTop:10}}><button type="button" className="btn btn--primary" onClick={addRow}>Adicionar Linha</button></div>
      <div className="modal__footer">
        <button className="btn btn--danger" onClick={onClose}>Cancelar</button>
        <button className="btn btn--primary" onClick={save}>Salvar Categoria</button>
      </div>
    </Modal>
  )
}

export function RoomDetailsModal({ open, onClose, room }){
  if(!room) return null
  return (
    <Modal open={open} onClose={onClose}>
      <h2 style={{margin:0, marginBottom:10}}>{room.numero}</h2>
      <div className="info"><strong>Status</strong>{room.status}</div>
      {(room.status===1 || room.status===3) && (
        <>
          <div className="info"><strong>Hóspede Principal</strong>{room.representante || '-'}</div>
          <div className="info"><strong>Qtd Hóspedes</strong>{room.hospedes || room.pessoas}</div>
          <div className="info"><strong>Entrada</strong>{room.entrada || '-'}</div>
          <div className="info"><strong>Saída</strong>{room.saida || '-'}</div>
        </>
      )}
      <div className="info"><strong>Tipo</strong>{room.tipo}</div>
      <div className="info"><strong>Capacidade</strong>{room.pessoas} pessoa(s)</div>
    </Modal>
  )
}
