import React, { useMemo, useState } from 'react'
import { AddCategoryModal, AddRoomModal, RoomDetailsModal } from '../../components/Modals.jsx'
import { STATUS } from '../../data/status.js'
import { ROOMS as RAW_ROOMS } from '../../data/rooms.js'
import './ApartmentsPage.css'

/* ===================== Helpers ===================== */
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
function getStatusLabel(status) {
  switch(status) {
    case 1: return 'Ocupado'
    case 2: return 'Disponível'
    case 3: return 'Reservado'
    case 4: return 'Em Limpeza'
    case 5: return 'Diária Encerrada'
    case 6: return 'Manutenção'
    default: return 'Indefinido'
  }
}
function getStatusIcon(status) {
  switch(status) {
    case 1: return '👤'
    case 2: return '✓'
    case 3: return '📅'
    case 4: return '🧹'
    case 5: return '⏰'
    case 6: return '🔧'
    default: return '❓'
  }
}

function brToDate(s){
  if(!s) return null
  const [d,m,y] = s.split('/').map(Number)
  if(!d||!m||!y) return null
  return new Date(y, m-1, d, 0, 0, 0, 0)
}
function within(target,start,end){
  if(!target || !start || !end) return false
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return t >= a && t <= b
}
function statusByDate(room, date){
  if(!date) return room.status
  const inOcc =
    room.entrada && room.saida &&
    within(date, brToDate(room.entrada), brToDate(room.saida))
  if(inOcc) return 1
  const hasReserva =
    room.reservaInicio && room.reservaFim &&
    within(date, brToDate(room.reservaInicio), brToDate(room.reservaFim))
  if(hasReserva) return 3
  return room.status
}
function initialsFromName(name){
  if(!name) return '??'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const second = parts[1]?.[0] || (parts.length>1 ? parts[parts.length-1]?.[0] : '')
  return (first + second).toUpperCase()
}
function formatBeds(room){
  const b = room?.beds || mockBedsByCapacity(room?.pessoas)
  const map = { casal: 'cama casal', solteiro: 'cama solteiro', rede: 'rede', beliche: 'beliche' }
  const chunks = []
  Object.entries(map).forEach(([key,label])=>{
    const qtd = Number(b[key] || 0)
    if(qtd>0) chunks.push(`${qtd} ${label}${qtd>1 ? 's' : ''}`)
  })
  return chunks.length ? chunks.join(', ') : 'disposição não informada'
}
function mockBedsByCapacity(cap=1){
  if(cap <= 1) return { solteiro: 1 }
  if(cap === 2) return { casal: 1 }
  if(cap === 3) return { casal: 1, solteiro: 1 }
  if(cap === 4) return { casal: 1, solteiro: 2 }
  return { beliche: Math.ceil(cap/2) }
}
function allowedTransitions(current){
  if([1,3,5].includes(current)) return []
  if(current===2) return [4,6]
  if([4,6].includes(current)) return [2]
  return []
}

