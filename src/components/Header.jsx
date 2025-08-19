import React from 'react'

export function Header({ title, onAddCategory, onAddRoom }){
  return (
    <header className="header" aria-label="Cabeçalho da página">
      <h1 className="header__title">{title}</h1>
      <div className="header__actions">
        {onAddCategory && <button type="button" className="header__btn" onClick={onAddCategory}>Adicionar Categoria</button>}
        {onAddRoom && <button type="button" className="header__btn" onClick={onAddRoom}>Adicionar Quarto</button>}
      </div>
    </header>
  )
}

export function StatusCard({ className, count, label, onClick }){
  return (
    <button type="button" className={`status-card ${className}`} onClick={onClick}>
      <div className="status-card__count">{count}</div>
      <div className="status-card__label">{label}</div>
    </button>
  )
}
