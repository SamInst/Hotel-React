import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import "./TimePicker.css";

const TimePicker = ({
  value = "",
  onChange,
  placeholder = "Selecionar horário",
  className = "",
  disabled = false,
  interval = 30, // minutos
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value || "");
  const triggerRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 180 });

  // fechar ao clicar fora
  useEffect(() => {
    const onDown = (e) => {
      if (!isOpen) return;
      const dropdown = document.getElementById("tp-portal");
      const inTrigger = triggerRef.current && triggerRef.current.contains(e.target);
      const inDropdown = dropdown && dropdown.contains(e.target);
      if (!inTrigger && !inDropdown) setIsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen]);

  // posicionar dropdown
  const placeDropdown = () => {
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const desired = 200;
    let left = rect.left;
    let top = rect.bottom + margin;
    if (left + desired > vw - margin) {
      left = Math.max(margin, vw - desired - margin);
    }
    const estAltura = 320;
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

  // gerar lista de horários
  const generateTimes = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += interval) {
        const hh = h.toString().padStart(2, "0");
        const mm = m.toString().padStart(2, "0");
        times.push(`${hh}:${mm}`);
      }
    }
    return times;
  };

  const handleSelect = (time) => {
    setTempValue(time);
    onChange?.(time);
    setIsOpen(false);
  };

  const dropdown = !isOpen
    ? null
    : createPortal(
        <div
          id="tp-portal"
          className="time-dropdown--fixed"
          style={{ top: coords.top, left: coords.left, width: coords.width }}
          role="dialog"
          aria-modal="true"
        >
          <div className="time-list">
            {generateTimes().map((time) => (
              <button
                key={time}
                className={`time-option ${tempValue === time ? "selected" : ""}`}
                onClick={() => handleSelect(time)}
                type="button"
              >
                {time}
              </button>
            ))}
          </div>
        </div>,
        document.body
      );

  return (
    <div className={`time-picker ${className}`}>
      <div
        ref={triggerRef}
        className={`time-input ${isOpen ? "active" : ""} ${disabled ? "disabled" : ""}`}
        onClick={() => !disabled && setIsOpen((v) => !v)}
      >
        <span className="time-text">{tempValue || placeholder}</span>
        <span className="time-icon">⏰</span>
      </div>
      {dropdown}
    </div>
  );
};

export default TimePicker;
