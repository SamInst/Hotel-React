import React, { useMemo, useState } from 'react'
import { Header, StatusCard } from '../components/Header.jsx'
import { AddCategoryModal, AddRoomModal, RoomDetailsModal } from '../components/Modals.jsx'
import { STATUS } from '../data/status.js'
import { ROOMS as INITIAL_ROOMS } from '../data/rooms.js'

function statusClass(s){
  switch(s){
    case 1: return 'card--ocupado'
    case 2: return 'card--disponivel'
    case 3: return 'card--reservado'
    case 4: return 'card--limpeza'
    case 5: return 'card--diaria'
    case 6: return 'card--manutencao'
    default: return ''
  }
}

export function ApartmentsPage(){
  const [rooms, setRooms] = useState(INITIAL_ROOMS)
  const [filter, setFilter] = useState('all')
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  const counts = useMemo(()=>{
    const c = {1:0,2:0,3:0,4:0,6:0,all: rooms.length}
    rooms.forEach(r => { if(c[r.status] !== undefined) c[r.status] += 1 })
    return c
  }, [rooms])

  const filtered = useMemo(()=> rooms.filter(r => filter==='all' ? true : r.status===filter), [rooms, filter])

  const groups = useMemo(()=>{
    const g = {}
    filtered.forEach(r => { if(!g[r.tipo]) g[r.tipo] = []; g[r.tipo].push(r) })
    return g
  }, [filtered])

  const updateStatus = (numero, value) => {
    const v = parseInt(value,10)
    setRooms(rs => rs.map(r => r.numero===numero ? {...r, status: v} : r))
  }

  const openDetails = (room) => { setSelectedRoom(room); setShowDetails(true) }

  const handleSaveRoom = (data) => { setRooms(rs => [...rs, data]) }
  const handleSaveCategory = (name, payload) => { alert(`Categoria "${name}" salva.`) }

  return (
    <div>
      <Header title="Quartos" onAddCategory={()=>setShowAddCategory(true)} onAddRoom={()=>setShowAddRoom(true)} />
      <div className="status">
        <StatusCard className="status--total" count={counts.all} label="TOTAL DE QUARTOS" onClick={()=>setFilter('all')} />
        <StatusCard className="status--disponivel" count={counts[2]} label="DISPONÍVEL" onClick={()=>setFilter(2)} />
        <StatusCard className="status--ocupado" count={counts[1]} label="OCUPADO" onClick={()=>setFilter(1)} />
        <StatusCard className="status--reservado" count={counts[3]} label="RESERVADO" onClick={()=>setFilter(3)} />
        <StatusCard className="status--limpeza" count={counts[4]} label="EM LIMPEZA" onClick={()=>setFilter(4)} />
        <StatusCard className="status--manutencao" count={counts[6]} label="MANUTENÇÃO" onClick={()=>setFilter(6)} />
      </div>

      <div id="categorias-container">
        {Object.entries(groups).map(([categoria, lista]) => (
          <div key={categoria}>
            <h2 className="section-title">{categoria}</h2>
            <div className="grid">
              {lista.map(q => (
                <button key={q.numero} className={`card ${statusClass(q.status)}`} onClick={()=>openDetails(q)}>
                  <h3 className="card__title">{q.numero}</h3>
                  <select className="select" onClick={e=>e.stopPropagation()} value={q.status} onChange={(e)=>updateStatus(q.numero, e.target.value)} aria-label={`Alterar status do ${q.numero}`}>
                    {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <div className="card-content">
                    {(q.status!==1 && q.status!==3) ? (<div className="info"><strong>Capacidade</strong>{q.pessoas} pessoa(s)</div>) : null}
                    {(q.status===1 || q.status===3) && (
                      <>
                        <div className="info"><strong>Hóspedes</strong><span>{q.representante || '-'}</span> <strong style={{width:'auto',marginLeft:8}}>Qtd</strong> {q.hospedes || q.pessoas}</div>
                        <div className="info"><strong>Entrada</strong>{q.entrada || '-'}</div>
                        <div className="info"><strong>Saída</strong>{q.saida || '-'}</div>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AddRoomModal open={showAddRoom} onClose={()=>setShowAddRoom(false)} categories={{SIMPLES:{},DUPLO:{},TRIPLO:{},LUXO:{},PRESIDENCIAL:{}}} onSave={handleSaveRoom} />
      <AddCategoryModal open={showAddCategory} onClose={()=>setShowAddCategory(false)} onSave={handleSaveCategory} />
      <RoomDetailsModal open={showDetails} onClose={()=>setShowDetails(false)} room={selectedRoom} />
    </div>
  )
}