export function ApartmentsPage(){
  const [rooms, setRooms] = useState(() => {
    let arr = Array.isArray(RAW_ROOMS) ? [...RAW_ROOMS] : []
    const hasDiaria = arr.some(r => r.status === 5)
    if(!hasDiaria){
      arr.push({
        numero: 904, tipo: 'SIMPLES', status: 5, pessoas: 2,
        representante: 'Convidado Demo', cpf: '000.000.000-00', telefone: '(99) 99999-9999',
        entrada: '21/07/2025', saida: '21/07/2025', horaEntrada: '08:00', horaSaida: '18:00'
      })
    }
    arr = arr.map(r => (r.status===2 && !r.beds) ? {...r, beds: mockBedsByCapacity(r.pessoas)} : r)
    return arr
  })

  const [filter, setFilter] = useState('all')
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusDate, setStatusDate] = useState('')

  const dateView = useMemo(()=>{
    if(!statusDate) return null
    const [y,m,d] = statusDate.split('-').map(Number)
    return new Date(y, m-1, d)
  }, [statusDate])

  const counts = useMemo(()=>{
    const c = {1:0,2:0,3:0,4:0,5:0,6:0,all: rooms.length}
    rooms.forEach(r => {
      const s = statusByDate(r, dateView)
      if(c[s] !== undefined) c[s] += 1
    })
    return c
  }, [rooms, dateView])

  const filtered = useMemo(() => {
    let result = rooms.slice()
    if (filter !== 'all') result = result.filter(r => statusByDate(r, dateView) === filter)

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase()
      const numeric = searchTerm.replace(/\D/g,'')
      result = result.filter(r => {
        const numero = String(r.numero || '').toLowerCase()
        const nome = String(r.representante || r.reservaNome || '').toLowerCase()
        const cpf = String(r.cpf || r.reservaCpf || '').replace(/\D/g,'')
        return numero.includes(termLower)
          || nome.includes(termLower)
          || (numeric && cpf.includes(numeric))
      })
    }
    return result
  }, [rooms, filter, searchTerm, dateView])

  const groups = useMemo(()=>{
    const g = {}
    filtered.forEach(r => { if(!g[r.tipo]) g[r.tipo] = []; g[r.tipo].push(r) })
    return g
  }, [filtered])

  const openDetails = (room) => { setSelectedRoom(room); setShowDetails(true) }
  const updateStatus = (numero, next) => {
    const v = parseInt(next,10)
    setRooms(rs => rs.map(r => r.numero===numero ? {...r, status: v} : r))
  }
  const handleSaveRoom = (data) => { setRooms(rs => [...rs, data]) }
  const handleSaveCategory = (name) => { alert(`Categoria "${name}" salva.`) }

  const FILTERS = [
    { key: 'all', label: 'Todos', count: counts.all, color: 'blue', icon: '🏠' },
    { key: 2, label: 'Disponíveis', count: counts[2], color: 'green', icon: '✓' },
    { key: 1, label: 'Ocupados', count: counts[1], color: 'red', icon: '👤' },
    { key: 3, label: 'Reservados', count: counts[3], color: 'orange', icon: '📅' },
    { key: 5, label: 'Diária Encerrada', count: counts[5], color: 'purple', icon: '⏰' },
    { key: 4, label: 'Em limpeza', count: counts[4], color: 'yellow', icon: '🧹' },
    { key: 6, label: 'Manutenção', count: counts[6], color: 'gray', icon: '🔧' },
  ]

  return (
    <div className="apartments-page">
      <div className="apartments-header">
        <h1 className="apartments-title">Quartos</h1>
        <div className="header-actions">
          <button className="add-button" onClick={() => setShowAddRoom(true)}>
            <span className="add-icon">+</span> Adicionar Quarto
          </button>
          <button className="add-button secondary" onClick={() => setShowAddCategory(true)}>
            <span className="add-icon">+</span> Categoria
          </button>
        </div>
      </div>

      <div className="apartments-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por número, nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Buscar por número, nome ou CPF"
            />
          </div>
        </div>

        <div className="date-filter">
          <label htmlFor="statusDate">Status na data:</label>
          <input
            id="statusDate"
            type="date"
            className="date-input"
            value={statusDate}
            onChange={(e)=> setStatusDate(e.target.value)}
          />
          {statusDate && (
            <button className="clear-date-btn" onClick={()=>setStatusDate('')}>
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button
            key={String(f.key)}
            className={`filter-tab ${String(filter) === String(f.key) ? 'active' : ''} ${f.color}`}
            onClick={() => setFilter(f.key === 'all' ? 'all' : Number(f.key))}
          >
            <span className="filter-icon">{f.icon}</span>
            {f.label}
            <span className="filter-count">{f.count}</span>
          </button>
        ))}
      </div>

      <div className="apartments-content">
        {Object.keys(groups).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <p>Nenhum quarto encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          Object.entries(groups).map(([categoria, lista]) => (
            <div key={categoria} className="category-section">
              <h2 className="category-title">{categoria}</h2>
              <div className="rooms-grid">
                {lista.map(room => {
                  const displayStatus = statusByDate(room, dateView)
                  const colorClass = statusClass(displayStatus)
                  const transitions = allowedTransitions(displayStatus)
                  const disabledSelect = (transitions.length===0) || !!dateView
                  const icon = getStatusIcon(displayStatus)

                  const name = room.representante || room.reservaNome
                  const cpf = room.cpf || room.reservaCpf
                  const telefone = room.telefone || room.reservaTelefone
                  const hospedes = (room.hospedes ?? room.reservaHospedes ?? room.pessoas) || 1

                  const checkinDate = room.entrada || room.reservaInicio
                  const checkoutDate = room.saida || room.reservaFim
                  const checkinTime = room.horaEntrada || room.horaReservaEntrada || '--:--'
                  const checkoutTime = room.horaSaida || room.horaReservaSaida || '--:--'

                  return (
                    <div key={room.numero} className={`room-card ${colorClass}`}>
                      <div className="room-card-header-colored">
                        <div className="header-content">
                          <div className="room-info-header">
                            <span className="room-icon">{icon}</span>
                            <div className="room-title-section">
                              <h3 className="room-title">Quarto {room.numero}</h3>
                              <div className="status-below">
                                <div className="status-dropdown-container">
                                  <select
                                    className="status-dropdown-header"
                                    value={room.status}
                                    onChange={(e) => updateStatus(room.numero, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={`Alterar status do quarto ${room.numero}`}
                                    disabled={disabledSelect}
                                  >
                                    <option value={room.status}>{getStatusLabel(room.status)}</option>
                                    {transitions
                                      .filter(v => v !== room.status)
                                      .map(v => (
                                        <option key={v} value={v}>
                                          {STATUS[String(v)] || getStatusLabel(v)}
                                        </option>
                                      ))}
                                  </select>
                                  <div className="dropdown-arrow-header">▼</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="room-card-body">
                        {[1,3,5].includes(displayStatus) && (
                          <>
                            <div className="guests-section">
                              {name && (
                                <div className="guest-item">
                                  <div className="guest-avatar-initials">
                                    {initialsFromName(name)}
                                  </div>
                                  <div className="guest-details">
                                    <span className="guest-name">{name}</span>
                                    <div className="guest-info">
                                      <span><b>CPF:</b> {cpf || '—'}</span>
                                      <span><b>Telefone:</b> {telefone || '—'}</span>
                                      <span><b>Acompanhantes:</b> {Math.max(hospedes - 1, 0)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="dates-info">
                              {checkinDate && (
                                <div className="date-row">
                                  <span className="date-label">Check-in</span>
                                  <span className="date-value">
                                    {checkinDate} <span className="time">{checkinTime}</span>
                                  </span>
                                </div>
                              )}
                              {checkoutDate && (
                                <div className="date-row">
                                  <span className="date-label">Check-out</span>
                                  <span className="date-value">
                                    {checkoutDate} <span className="time">{checkoutTime}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {displayStatus === 2 && (
                          <div className="capacity-section">
                            <div className="capacity-info">
                              <div className="capacity-item">
                                <span className="capacity-label">Capacidade</span>
                                <span className="capacity-value">{room.pessoas} pessoa(s)</span>
                              </div>
                              <div className="bed-configuration">
                                <span className="bed-icon">🛏️</span>
                                <span className="bed-text">{formatBeds(room)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {[4,6].includes(displayStatus) && (
                          <div className="maintenance-section">
                            <div className="status-info">
                              <div className="status-message">
                                {displayStatus===4
                                  ? 'Quarto em processo de limpeza. Pode ser liberado para "Disponível" quando finalizar.'
                                  : 'Quarto em manutenção. Libere para "Disponível" quando concluir.'
                                }
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="room-card-footer">
                        <button className="details-btn" onClick={() => openDetails(room)}>
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <AddRoomModal
        open={showAddRoom}
        onClose={() => setShowAddRoom(false)}
        categories={{SIMPLES:{}, DUPLO:{}, TRIPLO:{}, LUXO:{}, PRESIDENCIAL:{}}}
        onSave={handleSaveRoom}
      />
      <AddCategoryModal
        open={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSave={handleSaveCategory}
      />
      <RoomDetailsModal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        room={selectedRoom}
      />
    </div>
  )
}