  // src/components/DateRangePicker.jsx
  import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
  import { createPortal } from "react-dom";
  import "./DateRangePicker.css";

  const DateRangePicker = ({
    startDate,
    endDate,
    onDateChange,
    placeholder = "Selecionar período",
    className = "",
    disabled = false,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempStartDate, setTempStartDate] = useState(startDate || "");
    const [tempEndDate, setTempEndDate] = useState(endDate || "");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectingStart, setSelectingStart] = useState(true);

    // preview (rastro durante o hover)
    const [hoverDate, setHoverDate] = useState("");

    const triggerRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 320 });

    useEffect(() => {
      setTempStartDate(startDate || "");
      setTempEndDate(endDate || "");
    }, [startDate, endDate]);

    // fechar ao clicar fora (considerando portal)
    useEffect(() => {
      const onDown = (e) => {
        if (!isOpen) return;
        const dropdown = document.getElementById("drp-portal");
        const inTrigger = triggerRef.current && triggerRef.current.contains(e.target);
        const inDropdown = dropdown && dropdown.contains(e.target);
        if (!inTrigger && !inDropdown) setIsOpen(false);
      };
      document.addEventListener("mousedown", onDown);
      return () => document.removeEventListener("mousedown", onDown);
    }, [isOpen]);

    // posicionar dropdown relativo ao trigger (position:fixed)
    const placeDropdown = () => {
      const margin = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const desired = Math.min(340, Math.max(280, Math.floor(vw * 0.92)));
      let left = rect.left;
      let top = rect.bottom + margin;

      if (left + desired > vw - margin) {
        left = Math.max(margin, vw - desired - margin);
      }
      // estimativa de altura; CSS também limita com max-height
      const estAltura = 360;
      if (top + estAltura > vh - margin) {
        const above = rect.top - estAltura - margin;
        if (above > margin) top = above;
      }

      setCoords({ top: Math.round(top), left: Math.round(left), width: desired });
    };

    useLayoutEffect(() => {
      if (!isOpen) return;
      placeDropdown();
      const onResizeOrScroll = () => placeDropdown();
      window.addEventListener("resize", onResizeOrScroll);
      window.addEventListener("scroll", onResizeOrScroll, true);
      return () => {
        window.removeEventListener("resize", onResizeOrScroll);
        window.removeEventListener("scroll", onResizeOrScroll, true);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const formatDateRange = () => {
      if (!startDate && !endDate) return placeholder;
      if (startDate && !endDate) return `${formatDate(startDate)} - ...`;
      if (!startDate && endDate) return `... - ${formatDate(endDate)}`;
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const date = new Date(dateStr + "T00:00:00");
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const gridStart = new Date(firstDay);
      gridStart.setDate(gridStart.getDate() - gridStart.getDay()); // começa no domingo

      const days = [];
      const cur = new Date(gridStart);
      while (cur <= lastDay || days.length < 42) {
        days.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
        if (days.length >= 42) break; // 6 linhas x 7 colunas
      }
      return days;
    };

    const handleDateClick = (date) => {
      const dateStr = date.toISOString().slice(0, 10);
      if (selectingStart) {
        setTempStartDate(dateStr);
        setSelectingStart(false);
        if (tempEndDate && dateStr > tempEndDate) setTempEndDate("");
      } else {
        if (tempStartDate && dateStr < tempStartDate) {
          setTempEndDate(tempStartDate);
          setTempStartDate(dateStr);
        } else {
          setTempEndDate(dateStr);
        }
        setSelectingStart(true);
        setHoverDate("");
      }
    };

    // hover/preview helpers
    const handleDayHover = (date) => {
      if (selectingStart) return; // só durante seleção do fim
      const iso = date.toISOString().slice(0, 10);
      setHoverDate(iso);
    };
    const clearHover = () => setHoverDate("");

    const getPreviewBounds = () => {
      // preview só quando: já escolheu início, ainda não tem fim e há hover
      if (selectingStart || !tempStartDate || tempEndDate || !hoverDate) return null;
      const from = tempStartDate <= hoverDate ? tempStartDate : hoverDate;
      const to = tempStartDate <= hoverDate ? hoverDate : tempStartDate;
      return { from, to };
    };

    const isDateInRange = (date) => {
      if (!tempStartDate || !tempEndDate) return false;
      const s = tempStartDate;
      const e = tempEndDate;
      const d = date.toISOString().slice(0, 10);
      return d >= s && d <= e;
    };

    const isDateSelected = (date) => {
      const d = date.toISOString().slice(0, 10);
      return d === tempStartDate || d === tempEndDate;
    };

    const applyDates = () => {
      onDateChange(tempStartDate || "", tempEndDate || "");
      setIsOpen(false);
      setHoverDate("");
    };

    const clearDates = () => {
      setTempStartDate("");
      setTempEndDate("");
      onDateChange("", "");
      setIsOpen(false);
      setHoverDate("");
      setSelectingStart(true);
    };

    const navigateMonth = (dir) => {
      setCurrentMonth((prev) => {
        const nd = new Date(prev);
        nd.setMonth(prev.getMonth() + dir);
        return nd;
      });
    };

    const monthNames = [
      "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
      "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
    ];
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const dropdown = !isOpen
      ? null
      : createPortal(
          <div
            id="drp-portal"
            className="date-dropdown--fixed"
            style={{ top: coords.top, left: coords.left, width: coords.width }}
            role="dialog"
            aria-modal="true"
          >
            <div className="calendar-header">
              <button className="nav-button" onClick={() => navigateMonth(-1)} type="button">←</button>
              <h3 className="month-year">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button className="nav-button" onClick={() => navigateMonth(1)} type="button">→</button>
            </div>

            <div className="calendar-grid">
              <div className="weekdays">
                {weekDays.map((d) => (
                  <div key={d} className="weekday">{d}</div>
                ))}
              </div>

              <div className="days">
                {getDaysInMonth(currentMonth).map((date, idx) => {
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();

                  const d = date.toISOString().slice(0, 10);
                  const committedInRange = isDateInRange(date);
                  const selected = isDateSelected(date);

                  const preview = getPreviewBounds();
                  const inPreview = !!(preview && d >= preview.from && d <= preview.to);
                  const isPreviewStart = preview && d === preview.from;
                  const isPreviewEnd = preview && d === preview.to;

                  return (
                    <button
                      key={idx}
                      className={
                        `day ${!isCurrentMonth ? "other-month" : ""} ` +
                        `${isToday ? "today" : ""} ` +
                        `${committedInRange ? "in-range" : ""} ` +
                        `${selected ? "selected" : ""} ` +
                        `${inPreview ? "preview" : ""} ` +
                        `${isPreviewStart ? "preview-edge-start" : ""} ` +
                        `${isPreviewEnd ? "preview-edge-end" : ""}`
                      }
                      onClick={() => handleDateClick(date)}
                      onMouseEnter={() => handleDayHover(date)}
                      onMouseLeave={clearHover}
                      type="button"
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="calendar-footer">
              <div className="selection-info">
                {selectingStart ? "Selecione data inicial" : "Selecione data final"}
              </div>
              <div className="action-buttons">
                <button className="clear-button" onClick={clearDates} type="button">Limpar</button>
                <button
                  className="apply-button"
                  onClick={applyDates}
                  disabled={!tempStartDate && !tempEndDate}
                  type="button"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>,
          document.body
        );

    return (
      <div className={`date-range-picker ${className}`}>
        <div
          ref={triggerRef}
          className={`date-input ${isOpen ? "active" : ""} ${disabled ? "disabled" : ""}`}
          onClick={() => !disabled && setIsOpen((v) => !v)}
        >
          <span className="date-text">{formatDateRange()}</span>
          <span className="date-icon">📅</span>
        </div>
        {dropdown}
      </div>
    );
  };

  export default DateRangePicker;
