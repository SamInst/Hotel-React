// src/pages/FinancePage.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  useFinanceOperations,
  converterParaApi,
  converterDaApi,
} from "../config/financeApi.js";
import { Toasts, LoadingOverlay } from "../config/uiUtilities.jsx";
import DateRangePicker from "../components/DateRangePicker.jsx";
import "./FinancePage.css";

/* Helpers */
const money = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const dLabel = (iso) => new Date(iso).toLocaleDateString("pt-BR");
const nowDate = () => new Date().toISOString().slice(0, 10);

// máscara de moeda com suporte a negativo
function formatMoneyInput(value) {
  const isNegative = value.trim().startsWith("-");
  const onlyNums = value.replace(/\D/g, "");
  if (!onlyNums) return isNegative ? "-" : "";
  const num = (parseInt(onlyNums, 10) / 100).toFixed(2);
  let formatted = num.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return isNegative ? "-" + formatted : formatted;
}

function parseMoney(value) {
  if (!value) return 0;
  return Number(value.replace(/\./g, "").replace(",", "."));
}

// Função para determinar classe CSS do input de valor
function getValueInputClass(valor, tipoPagamentoId, tiposPagamento) {
  if (!valor) return "neutral";
  
  const numericValue = parseMoney(valor);
  const tipoPagamento = tiposPagamento.find(t => t.id === tipoPagamentoId);
  const isDinheiro = tipoPagamento?.descricao?.toLowerCase().includes("dinheiro");
  
  if (numericValue < 0) return "negative"; // Vermelho para valores negativos (sempre)
  if (isDinheiro) return "positive"; // Verde para dinheiro positivo
  return "alt-payment"; // Azul para outros tipos positivos
}

// Função para determinar cor baseada no tipo de pagamento e valor
function getAmountColor(payment, amount) {
  if (amount < 0) return "negative"; // Vermelho para retiradas
  if (payment && payment.toLowerCase().includes("dinheiro")) return "positive"; // Verde para dinheiro
  return "alt-payment"; // Azul para outros tipos
}

