// src/pages/ReservationsPage.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { Modal } from "../components/Modal.jsx";
import ModernDashboard from "./ModernDashboard";
import ReservationEditorModal from "../components/ReservationEditorModal.jsx";
import NewReservationModal from "../components/NewReservationModal.jsx";

const LABEL_W = 80;
const DAY_W = 120;
const ROW_H = 56;
const CAT_H = 36;
const BAR_H = 38;
const BAR_GAP = 6;

// cabeçalho
const MONTH_BAND_H = 40;

// viewport do calendário (rolável), fixa e responsiva
const VIEW_W = "clamp(980px, 92vw, 1775px)";
const VIEW_H = "clamp(620px, 70vh, 820px)";

// espaçamentos mais enxutos
const BLOCK_GAP = 0;

// Zona de handle para redimensionamento (px)
const RESIZE_HANDLE_WIDTH = 8;

const wk = (d) => d.toLocaleDateString("pt-BR", { weekday: "long" });
const mon = (d) => d.toLocaleDateString("pt-BR", { month: "long" });
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const diffDays = (a, b) => Math.round((b - a) / 86400000);

export default function ReservationsPage() {
  const today = new Date();
  const todayKey = ymd(today);

  // EDITOR SEPARADO
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState(null);

  const [newReservationOpen, setNewReservationOpen] = useState(false);

  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState(today);

  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);

  const [openReview, setOpenReview] = useState(false);
  const [hoverResv, setHoverResv] = useState(null);

  // apenas a célula sob o mouse (quarto x dia)
  const [hoverCell, setHoverCell] = useState({ roomId: null, dayIndex: null });

  // Estados para drag & drop
  const [dragState, setDragState] = useState({
    isDragging: false,
    isResizing: false,
    resizeType: null, // 'start' ou 'end'
    reservationId: null,
    initialMouseX: 0,
    initialRoomId: 0,
    initialStart: null,
    initialEnd: null,
    currentRoomId: 0,
    currentStart: null,
    currentEnd: null,
  });

  // Modal de confirmação
  const [confirmAction, setConfirmAction] = useState({
    open: false,
    type: null, // 'move', 'resize'
    reservation: null,
    newRoomId: null,
    newStart: null,
    newEnd: null,
  });

  // scrollers
  const scrollerRef = useRef(null); // corpo (vertical + horizontal)
  const headXRef = useRef(null); // cabeçalho (apenas horizontal)

  // colunas visíveis (primeira/última) para centralizar a etiqueta do mês
  const [visibleCols, setVisibleCols] = useState({ first: 0, last: 30 });

  const categories = useMemo(
    () => [
      { name: "SIMPLES", from: 1, to: 5 },
      { name: "COMPLETO", from: 6, to: 10 },
      { name: "DELUXE", from: 11, to: 15 },
      { name: "MASTER", from: 16, to: 22 },
    ],
    []
  );

  const rooms = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i + 1,
        name: String(i + 1).padStart(2, "0"),
      })),
    []
  );

  // Agora como useState (para refletir edições do editor)
  const [reservations, setReservations] = useState([
    {
      id: 101,
      roomId: 1,
      start: "2025-08-21",
      end: "2025-08-27",
      title: "CASA E CAFE ASSESSORIA PROFISSIONAL LTDA",
    },
    {
      id: 106,
      roomId: 2,
      start: "2025-08-25",
      end: "2025-08-28",
      title: "CASA E CAFE ASSEORIA PROFISSIONAL LTDA",
    },
    {
      id: 102,
      roomId: 1,
      start: "2025-08-27",
      end: "2025-08-29",
      title: "PESSOA CHATA QUE NAO QUER PAGAR",
    },
    {
      id: 103,
      roomId: 2,
      start: "2025-08-21",
      end: "2025-08-23",
      title: "CASA E CAFE ASSESSORIA PROFISSIONAL LTDA",
    },
    {
      id: 104,
      roomId: 4,
      start: "2025-08-24",
      end: "2025-08-28",
      title: "EMPRESA DEMO",
    },
    {
      id: 105,
      roomId: 7,
      start: "2025-08-26",
      end: "2025-08-28",
      title: "EMPRESA DEMAO",
    },
    {
      id: 107,
      roomId: 1,
      start: "2025-08-29",
      end: "2025-09-02",
      title: "EMPRESA DEMAO",
    },
  ]);

  // janela fixa de 31 dias
  const isCurrentMonth =
    viewDate.getFullYear() === today.getFullYear() &&
    viewDate.getMonth() === today.getMonth();
  const windowStart = isCurrentMonth
    ? new Date(today.getFullYear(), today.getMonth(), today.getDate())
    : new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);

  const days = useMemo(
    () => Array.from({ length: 31 }, (_, i) => addDays(windowStart, i)),
    [windowStart]
  );
  const dayKeys = useMemo(() => days.map(ymd), [days]);

  // segmentos de meses dentro da janela
  const monthSegments = useMemo(() => {
    const segs = [];
    let start = 0;
    for (let i = 1; i <= days.length; i++) {
      const changed =
        i === days.length || days[i].getMonth() !== days[i - 1].getMonth();
      if (changed) {
        const end = i - 1;
        const label = days[start].toLocaleDateString("pt-BR", {
          month: "long",
        });
        segs.push({ start, end, label });
        start = i;
      }
    }
    return segs;
  }, [days]);

  // bandas visíveis (para centralizar a etiqueta no que está em tela)
  const visibleMonthBands = useMemo(() => {
    const bands = [];
    for (const seg of monthSegments) {
      const s = Math.max(seg.start, visibleCols.first);
      const e = Math.min(seg.end, visibleCols.last);
      if (s <= e) bands.push({ start: s, end: e, label: seg.label });
    }
    return bands;
  }, [monthSegments, visibleCols]);

  // divisores no virar de mês
  const monthBreaks = useMemo(() => {
    const arr = [];
    for (let i = 1; i < days.length; i++) {
      if (days[i].getMonth() !== days[i - 1].getMonth()) {
        const label = `${mon(days[i])} ${days[i].getFullYear()}`;
        arr.push({ index: i, label });
      }
    }
    return arr;
  }, [days]);

  const monthInputValue = `${viewDate.getFullYear()}-${pad(
    viewDate.getMonth() + 1
  )}`;
  const prevDisabled =
    viewDate.getFullYear() < today.getFullYear() ||
    (viewDate.getFullYear() === today.getFullYear() &&
      viewDate.getMonth() <= today.getMonth());

  const visualRows = useMemo(() => {
    const rows = [];
    categories.forEach((cat) => {
      rows.push({ type: "category", name: cat.name });
      rooms
        .filter((r) => r.id >= cat.from && r.id <= cat.to)
        .forEach((room) => rows.push({ type: "room", room }));
    });
    return rows;
  }, [categories, rooms]);

  const { roomTopMap, contentHeight } = useMemo(() => {
    let y = 0;
    const map = {};
    visualRows.forEach((vr) => {
      if (vr.type === "category") {
        y += CAT_H;
      } else {
        map[vr.room.id] = y + (ROW_H - BAR_H) / 2;
        y += ROW_H;
      }
    });
    return { roomTopMap: map, contentHeight: y };
  }, [visualRows]);

  const totalGridWidth = LABEL_W + days.length * DAY_W;

  const hoverDayIdx = hoverCell.dayIndex;
  const hoverRoomId = hoverCell.roomId;

  // Funções auxiliares para drag & drop
  const getRoomIdFromY = (y) => {
    let currentY = 0;
    for (const row of visualRows) {
      if (row.type === "category") {
        currentY += CAT_H;
      } else {
        const rowBottom = currentY + ROW_H;
        if (y >= currentY && y < rowBottom) {
          return row.room.id;
        }
        currentY += ROW_H;
      }
    }
    return null;
  };

  const getDayIndexFromX = (x) => {
    const dayX = x - LABEL_W;
    if (dayX < 0) return -1;
    return Math.floor(dayX / DAY_W);
  };

  const handleReservationMouseDown = (e, reservation, resizeType = null) => {
    if (e.button !== 0) return; // apenas botão esquerdo
    e.preventDefault();
    e.stopPropagation();

    setDragState({
      isDragging: !resizeType,
      isResizing: !!resizeType,
      resizeType,
      reservationId: reservation.id,
      initialMouseX: e.clientX,
      initialRoomId: reservation.roomId,
      initialStart: reservation.start,
      initialEnd: reservation.end,
      currentRoomId: reservation.roomId,
      currentStart: reservation.start,
      currentEnd: reservation.end,
    });
  };

  const confirmActionHandler = () => {
    if (!confirmAction.reservation) return;

    setReservations(prev => 
      prev.map(r => 
        r.id === confirmAction.reservation.id
          ? {
              ...r,
              roomId: confirmAction.newRoomId,
              start: confirmAction.newStart,
              end: confirmAction.newEnd,
            }
          : r
      )
    );

    setConfirmAction({
      open: false,
      type: null,
      reservation: null,
      newRoomId: null,
      newStart: null,
      newEnd: null,
    });
  };

  const cancelAction = () => {
    setConfirmAction({
      open: false,
      type: null,
      reservation: null,
      newRoomId: null,
      newStart: null,
      newEnd: null,
    });
  };

  useEffect(() => {
    const body = scrollerRef.current;
    const head = headXRef.current;
    if (!body || !head) return;

    const syncAndMeasure = () => {
      if (head.scrollLeft !== body.scrollLeft)
        head.scrollLeft = body.scrollLeft;

      const sx = body.scrollLeft;
      const vw = body.clientWidth;
      const pxIntoDays = Math.max(0, sx - LABEL_W);
      const firstIdx = Math.floor(pxIntoDays / DAY_W);
      const daysViewportPx = vw - Math.max(0, LABEL_W - sx);
      const cnt = Math.max(1, Math.ceil(daysViewportPx / DAY_W));
      const lastIdx = firstIdx + cnt - 1;

      setVisibleCols({
        first: Math.max(0, firstIdx),
        last: Math.max(firstIdx, lastIdx),
      });
    };

    body.addEventListener("scroll", syncAndMeasure, { passive: true });
    window.addEventListener("resize", syncAndMeasure);
    syncAndMeasure();

    return () => {
      body.removeEventListener("scroll", syncAndMeasure);
      window.removeEventListener("resize", syncAndMeasure);
    };
  }, []);

  // Event listeners globais para drag & drop
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragState.isDragging && !dragState.isResizing) return;

      const scrollerRect = scrollerRef.current?.getBoundingClientRect();
      if (!scrollerRect) return;

      const mouseX = e.clientX - scrollerRect.left + scrollerRef.current.scrollLeft;
      const mouseY = e.clientY - scrollerRect.top + scrollerRef.current.scrollTop;

      if (dragState.isDragging) {
        // Arrastar reserva inteira
        const newRoomId = getRoomIdFromY(mouseY);
        const newDayIndex = getDayIndexFromX(mouseX);
        
        if (newRoomId && newDayIndex >= 0 && newDayIndex < days.length) {
          const reservationDuration = diffDays(
            new Date(dragState.initialStart),
            new Date(dragState.initialEnd)
          );
          
          const newStartDate = days[newDayIndex];
          const newEndDate = addDays(newStartDate, reservationDuration);

          setDragState(prev => ({
            ...prev,
            currentRoomId: newRoomId,
            currentStart: ymd(newStartDate),
            currentEnd: ymd(newEndDate),
          }));
        }
      } else if (dragState.isResizing) {
        // Redimensionar reserva
        const newDayIndex = getDayIndexFromX(mouseX);
        
        if (newDayIndex >= 0 && newDayIndex < days.length) {
          const newDate = days[newDayIndex];
          
          if (dragState.resizeType === 'start') {
            // Redimensionar início
            const endDate = new Date(dragState.initialEnd);
            if (newDate < endDate) {
              setDragState(prev => ({
                ...prev,
                currentStart: ymd(newDate),
                currentEnd: dragState.initialEnd,
              }));
            }
          } else if (dragState.resizeType === 'end') {
            // Redimensionar fim
            const startDate = new Date(dragState.initialStart);
            if (newDate > startDate) {
              setDragState(prev => ({
                ...prev,
                currentStart: dragState.initialStart,
                currentEnd: ymd(newDate),
              }));
            }
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (dragState.isDragging || dragState.isResizing) {
        const reservation = reservations.find(r => r.id === dragState.reservationId);
        
        if (reservation) {
          const hasChanged = 
            dragState.currentRoomId !== dragState.initialRoomId ||
            dragState.currentStart !== dragState.initialStart ||
            dragState.currentEnd !== dragState.initialEnd;

          if (hasChanged) {
            setConfirmAction({
              open: true,
              type: dragState.isDragging ? 'move' : 'resize',
              reservation,
              newRoomId: dragState.currentRoomId || dragState.initialRoomId,
              newStart: dragState.currentStart || dragState.initialStart,
              newEnd: dragState.currentEnd || dragState.initialEnd,
            });
          }
        }
      }

      setDragState({
        isDragging: false,
        isResizing: false,
        resizeType: null,
        reservationId: null,
        initialMouseX: 0,
        initialRoomId: 0,
        initialStart: null,
        initialEnd: null,
        currentRoomId: 0,
        currentStart: null,
        currentEnd: null,
      });
    };

    if (dragState.isDragging || dragState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = dragState.isDragging ? 'grabbing' : 
                                   dragState.resizeType === 'start' ? 'w-resize' : 'e-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [dragState, days, reservations]);

  function resetSelection() {
    setRangeStart(null);
    setRangeEnd(null);
    setHoverDate(null);
  }
  function prevMonth() {
    if (prevDisabled) return;
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() - 1);
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    resetSelection();
  }
  function nextMonth() {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + 1);
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    resetSelection();
  }
  function onPickMonth(e) {
    const [y, m] = e.target.value.split("-").map(Number);
    const cand = new Date(y, m - 1, 1);
    if (
      cand.getFullYear() < today.getFullYear() ||
      (cand.getFullYear() === today.getFullYear() &&
        cand.getMonth() < today.getMonth())
    ) {
      setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
      return;
    }
    setViewDate(cand);
    resetSelection();
  }

  const stats = useMemo(() => {
    const s = ymd(selectedDay);
    const rs = reservations.filter((r) => s >= r.start && s <= r.end);
    const roomsReserved = new Set(rs.map((r) => r.roomId)).size;
    const guests = rs.length;
    const occupied = rs.length;
    return {
      roomsReserved,
      totalRooms: rooms.length,
      occupied,
      occupiedTotal: rs.length,
      guests,
    };
  }, [selectedDay, reservations, rooms.length]);

  function handleCellClick(room, date) {
    if (ymd(date) < todayKey) return;
    if (editorOpen) return; // evita conflito com editor aberto
    if (dragState.isDragging || dragState.isResizing) return; // evita conflito com drag
    
    if (!rangeStart || rangeStart.room.id !== room.id) {
      setRangeStart({ room, date });
      setRangeEnd(null);
      setHoverDate(date);
      setSelectedDay(date);
      return;
    }
    let checkout = date;
    if (ymd(date) <= ymd(rangeStart.date))
      checkout = addDays(rangeStart.date, 1);
    setRangeEnd({ room, date: checkout });
    setHoverDate(null);
    setOpenReview(true);
  }
  
  function handleHover(room, date) {
    if (rangeStart && !rangeEnd && rangeStart.room.id === room.id)
      setHoverDate(date);
  }
  
  const inActiveRange = (rId, d) => {
    if (openReview || editorOpen) return false;
    if (!rangeStart || rangeStart.room.id !== rId) return false;
    const startKey = ymd(rangeStart.date);
    if (rangeEnd) {
      const endKey = ymd(rangeEnd.date);
      return ymd(d) >= startKey && ymd(d) < endKey;
    }
    if (hoverDate) {
      const a = startKey;
      const b = ymd(hoverDate);
      const lo = a < b ? a : b;
      const hi = a < b ? b : a;
      return ymd(d) >= lo && ymd(d) <= hi;
    }
    return ymd(d) === startKey;
  };

  const nightly = 80;
  const review = useMemo(() => {
    if (!rangeStart || !rangeEnd) return null;
    const checkin = rangeStart.date;
    const checkout = rangeEnd.date;
    const nights = Math.max(1, diffDays(checkin, checkout));
    const total = nights * nightly;
    return {
      room: rangeStart.room,
      checkin,
      checkout,
      nights,
      nightly,
      total,
      paid: Math.min(total, 160),
    };
  }, [rangeStart, rangeEnd]);

  function clampRangeToVisible(startKey, endKey) {
    const visibleStart = dayKeys[0];
    const visibleEnd = dayKeys[dayKeys.length - 1];
    if (!visibleStart || !visibleEnd) return null;
    const clampedStart = startKey < visibleStart ? visibleStart : startKey;
    const clampedEnd = endKey > visibleEnd ? visibleEnd : endKey;
    const si = dayKeys.indexOf(clampedStart);
    const ei = dayKeys.indexOf(clampedEnd);
    if (si === -1 || ei === -1 || si > ei) return null;
    return {
      si,
      ei,
      startsBeforeVisible: startKey < visibleStart,
      endsAfterVisible: endKey > visibleEnd,
    };
  }

  return (
    <div className="form-page">
      {/* DASHBOARD */}
      <div style={{ marginBottom: BLOCK_GAP }}>
        <ModernDashboard
          reservations={reservations}
          rooms={rooms}
          selectedDay={selectedDay}
          viewDate={viewDate}
        />
      </div>

      {/* BARRA SUPERIOR */}
      <div
        className="form-card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 100,
          marginBottom: BLOCK_GAP,
        }}
      >
        <h2
          className="header__title"
          style={{ margin: 0 }}
        >{`Calendário de Reservas ${viewDate.getFullYear()}`}</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="btn btn--primary"
            onClick={() => setNewReservationOpen(true)}
          >
            Adicionar Reserva
          </button>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              className="btn"
              disabled={prevDisabled}
              onClick={prevMonth}
              aria-disabled={prevDisabled}
            >
              ‹
            </button>
            <input
              type="month"
              className="control"
              value={monthInputValue}
              onChange={onPickMonth}
            />
            <button className="btn" onClick={nextMonth}>
              ›
            </button>
          </div>
        </div>
      </div>

      {/* CALENDÁRIO */}
      <div
        className="form-card"
        style={{
          padding: 0,
          position: "relative",
          width: VIEW_W,
          marginInline: "auto",
          overflow: "hidden",
        }}
      >
        {/* Cabeçalho fixo (mês + datas) */}
        <div
          ref={headXRef}
          style={{
            position: "sticky",
            top: 0,
            zIndex: 90,
            overflowX: "hidden",
            borderBottom: "2px solid #e2e6ea",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            background: "#f8faf9",
          }}
        >
          {/* Faixa dos meses */}
          <div
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: `${LABEL_W}px repeat(${days.length}, ${DAY_W}px)`,
              height: MONTH_BAND_H,
              background: "#f3f6f7",
              borderBottom: "1px solid #e4eaee",
              minWidth: totalGridWidth,
            }}
          >
            <div style={{ borderRight: "1px solid #e2e6ea" }} />
            {visibleMonthBands.map((seg) => {
              const left = LABEL_W + seg.start * DAY_W;
              const width = (seg.end - seg.start + 1) * DAY_W;
              return (
                <div
                  key={`${seg.label}-${seg.start}-${seg.end}`}
                  style={{
                    position: "absolute",
                    left,
                    width,
                    top: 0,
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <span
                    style={{
                      padding: "4px 12px",
                      background: "#e9f0f2",
                      border: "1px solid #d8e3e7",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#2b3c4a",
                      textTransform: "capitalize",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    {seg.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Linha das datas */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${LABEL_W}px repeat(${days.length}, ${DAY_W}px)`,
              background: "#f8faf9",
              height: 72,
              minWidth: totalGridWidth,
            }}
          >
            <div
              style={{
                padding: "12px",
                background: "#f8faf9",
                borderRight: "1px solid #e2e6ea",
                fontWeight: 700,
                fontSize: 14,
                color: "#2d3748",
                display: "flex",
                alignItems: "center",
              }}
            >
              Quartos
            </div>
            {days.map((d, i) => {
              const isSel = ymd(d) === ymd(selectedDay);
              const isToday = ymd(d) === ymd(today);
              const isHoverDay = hoverDayIdx === i;
              return (
                <div
                  key={ymd(d)}
                  onClick={() => setSelectedDay(d)}
                  title={wk(d)}
                  style={{
                    minWidth: DAY_W,
                    borderRight: "1px solid #e2e6ea",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isSel
                      ? "#e6f2ef"
                      : isHoverDay
                      ? "#f1f8f6"
                      : "transparent",
                    borderRadius: 6,
                    transition: "background .12s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      lineHeight: "22px",
                      fontWeight: 800,
                      color: isToday ? "#2f7a67" : "#1f2937",
                    }}
                  >
                    {d.getDate()}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      textTransform: "capitalize",
                      color: isToday ? "#2f7a67" : "#64707a",
                    }}
                  >
                    {wk(d)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Corpo rolável */}
        <div
          ref={scrollerRef}
          onMouseLeave={() => setHoverCell({ roomId: null, dayIndex: null })}
          style={{
            overflow: "auto",
            maxHeight: VIEW_H,
            width: "100%",
            position: "relative",
            scrollBehavior: "smooth",
          }}
        >
          <div style={{ position: "relative", minWidth: totalGridWidth }}>
            {/* categorias + linhas */}
            {(() => {
              const rows = [];
              let rowIdx = 0;
              categories.forEach((cat) => {
                rows.push(
                  <div
                    key={`cat-${cat.name}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: `${LABEL_W}px repeat(${days.length}, ${DAY_W}px)`,
                      height: CAT_H,
                      background: "#eef2f3",
                      borderBottom: "1px solid #e2e6ea",
                    }}
                  >
                    <div
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 15,
                        background: "#eef2f3",
                        color: "#2d3748",
                        textAlign: "left",
                        padding: "8px 12px",
                        fontWeight: 700,
                        borderRight: "1px solid #e2e6ea",
                        fontSize: 13,
                        letterSpacing: 0.3,
                      }}
                    >
                      {cat.name}
                    </div>
                    {days.map((_, i) => (
                      <div
                        key={`catcell-${cat.name}-${i}`}
                        style={{ borderRight: "1px solid #eef1f3" }}
                      />
                    ))}
                  </div>
                );
                rooms
                  .filter((r) => r.id >= cat.from && r.id <= cat.to)
                  .forEach((room) => {
                    const isHoverRoom = hoverRoomId === room.id;
                    const rowBg = rowIdx++ % 2 === 0 ? "#fafdfb" : "#ffffff";
                    rows.push(
                      <div
                        key={`room-${room.id}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: `${LABEL_W}px repeat(${days.length}, ${DAY_W}px)`,
                          position: "relative",
                          height: ROW_H,
                          backgroundColor: rowBg,
                        }}
                      >
                        <div
                          style={{
                            position: "sticky",
                            left: 0,
                            zIndex: 15,
                            background: isHoverRoom ? "#edf7f4" : rowBg,
                            color: "#2d3748",
                            textAlign: "center",
                            padding: "16px 8px",
                            fontWeight: 600,
                            borderBottom: "1px solid #e2e6ea",
                            borderRight: "1px solid #e2e6ea",
                            fontSize: 14,
                            transition: "background .12s ease",
                          }}
                        >
                          {room.name}
                        </div>
                        {days.map((d, i) => {
                          const active = inActiveRange(room.id, d);
                          const isPast = ymd(d) < todayKey;
                          const isHover =
                            hoverRoomId === room.id && hoverDayIdx === i;
                          return (
                            <button
                              key={`${room.id}-${ymd(d)}`}
                              type="button"
                              onClick={() => handleCellClick(room, d)}
                              onMouseEnter={() =>
                                setHoverCell({ roomId: room.id, dayIndex: i })
                              }
                              onMouseLeave={() =>
                                setHoverCell({ roomId: null, dayIndex: null })
                              }
                              style={{
                                height: "100%",
                                border: "1px solid #eef1f3",
                                background: active
                                  ? "#e3e8f0"
                                  : isPast
                                  ? "#f8f9fa"
                                  : isHover
                                  ? "#f1f8f6"
                                  : "#ffffff",
                                cursor: isPast ? "not-allowed" : "pointer",
                                position: "relative",
                                opacity: isPast ? 0.6 : 1,
                                transition: "background .12s ease",
                              }}
                              title={
                                isPast
                                  ? `Data passada - ${d.toLocaleDateString(
                                      "pt-BR"
                                    )}`
                                  : `Quarto ${
                                      room.name
                                    } • ${d.toLocaleDateString("pt-BR")}`
                              }
                              disabled={isPast}
                            />
                          );
                        })}
                      </div>
                    );
                  });
              });
              return rows;
            })()}

            {/* divisores verticais no virar de mês */}
            {monthBreaks.map((b) => (
              <div
                key={`break-${b.index}`}
                title={b.label}
                style={{
                  position: "absolute",
                  left: LABEL_W + b.index * DAY_W,
                  top: 0,
                  height: contentHeight,
                  width: 0,
                  borderLeft: "2px solid #93a1ab",
                  zIndex: 5,
                }}
              />
            ))}

            {/* barras de reservas */}
            {reservations.map((r) => {
              const isDragging = dragState.reservationId === r.id;
              
              // Se está sendo arrastada, use as coordenadas temporárias
              let displayReservation = r;
              if (isDragging) {
                displayReservation = {
                  ...r,
                  roomId: dragState.currentRoomId || r.roomId,
                  start: dragState.currentStart || r.start,
                  end: dragState.currentEnd || r.end,
                };
              }

              const clamp = clampRangeToVisible(displayReservation.start, displayReservation.end);
              if (!clamp) return null;

              const leftPx =
                LABEL_W +
                clamp.si * DAY_W +
                (clamp.startsBeforeVisible ? 0 : DAY_W / 2 + BAR_GAP / 2);
              const rightPx =
                LABEL_W +
                (clamp.ei + 1) * DAY_W -
                (clamp.endsAfterVisible ? 0 : DAY_W / 2 + BAR_GAP / 2);
              const widthPx = Math.max(12, rightPx - leftPx);
              const top = roomTopMap[displayReservation.roomId] ?? 0;

              const start = new Date(displayReservation.start);
              const end = new Date(displayReservation.end);
              const nights = diffDays(start, addDays(end, 1));
              const hovered = hoverResv === r.id;

              let borderRadius = "8px";
              if (clamp.startsBeforeVisible && clamp.endsAfterVisible)
                borderRadius = "0";
              else if (clamp.startsBeforeVisible) borderRadius = "0 8px 8px 0";
              else if (clamp.endsAfterVisible) borderRadius = "8px 0 0 8px";

              return (
                <div
                  key={r.id}
                  style={{
                    position: "absolute",
                    top,
                    height: BAR_H,
                    left: leftPx,
                    width: widthPx,
                    background: isDragging 
                      ? "rgba(124, 164, 196, 0.8)" 
                      : hovered 
                      ? "#7ca4c4" 
                      : "#8fb4d4",
                    borderRadius,
                    boxShadow: isDragging 
                      ? "0 4px 12px rgba(0,0,0,0.3)" 
                      : "0 2px 4px rgba(0,0,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 10px",
                    zIndex: isDragging ? 20 : 10,
                    transform: hovered && !isDragging
                      ? "translateY(-1px) scale(1.02)"
                      : "none",
                    cursor: isDragging ? "grabbing" : "grab",
                    border: isDragging ? "2px solid #4a90b8" : "none",
                    color: "#1a365d",
                    fontWeight: 500,
                    userSelect: "none",
                    opacity: isDragging ? 0.9 : 1,
                  }}
                  onMouseDown={(e) => handleReservationMouseDown(e, r)}
                  onMouseEnter={() => setHoverResv(r.id)}
                  onMouseLeave={() => setHoverResv(null)}
                  title={r.title}
                >
                  {/* Handle de redimensionamento esquerdo */}
                  {!clamp.startsBeforeVisible && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: RESIZE_HANDLE_WIDTH,
                        cursor: "w-resize",
                        background: "transparent",
                        zIndex: 1,
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleReservationMouseDown(e, r, 'start');
                      }}
                      title="Redimensionar início"
                    />
                  )}

                  <span
                    style={{
                      background: "#ffffff",
                      borderRadius: 6,
                      padding: "2px 6px",
                      fontWeight: 700,
                      fontSize: 11,
                      color: "#2d3748",
                      minWidth: 20,
                      textAlign: "center",
                      pointerEvents: "none",
                    }}
                  >
                    {nights}
                  </span>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      flex: 1,
                      pointerEvents: "none",
                    }}
                  >
                    {r.title}
                  </div>

                  {/* Handle de redimensionamento direito */}
                  {!clamp.endsAfterVisible && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: RESIZE_HANDLE_WIDTH,
                        cursor: "e-resize",
                        background: "transparent",
                        zIndex: 1,
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleReservationMouseDown(e, r, 'end');
                      }}
                      title="Redimensionar fim"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal – nova reserva */}
      <Modal
        open={openReview}
        onClose={() => {
          setOpenReview(false);
          resetSelection();
        }}
      >
        {review && (
          <div
            className="form-card"
            style={{ boxShadow: "none", padding: 0, minWidth: 520 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 className="form-card__title" style={{ margin: 0 }}>
                Resumo de Reserva
              </h3>
            </div>
            <div
              className="cd-split"
              style={{ gridTemplateColumns: "1fr 1fr", marginTop: 0 }}
            >
              <div>
                <h4>Dados</h4>
                <div className="kv">
                  <strong>Quarto:</strong>
                  <span>{review.room.name}</span>
                </div>
                <div className="kv">
                  <strong>Diárias:</strong>
                  <span>{review.nights}</span>
                </div>
                <div className="kv">
                  <strong>Checkin:</strong>
                  <span>{review.checkin.toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="kv">
                  <strong>Checkout:</strong>
                  <span>{review.checkout.toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
              <div>
                <h4>Valores</h4>
                <div className="kv">
                  <strong>Valor Diaria:</strong>
                  <span>R$ {review.nightly.toFixed(2)}</span>
                </div>
                <div className="kv">
                  <strong>Valor Total:</strong>
                  <span>R$ {review.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: 16 }}>
              <button
                className="btn"
                onClick={() => {
                  setOpenReview(false);
                  resetSelection();
                }}
              >
                Fechar
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  setOpenReview(false);
                  resetSelection();
                }}
              >
                Confirmar Reserva
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmação de ação */}
      <Modal
        open={confirmAction.open}
        onClose={cancelAction}
      >
        <div
          className="form-card"
          style={{ boxShadow: "none", padding: 0, minWidth: 480 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h3 className="form-card__title" style={{ margin: 0 }}>
              Confirmar {confirmAction.type === 'move' ? 'Mudança' : 'Redimensionamento'}
            </h3>
          </div>
          
          {confirmAction.reservation && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: "0 0 12px 0", color: "#4a5568" }}>
                {confirmAction.type === 'move' 
                  ? 'Deseja mover esta reserva para o novo quarto e data?'
                  : 'Deseja alterar as datas desta reserva?'
                }
              </p>
              
              <div style={{ 
                background: "#f7fafc", 
                border: "1px solid #e2e8f0", 
                borderRadius: 8, 
                padding: 16,
                marginBottom: 16
              }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#2d3748" }}>
                  {confirmAction.reservation.title}
                </h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <strong style={{ fontSize: 13, color: "#718096" }}>Dados Atuais:</strong>
                    <div style={{ fontSize: 14, marginTop: 4 }}>
                      <div>Quarto: {rooms.find(r => r.id === confirmAction.reservation.roomId)?.name}</div>
                      <div>Entrada: {new Date(confirmAction.reservation.start).toLocaleDateString("pt-BR")}</div>
                      <div>Saída: {new Date(confirmAction.reservation.end).toLocaleDateString("pt-BR")}</div>
                    </div>
                  </div>
                  
                  <div>
                    <strong style={{ fontSize: 13, color: "#718096" }}>Novos Dados:</strong>
                    <div style={{ fontSize: 14, marginTop: 4, color: "#2b6cb0" }}>
                      <div>Quarto: {rooms.find(r => r.id === confirmAction.newRoomId)?.name}</div>
                      <div>Entrada: {new Date(confirmAction.newStart).toLocaleDateString("pt-BR")}</div>
                      <div>Saída: {new Date(confirmAction.newEnd).toLocaleDateString("pt-BR")}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button
              className="btn"
              onClick={cancelAction}
            >
              Cancelar
            </button>
            <button
              className="btn btn--primary"
              onClick={confirmActionHandler}
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      <NewReservationModal
        open={newReservationOpen}
        onClose={() => setNewReservationOpen(false)}
        onSave={(newRes) => {
          setReservations((prev) => [...prev, newRes]);
        }}
      />

      {/* EDITOR SEPARADO (modal) */}
      <ReservationEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        reservation={editorData}
        rooms={rooms}
        onSave={(updated) => {
          // Atualiza reserva no calendário (apenas campos relevantes p/ a grade)
          setReservations((prev) =>
            prev.map((r) =>
              r.id === updated.id
                ? {
                    ...r,
                    roomId: updated.roomId,
                    start: updated.checkin,
                    end: updated.checkout,
                  }
                : r
            )
          );
          setEditorOpen(false);
        }}
      />
    </div>
  );
}