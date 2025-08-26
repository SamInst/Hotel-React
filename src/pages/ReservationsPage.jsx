// src/pages/ReservationsPage.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { Modal } from "../components/Modal.jsx";
import ModernDashboard from "./ModernDashboard";

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

  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState(today);

  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);

  const [openReview, setOpenReview] = useState(false);
  const [openExisting, setOpenExisting] = useState(null);
  const [hoverResv, setHoverResv] = useState(null);

  // scrollers
  const scrollerRef = useRef(null);   // corpo (vertical + horizontal)
  const headXRef   = useRef(null);    // cabeçalho (apenas horizontal)

  // colunas visíveis (primeira/última) para centralizar a etiqueta no trecho realmente visível
  const [visibleCols, setVisibleCols] = useState({ first: 0, last: 30 });

  useEffect(() => {
    const body = scrollerRef.current;
    const head = headXRef.current;
    if (!body || !head) return;

    const syncAndMeasure = () => {
      // sincroniza cabeçalho com a rolagem horizontal do corpo
      if (head.scrollLeft !== body.scrollLeft) head.scrollLeft = body.scrollLeft;

      // mede colunas visíveis para centralizar as etiquetas
      const sx = body.scrollLeft;            // deslocamento horizontal
      const vw = body.clientWidth;           // largura visível do corpo
      const pxIntoDays = Math.max(0, sx - LABEL_W);
      const firstIdx = Math.floor(pxIntoDays / DAY_W);

      // largura útil para colunas de dia dentro do viewport
      const daysViewportPx = vw - Math.max(0, LABEL_W - sx);
      const cnt = Math.max(1, Math.ceil(daysViewportPx / DAY_W));
      const lastIdx = firstIdx + cnt - 1;

      setVisibleCols({
        first: Math.max(0, firstIdx),
        last: Math.max(firstIdx, lastIdx),
      });
    };

    // rolagem do corpo controla o cabeçalho
    body.addEventListener("scroll", syncAndMeasure, { passive: true });
    window.addEventListener("resize", syncAndMeasure);

    // inicializa
    syncAndMeasure();

    return () => {
      body.removeEventListener("scroll", syncAndMeasure);
      window.removeEventListener("resize", syncAndMeasure);
    };
  }, []);

  const categories = useMemo(
    () => [
      { name: "SIMPLES", from: 1, to: 5 },
      { name: "COMPLETO", from: 6, to: 10 },
      { name: "DELUXE",   from: 11, to: 15 },
      { name: "MASTER",   from: 16, to: 22 },
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

  const reservations = useMemo(
    () => [
      { id: 101, roomId: 1, start: "2025-08-21", end: "2025-08-27", title: "CASA E CAFE ASSESSORIA PROFISSIONAL LTDA" },
      { id: 106, roomId: 2, start: "2025-08-25", end: "2025-08-28", title: "CASA E CAFE ASSEORIA PROFISSIONAL LTDA" },
      { id: 102, roomId: 1, start: "2025-08-27", end: "2025-08-29", title: "PESSOA CHATA QUE NAO QUER PAGAR" },
      { id: 103, roomId: 2, start: "2025-08-21", end: "2025-08-23", title: "CASA E CAFE ASSESSORIA PROFISSIONAL LTDA" },
      { id: 104, roomId: 4, start: "2025-08-24", end: "2025-08-28", title: "EMPRESA DEMO" },
      { id: 105, roomId: 7, start: "2025-08-26", end: "2025-08-28", title: "EMPRESA DEMAO" },
      { id: 107, roomId: 1, start: "2025-08-29", end: "2025-09-02", title: "EMPRESA DEMAO" },
    ],
    []
  );

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

  // segmentos completos de mês (sobre a janela de 31 dias)
  const monthSegments = useMemo(() => {
    const segs = [];
    let start = 0;
    for (let i = 1; i <= days.length; i++) {
      const changed = i === days.length || days[i].getMonth() !== days[i - 1].getMonth();
      if (changed) {
        const end = i - 1;
        const label = days[start].toLocaleDateString("pt-BR", { month: "long" });
        segs.push({ start, end, label });
        start = i;
      }
    }
    return segs;
  }, [days]);

  // bandas visíveis (clamp em first/last) — são estas que centralizamos e desenhamos!
  const visibleMonthBands = useMemo(() => {
    const bands = [];
    for (const seg of monthSegments) {
      const s = Math.max(seg.start, visibleCols.first);
      const e = Math.min(seg.end,   visibleCols.last);
      if (s <= e) bands.push({ start: s, end: e, label: seg.label });
    }
    return bands;
  }, [monthSegments, visibleCols]);

  // linhas (divisores) no virar do mês
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

  const monthInputValue = `${viewDate.getFullYear()}-${pad(viewDate.getMonth() + 1)}`;
  const prevDisabled =
    viewDate.getFullYear() < today.getFullYear() ||
    (viewDate.getFullYear() === today.getFullYear() &&
      viewDate.getMonth() <= today.getMonth());

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
    if (openExisting) return;
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
    if (rangeStart && !rangeEnd && rangeStart.room.id === room.id) {
      setHoverDate(date);
    }
  }
  const inActiveRange = (rId, d) => {
    if (openReview || openExisting) return false;
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
    const clampedEnd   = endKey   > visibleEnd   ? visibleEnd   : endKey;
    const si = dayKeys.indexOf(clampedStart);
    const ei = dayKeys.indexOf(clampedEnd);
    if (si === -1 || ei === -1 || si > ei) return null;
    return {
      si,
      ei,
      startsBeforeVisible: startKey < visibleStart,
      endsAfterVisible:   endKey   > visibleEnd,
    };
  }

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

  const existingInfo = useMemo(() => {
    if (!openExisting) return null;
    const start = new Date(openExisting.start);
    const end = new Date(openExisting.end);
    const nights = diffDays(start, addDays(end, 1));
    return {
      nights,
      title: openExisting.title,
      nightly,
      total: nights * nightly,
      range: `${start.toLocaleDateString("pt-BR")} - ${end.toLocaleDateString(
        "pt-BR"
      )}`,
    };
  }, [openExisting]);

  return (
    <div className="form-page">
      {/* DASHBOARD (gap enxuto) */}
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
        <h2 className="header__title" style={{ margin: 0 }}>
          {`Calendário de Reservas ${viewDate.getFullYear()}`}
        </h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="btn btn--primary"
            onClick={() => {
              resetSelection();
              setOpenReview(false);
              setOpenExisting(null);
            }}
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

      {/* CALENDÁRIO (cabeçalho sticky fora do scroller + corpo rolável) */}
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
        {/* ===== CABEÇALHO STICKY: FAIXA DOS MESES + LINHA DAS DATAS ===== */}
        <div
          ref={headXRef}
          style={{
            position: "sticky",
            top: 0,               // cola logo abaixo do título (que também é sticky)
            zIndex: 90,
            overflowX: "hidden",
            borderBottom: "2px solid #e2e6ea",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {/* FAIXA DOS MESES */}
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
            {/* coluna “Quartos” vazia para alinhamento */}
            <div style={{ borderRight: "1px solid #e2e6ea" }} />

            {/* etiquetas dos meses CENTRALIZADAS PELO TRECHO VISÍVEL */}
            {visibleMonthBands.map((seg) => {
              const left  = LABEL_W + seg.start * DAY_W;
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

          {/* LINHA DAS DATAS */}
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

            {days.map((d) => {
              const isSel = ymd(d) === ymd(selectedDay);
              const isToday = ymd(d) === ymd(today);
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
                    background: isSel ? "#e6f2ef" : "transparent",
                    borderRadius: 6,
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

        {/* ===== CORPO ROLÁVEL (vertical + horizontal) ===== */}
        <div
          ref={scrollerRef}
          style={{
            overflow: "auto",
            maxHeight: VIEW_H,
            width: "100%",
            position: "relative",
            scrollBehavior: "smooth",
          }}
        >
          <div style={{ position: "relative", minWidth: totalGridWidth }}>
            {/* categorias + linhas de quartos */}
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
                    const roomBg = rowIdx++ % 2 === 0 ? "#fafdfb" : "#ffffff";
                    rows.push(
                      <div
                        key={`room-${room.id}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: `${LABEL_W}px repeat(${days.length}, ${DAY_W}px)`,
                          position: "relative",
                          height: ROW_H,
                          backgroundColor: roomBg,
                        }}
                      >
                        <div
                          style={{
                            position: "sticky",
                            left: 0,
                            zIndex: 15,
                            background: roomBg,
                            color: "#2d3748",
                            textAlign: "center",
                            padding: "16px 8px",
                            fontWeight: 600,
                            borderBottom: "1px solid #e2e6ea",
                            borderRight: "1px solid #e2e6ea",
                            fontSize: 14,
                          }}
                        >
                          {room.name}
                        </div>
                        {days.map((d) => {
                          const active = inActiveRange(room.id, d);
                          const isPast = ymd(d) < todayKey;
                          return (
                            <button
                              key={`${room.id}-${ymd(d)}`}
                              type="button"
                              onClick={() => handleCellClick(room, d)}
                              onMouseEnter={() => handleHover(room, d)}
                              style={{
                                height: "100%",
                                border: "1px solid #eef1f3",
                                background: active
                                  ? "#e3e8f0"
                                  : isPast
                                  ? "#f8f9fa"
                                  : "#ffffff",
                                cursor: isPast ? "not-allowed" : "pointer",
                                position: "relative",
                                opacity: isPast ? 0.6 : 1,
                              }}
                              title={
                                isPast
                                  ? `Data passada - ${d.toLocaleDateString("pt-BR")}`
                                  : `Quarto ${room.name} • ${d.toLocaleDateString("pt-BR")}`
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
              const clamp = clampRangeToVisible(r.start, r.end);
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
              const top = roomTopMap[r.roomId] ?? 0;

              const start = new Date(r.start);
              const end = new Date(r.end);
              const nights = diffDays(start, addDays(end, 1));
              const hovered = hoverResv === r.id;

              let borderRadius = "8px";
              if (clamp.startsBeforeVisible && clamp.endsAfterVisible)
                borderRadius = "0";
              else if (clamp.startsBeforeVisible) borderRadius = "0 8px 8px 0";
              else if (clamp.endsAfterVisible) borderRadius = "8px 0 0 8px";

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setOpenExisting({ ...r })}
                  onMouseEnter={() => setHoverResv(r.id)}
                  onMouseLeave={() => setHoverResv(null)}
                  style={{
                    position: "absolute",
                    top,
                    height: BAR_H,
                    left: leftPx,
                    width: widthPx,
                    background: hovered ? "#7ca4c4" : "#8fb4d4",
                    borderRadius,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 10px",
                    zIndex: 10,
                    transform: hovered ? "translateY(-1px) scale(1.02)" : "none",
                    cursor: "pointer",
                    border: 0,
                    color: "#1a365d",
                    fontWeight: 500,
                  }}
                  title={r.title}
                >
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
                    }}
                  >
                    {r.title}
                  </div>
                </button>
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

      {/* Modal – reserva existente */}
      <Modal open={!!openExisting} onClose={() => setOpenExisting(null)}>
        {openExisting && (
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
                {openExisting.title}
              </h3>
            </div>
            <div
              className="cd-split"
              style={{ gridTemplateColumns: "1fr 1fr", marginTop: 0 }}
            >
              <div>
                <h4>Dados</h4>
                <div className="kv">
                  <strong>Período:</strong>
                  <span>
                    {new Date(openExisting.start).toLocaleDateString("pt-BR")} -{" "}
                    {new Date(openExisting.end).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
              <div>
                <h4>Valores</h4>
                <div className="kv">
                  <strong>Valor Diária:</strong>
                  <span>R$ 80,00</span>
                </div>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: 16 }}>
              <button className="btn" onClick={() => setOpenExisting(null)}>
                Fechar
              </button>
              <button
                className="btn btn--primary"
                onClick={() => setOpenExisting(null)}
              >
                Editar Reserva
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