/* ------------------ Modal de Detalhes ------------------ */
function ReportDetailsModal({ open, onClose, item, onSave, onDelete, tiposPagamento, quartos }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        payment: item.payment,
        apt: item.apt || "", // Manter como ID do quarto
        valor: formatMoneyInput(String(item.amount)),
        tipo_pagamento_enum: tiposPagamento.find(t => t.descricao === item.payment)?.id || tiposPagamento[0]?.id
      });
      setEditing(false);
    }
  }, [item, tiposPagamento]);

  useEffect(() => {
    if (!open) setEditing(false);
  }, [open]);

  if (!open || !item) return null;

  const handleSave = async () => {
    if (!form) return;
    const valor = parseMoney(form.valor);
    
    try {
      const dadosApi = converterParaApi({
        relatorio: form.title,
        tipo_pagamento_enum: form.tipo_pagamento_enum,
        valor: valor,
        quarto_id: form.apt || null
      });
      
      await onSave(item.id, dadosApi);
      setEditing(false);
      onClose();
    } catch (err) {
      console.error("Erro ao salvar:", err);
    }
  };

  const handleDelete = async () => {
    if (confirm('Deseja excluir este lançamento?')) {
      await onDelete(item.id);
      onClose();
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({
      title: item.title,
      payment: item.payment,
      apt: item.apt || "",
      valor: formatMoneyInput(String(item.amount)),
      tipo_pagamento_enum: tiposPagamento.find(t => t.descricao === item.payment)?.id || tiposPagamento[0]?.id
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modern-modal-header">
          <h3>Detalhes do Lançamento</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        <div className="modern-modal-body">
          <div className="details-grid">
            <div className="detail-item">
              <label>Data</label>
              <span>{dLabel(item.date)}</span>
            </div>
            <div className="detail-item">
              <label>Hora</label>
              <span>{item.time}</span>
            </div>

            <div className="detail-item full-width">
              <label>Descrição</label>
              {editing ? (
                <input
                  className="form-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value.toUpperCase() })}
                />
              ) : (
                <span>{item.title}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Tipo de Pagamento</label>
              {editing ? (
                <select
                  className="form-select"
                  value={form.tipo_pagamento_enum}
                  onChange={(e) => setForm({ ...form, tipo_pagamento_enum: Number(e.target.value) })}
                >
                  {tiposPagamento.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.descricao}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{item.payment}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Quarto</label>
              {editing ? (
                <select
                  className="form-select"
                  value={form.apt}
                  onChange={(e) => setForm({ ...form, apt: e.target.value })}
                >
                  <option value="">— Nenhum —</option>
                  {quartos.map((quarto) => (
                    <option key={quarto.id} value={quarto.id}>
                      Quarto {String(quarto.id).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{item.apt ? `Quarto ${String(item.apt).padStart(2, "0")}` : "—"}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Valor</label>
              {editing ? (
                <div className={`value-input-wrapper ${getValueInputClass(form.valor, form.tipo_pagamento_enum, tiposPagamento)}`}>
                  <span className="input-prefix">R$</span>
                  <input
                    type="text"
                    className="form-input with-prefix value-input"
                    value={form.valor}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        valor: formatMoneyInput(e.target.value),
                      })
                    }
                    placeholder="0,00 (use - para despesas)"
                  />
                </div>
              ) : (
                <span className={`amount ${getAmountColor(item.payment, item.amount)}`}>
                  {money(item.amount)}
                </span>
              )}
            </div>

            <div className="detail-item full-width">
              <label>ID</label>
              <span>#{item.id}</span>
            </div>
          </div>
        </div>
        <div className="modern-modal-footer">
          <div style={{ display: "flex", gap: "12px", marginLeft: "auto" }}>
            {editing ? (
              <>
                <button className="button secondary" onClick={handleCancel}>
                  Cancelar
                </button>
                <button className="button primary" onClick={handleSave}>
                  Salvar
                </button>
              </>
            ) : (
              <>
                <button className="button secondary" onClick={handleDelete} style={{ marginRight: "auto" }}>
                  Excluir
                </button>
                <button className="button primary" onClick={() => setEditing(true)}>
                  Editar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ Página Principal ------------------ */
export default function FinancePage() {
  const financeOps = useFinanceOperations();

  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    relatorio: "",
    tipo_pagamento_enum: null,
    valor: "",
    quarto_id: "",
    fk_funcionario: 1,
  });

  const [tiposPagamento, setTiposPagamento] = useState([]);
  const [quartos, setQuartos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);

  const [fStart, setFStart] = useState("");
  const [fEnd, setFEnd] = useState("");
  const [payFilter, setPayFilter] = useState("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  // Carregar referências apenas uma vez
  useEffect(() => {
    carregarReferencias();
  }, []);

  const carregarReferencias = async () => {
    try {
      const { tiposResp, quartosResp, funcionariosResp } = await financeOps.carregarReferencias();

      setTiposPagamento(tiposResp);
      setQuartos(quartosResp);
      setFuncionarios(funcionariosResp);

      if (tiposResp.length > 0) {
        setForm(prev => ({ ...prev, tipo_pagamento_enum: tiposResp[0].id }));
      }
    } catch (err) {
      console.error("Erro ao carregar referências:", err);
    }
  };

  // Carregar relatórios quando filtros mudarem
  const carregarRelatorios = useCallback(async () => {
    try {
      const filtros = {};
      if (fStart) filtros.dataInicio = fStart;
      if (fEnd) filtros.dataFim = fEnd;
      if (payFilter !== "all" && tiposPagamento.length > 0) {
        const tipo = tiposPagamento.find(t => 
          t.descricao.toUpperCase().includes(payFilter.toUpperCase())
        );
        if (tipo) filtros.tipoPagamentoId = tipo.id;
      }

      const response = await financeOps.carregarRelatorios(filtros);
      const itemsConvertidos = response.map(converterDaApi);
      setItems(itemsConvertidos);
    } catch (err) {
      console.error("Erro ao carregar relatórios:", err);
    }
  }, [fStart, fEnd, payFilter, tiposPagamento]); // Removido financeOps das dependências

  useEffect(() => {
    if (tiposPagamento.length > 0 || payFilter === "all") {
      carregarRelatorios();
    }
  }, [fStart, fEnd, payFilter, tiposPagamento]); // Dependências diretas ao invés da função

  const save = async () => {
    const valor = parseMoney(form.valor);
    if (!form.relatorio || Number.isNaN(valor)) {
      financeOps.notifyError("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const dadosApi = converterParaApi({
        ...form,
        valor: valor,
      });

      const novoRelatorio = await financeOps.criarRelatorio(dadosApi);
      const itemConvertido = converterDaApi(novoRelatorio);
      
      setItems(prev => [itemConvertido, ...prev]);
      setOpen(false);
      setForm({
        relatorio: "",
        tipo_pagamento_enum: tiposPagamento[0]?.id || null,
        valor: "",
        quarto_id: "",
        fk_funcionario: 1,
      });
    } catch (err) {
      console.error("Erro ao salvar:", err);
    }
  };

  const updateRelatorio = async (id, dados) => {
    try {
      await financeOps.atualizarRelatorio(id, dados);
      await carregarRelatorios(); // Recarregar para ter dados atualizados
    } catch (err) {
      console.error("Erro ao atualizar:", err);
    }
  };

  const excluirRelatorio = async (id) => {
    try {
      await financeOps.excluirRelatorio(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  const openDetails = (it) => {
    setSelected(it);
    setDetailsOpen(true);
  };

  const filtered = useMemo(() => {
    let arr = items;
    if (fStart) arr = arr.filter((i) => i.date >= fStart);
    if (fEnd) arr = arr.filter((i) => i.date <= fEnd);
    if (payFilter !== "all") {
      const key = payFilter.toUpperCase();
      arr = arr.filter((i) => (i.payment || "").toUpperCase().includes(key));
    }
    return arr;
  }, [items, fStart, fEnd, payFilter]);

  const balance = useMemo(
    () => filtered.reduce((s, i) => s + i.amount, 0),
    [filtered]
  );

  // Cálculo do saldo somente em dinheiro para datas filtradas
  const cashBalance = useMemo(() => {
    return filtered
      .filter(item => item.payment && item.payment.toLowerCase().includes("dinheiro"))
      .reduce((s, i) => s + i.amount, 0);
  }, [filtered]);

  // Cálculo das despesas (valores negativos) para datas filtradas
  const expensesBalance = useMemo(() => {
    return filtered
      .filter(item => item.amount < 0)
      .reduce((s, i) => s + i.amount, 0);
  }, [filtered]);

  const { filteredByType, filters } = useMemo(() => {
    const filterConfig = {
      all: { label: "Todos", count: 0, color: "gray" },
      income: { label: "Receitas", count: 0, color: "green" },
      expense: { label: "Despesas", count: 0, color: "red" },
      today: { label: "Hoje", count: 0, color: "blue" },
    };

    const counts = { ...filterConfig };
    const today = nowDate();
    
    filtered.forEach((item) => {
      counts.all.count++;
      if (item.amount >= 0) counts.income.count++;
      else counts.expense.count++;
      if (item.date === today) counts.today.count++;
    });

    let filteredArray = filtered;
    if (activeFilter === "income") {
      filteredArray = filtered.filter(i => i.amount >= 0);
    } else if (activeFilter === "expense") {
      filteredArray = filtered.filter(i => i.amount < 0);
    } else if (activeFilter === "today") {
      filteredArray = filtered.filter(i => i.date === today);
    }

    return { filteredByType: filteredArray, filters: counts };
  }, [filtered, activeFilter]);

  const groups = useMemo(() => {
    const by = {};
    for (const r of filteredByType) {
      if (!by[r.date]) by[r.date] = [];
      by[r.date].push(r);
    }
    return Object.entries(by)
      .map(([date, rows]) => {
        // Manter a ordem original do backend (por ID desc) ao invés de ordenar por tempo
        const total = rows.reduce((s, i) => s + i.amount, 0);
        return { date, rows, total };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredByType]);

  const availableRooms = useMemo(() => {
    const options = [{ value: "", label: "— Nenhum —" }];
    
    // Usar os quartos da API e formatá-los corretamente
    quartos.forEach(quarto => {
      if (quarto.id) {
        options.push({
          value: String(quarto.id),
          label: `Quarto ${String(quarto.id).padStart(2, "0")}`,
        });
      }
    });

    // Ordenar por número do quarto
    options.sort((a, b) => {
      if (a.value === "") return -1; // "Nenhum" sempre primeiro
      if (b.value === "") return 1;
      return Number(a.value) - Number(b.value);
    });

    return options;
  }, [quartos]);

  const statusOptions = useMemo(() => {
    const options = [{ value: "all", label: "Todos" }];
    tiposPagamento.forEach(tipo => {
      const key = tipo.descricao.toUpperCase().includes("DINHEIRO") ? "DINHEIRO" :
                  tipo.descricao.toUpperCase().includes("PIX") ? "PIX" :
                  tipo.descricao.toUpperCase().includes("CRÉDITO") ? "CRÉDITO" :
                  tipo.descricao.toUpperCase().includes("DÉBITO") ? "DÉBITO" :
                  tipo.descricao.toUpperCase().includes("TRANSFERÊNCIA") ? "TRANSFER" :
                  tipo.descricao.toLowerCase();
      
      if (!options.find(opt => opt.value === key)) {
        options.push({ value: key, label: tipo.descricao });
      }
    });
    return options;
  }, [tiposPagamento]);

  const handleDateRangeChange = (startDate, endDate) => {
    setFStart(startDate);
    setFEnd(endDate);
  };

  return (
    <div className="finance-page">
      <Toasts toasts={financeOps.toasts} onClose={financeOps.closeToast} />
      <LoadingOverlay show={financeOps.loading} label={financeOps.loadingMessage} />

      {/* Header */}
      <div className="finance-header">
        <h1 className="finance-title">Relatório Financeiro</h1>
        <div className="finance-actions">
          <div className="balance-card" style={{ width: "300px" }}>
            <span className="balance-label">Saldo Total</span>
            <span className={`balance-value ${balance >= 0 ? "positive" : "negative"}`}>
              {money(balance)}
            </span>
            <div className="cash-balance">
              <span className="cash-label">Dinheiro:</span>
              <span className={`cash-value ${cashBalance >= 0 ? "positive" : "negative"}`}>
                {cashBalance >= 0 ? "↑ " : "↓ "}{money(cashBalance)}
              </span>
            </div>
            <div className="expenses-balance">
              <span className="expenses-label">Despesas:</span>
              <span className={`expenses-value ${expensesBalance >= 0 ? "positive" : "negative"}`}>
                ↓ {money(Math.abs(expensesBalance))}
              </span>
            </div>
          </div>
          <button
            className="add-button"
            style={{ width: "300px" }}
            onClick={() => setOpen(true)}
            disabled={financeOps.loading}
          >
            <span className="add-icon">+</span>
            Adicionar Lançamento
          </button>
        </div>
      </div>

      <div className="filter-tabs">
        {Object.entries(filters).map(([key, config]) => (
          <button
            key={key}
            className={`filter-tab ${activeFilter === key ? "active" : ""} ${config.color}`}
            onClick={() => setActiveFilter(key)}
          >
            {config.label}
            <span className="filter-count">{config.count}</span>
          </button>
        ))}
      </div>

      {/* Controles de Filtro */}
      <div className="finance-controls">
        <div className="filter-group">
          <label>Período:</label>
          <DateRangePicker
            startDate={fStart}
            endDate={fEnd}
            onDateChange={handleDateRangeChange}
            placeholder="Selecionar datas"
            disabled={financeOps.loading}
          />
        </div>
        <div className="filter-group">
          <label>Tipo de Pagamento:</label>
          <select 
            value={payFilter} 
            onChange={(e) => setPayFilter(e.target.value)}
            disabled={financeOps.loading}
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => { 
            setFStart(""); 
            setFEnd(""); 
            setPayFilter("all"); 
            setActiveFilter("all");
          }}
          disabled={financeOps.loading}
        >
          Limpar Filtros
        </button>
      </div>

      {/* Conteúdo */}
      <div className="finance-content">
        {groups.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum lançamento encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.date} className="finance-day-card">
              <div className="day-header">
                <div className="day-info">
                  <h3 className="day-date">{dLabel(g.date)}</h3>
                  <span className="day-count">{g.rows.length} lançamento(s)</span>
                </div>
                <div className={`day-total ${g.total >= 0 ? "positive" : "negative"}`}>
                  {g.total >= 0 ? "+ " : ""}{money(g.total)}
                </div>
              </div>
              <div className="transactions-list">
                {g.rows.map((item) => (
                  <div
                    key={item.id}
                    className="transaction-card"
                    onClick={() => openDetails(item)}
                  >
                    <div className="transaction-room">
                      <span className="room-badge">{item.apt ?? "—"}</span>
                    </div>
                    <div className="transaction-info">
                      <h4 className="transaction-title">{item.title}</h4>
                      <p className="transaction-details">
                        {item.time} • {item.payment} • #{item.id}
                        {item.funcionario && ` • ${item.funcionario}`}
                      </p>
                    </div>
                    <div className="transaction-amount">
                      <div className={`amount-badge ${getAmountColor(item.payment, item.amount)}`}>
                        {item.amount >= 0 ? "↑ " : "↓ "}
                        {item.amount >= 0 ? "+ " : ""}
                        {money(item.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Novo Lançamento */}
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modern-modal-header">
              <h3>Novo Lançamento</h3>
              <button className="close-button" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="modern-modal-body">
              <div className="form-grid">
                <div className="field col-12">
                  <label>Descrição *</label>
                  <input
                    className="form-input"
                    value={form.relatorio}
                    onChange={(e) => setForm(f => ({ ...f, relatorio: e.target.value.toUpperCase() }))}
                    placeholder="DESCRIÇÃO DO LANÇAMENTO"
                    disabled={financeOps.loading}
                  />
                </div>
                
                <div className="field col-8">
                  <label>Valor *</label>
                  <div className={`value-input-wrapper ${getValueInputClass(form.valor, form.tipo_pagamento_enum, tiposPagamento)}`}>
                    <span className="input-prefix">R$</span>
                    <input
                      className="form-input with-prefix value-input"
                      type="text"
                      value={form.valor}
                      onChange={(e) => setForm(f => ({ ...f, valor: formatMoneyInput(e.target.value) }))}
                      placeholder="0,00 (use - para despesas)"
                      disabled={financeOps.loading}
                    />
                  </div>
                </div>
                
                <div className="field col-4">
                  <label>Quarto</label>
                  <select
                    className="form-select"
                    value={form.quarto_id}
                    onChange={(e) => setForm(f => ({ ...f, quarto_id: e.target.value }))}
                    disabled={financeOps.loading}
                  >
                    {availableRooms.map((room) => (
                      <option key={room.value} value={room.value}>
                        {room.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field col-12">
                  <label>Tipo de Pagamento *</label>
                  <select
                    className="form-select"
                    value={form.tipo_pagamento_enum || ""}
                    onChange={(e) => setForm(f => ({ ...f, tipo_pagamento_enum: Number(e.target.value) }))}
                    disabled={financeOps.loading}
                  >
                    <option value="">Selecione...</option>
                    {tiposPagamento.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.descricao}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field col-12">
                  <label>Funcionário</label>
                  <select
                    className="form-select"
                    value={form.fk_funcionario}
                    onChange={(e) => setForm(f => ({ ...f, fk_funcionario: Number(e.target.value) }))}
                    disabled={financeOps.loading}
                  >
                    {funcionarios.map((func) => (
                      <option key={func.id} value={func.id}>
                        {func.nomeCompleto}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modern-modal-footer">
              <div style={{ display: "flex", gap: "12px", marginLeft: "auto" }}>
                <button 
                  className="button secondary" 
                  onClick={() => setOpen(false)} 
                  disabled={financeOps.loading}
                >
                  Cancelar
                </button>
                <button 
                  className="button primary" 
                  onClick={save} 
                  disabled={financeOps.loading}
                >
                  {financeOps.loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReportDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        item={selected}
        onSave={updateRelatorio}
        onDelete={excluirRelatorio}
        tiposPagamento={tiposPagamento}
        quartos={quartos}
      />
    </div>
  );
}