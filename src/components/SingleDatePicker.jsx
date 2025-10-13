// src/components/SingleDatePicker.jsx
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import InputMask from "react-input-mask";
import "./DateRangePicker.css";

const SingleDatePicker = ({
  value,
  onChange,
  placeholder = "Selecionar data",
  className = "",
  disabled = false,
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const triggerRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 320 });

  // helpers
  const formatPt = (dstr) => {
    if (!dstr) return "";
    const d = new Date(dstr + "T00:00:00");
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const parseToISO = (txt) => {
    if (!txt) return "";
    const s = txt.trim();

    // dd/MM/yyyy
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const [_, dd, mm, yyyy] = m;
      const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
      if (!Number.isNaN(d.getTime())) {
        // Valida se é uma data real
        if (
          d.getDate() === parseInt(dd, 10) &&
          d.getMonth() + 1 === parseInt(mm, 10) &&
          d.getFullYear() === parseInt(yyyy, 10)
        ) {
          return d.toISOString().slice(0, 10);
        }
      }
      return "";
    }

    // yyyy-MM-dd (ISO)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const d = new Date(s + "T00:00:00");
      if (!Number.isNaN(d.getTime())) return s;
    }
    return "";
  };

  const clampISO = (iso, minD, maxD) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (minD && d < minD) return minD.toISOString().slice(0, 10);
    if (maxD && d > maxD) return maxD.toISOString().slice(0, 10);
    return iso;
  };

  const [typed, setTyped] = useState(value ? formatPt(value) : "");
  
  useEffect(() => {
    setTyped(value ? formatPt(value) : "");
    if (value) {
      const dateObj = new Date(value + "T00:00:00");
      if (!Number.isNaN(dateObj.getTime())) {
        setCurrentMonth(dateObj);
      }
    }
  }, [value]);

  const commitTyped = () => {
    const iso = parseToISO(typed);
    if (!iso) {
      // Se a data digitada for inválida, restaura o valor anterior
      setTyped(value ? formatPt(value) : "");
      return;
    }
    const clamped = clampISO(iso, minDate, maxDate);
    onChange(clamped);
    
    // Atualiza o calendário para o mês da data digitada
    const dateObj = new Date(clamped + "T00:00:00");
    if (!Number.isNaN(dateObj.getTime())) {
      setCurrentMonth(dateObj);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setTyped(newValue);
    
    // Tenta converter automaticamente quando completar a máscara
    if (!newValue.includes("_") && newValue.length === 10) {
      const iso = parseToISO(newValue);
      if (iso) {
        const clamped = clampISO(iso, minDate, maxDate);
        onChange(clamped);
        
        // Atualiza o calendário
        const dateObj = new Date(clamped + "T00:00:00");
        if (!Number.isNaN(dateObj.getTime())) {
          setCurrentMonth(dateObj);
        }
      }
    }
  };

  // posicionamento do dropdown
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
  }, [isOpen]);

  useEffect(() => {
    const onDown = (e) => {
      if (!isOpen) return;
      const dropdown = document.getElementById("sdp-portal");
      const inTrigger = triggerRef.current && triggerRef.current.contains(e.target);
      const inDropdown = dropdown && dropdown.contains(e.target);
      if (!inTrigger && !inDropdown) setIsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const gridStart = new Date(firstDay);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    const days = [];
    const cur = new Date(gridStart);
    while (cur <= lastDay || days.length < 42) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
      if (days.length >= 42) break;
    }
    return days;
  };

  const handleDateClick = (date) => {
    const iso = date.toISOString().slice(0, 10);
    const clamped = clampISO(iso, minDate, maxDate);
    onChange(clamped);
    setIsOpen(false);
  };

  const navigateMonth = (dir) => {
    setCurrentMonth((prev) => {
      const nd = new Date(prev);
      nd.setMonth(prev.getMonth() + dir);
      return nd;
    });
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const dropdown = !isOpen ? null : createPortal(
    <div
      id="sdp-portal"
      className="date-dropdown--fixed"
      style={{ top: coords.top, left: coords.left, width: coords.width }}
    >
      <div className="calendar-header">
        <button className="nav-button" onClick={() => navigateMonth(-1)} type="button">←</button>

        <div className="month-year">
          <select
            className="month-select"
            value={currentMonth.getMonth()}
            onChange={(e) => {
              const nd = new Date(currentMonth);
              nd.setMonth(parseInt(e.target.value, 10));
              setCurrentMonth(nd);
            }}
          >
            {monthNames.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>

          <input
            className="year-input"
            type="number"
            value={currentMonth.getFullYear()}
            onChange={(e) => {
              const y = parseInt(e.target.value || `${currentMonth.getFullYear()}`, 10);
              const nd = new Date(currentMonth);
              nd.setFullYear(y);
              setCurrentMonth(nd);
            }}
            step={1}
            inputMode="numeric"
          />
        </div>

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
            const iso = date.toISOString().slice(0, 10);
            const selected = value && iso === value;

            const isDisabled =
              (minDate && date < minDate) ||
              (maxDate && date > maxDate);

            return (
              <button
                key={idx}
                type="button"
                className={`day ${!isCurrentMonth ? "other-month" : ""} ${selected ? "selected" : ""}`}
                disabled={isDisabled}
                onClick={() => handleDateClick(date)}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className={`single-date-picker ${className}`}>
      <div ref={triggerRef} className={`date-input ${isOpen ? "active" : ""} ${disabled ? "disabled" : ""}`}>
        <InputMask
          mask="99/99/9999"
          maskChar="_"
          className="date-text-input"
          type="text"
          placeholder={placeholder}
          value={typed}
          onChange={handleInputChange}
          onBlur={commitTyped}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitTyped();
            }
          }}
          disabled={disabled}
        />
        <button
          className="date-icon-btn"
          type="button"
          onClick={() => !disabled && setIsOpen((v) => !v)}
        >
          📅
        </button>
      </div>
      {dropdown}
    </div>
  );
};

export default SingleDatePicker;
