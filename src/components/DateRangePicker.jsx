// src/components/DateRangePicker.jsx
import React, { useState, useRef, useEffect } from "react";
import "./DateRangePicker.css";

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onDateChange,
  placeholder = "Selecionar período",
  className = "",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateRange = () => {
    if (!startDate && !endDate) return placeholder;
    if (startDate && !endDate) return `${formatDate(startDate)} - ...`;
    if (!startDate && endDate) return `... - ${formatDate(endDate)}`;
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString("pt-BR", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric" 
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    while (current <= lastDay || days.length < 42) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (days.length >= 42) break;
    }

    return days;
  };

  const handleDateClick = (date) => {
    const dateStr = date.toISOString().slice(0, 10);
    
    if (selectingStart) {
      setTempStartDate(dateStr);
      setSelectingStart(false);
      if (tempEndDate && dateStr > tempEndDate) {
        setTempEndDate("");
      }
    } else {
      if (tempStartDate && dateStr < tempStartDate) {
        setTempEndDate(tempStartDate);
        setTempStartDate(dateStr);
      } else {
        setTempEndDate(dateStr);
      }
      setSelectingStart(true);
    }
  };

  const isDateInRange = (date) => {
    if (!tempStartDate || !tempEndDate) return false;
    const dateStr = date.toISOString().slice(0, 10);
    return dateStr >= tempStartDate && dateStr <= tempEndDate;
  };

  const isDateSelected = (date) => {
    const dateStr = date.toISOString().slice(0, 10);
    return dateStr === tempStartDate || dateStr === tempEndDate;
  };

  const applyDates = () => {
    onDateChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const clearDates = () => {
    setTempStartDate("");
    setTempEndDate("");
    onDateChange("", "");
    setIsOpen(false);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className={`date-range-picker ${className}`} ref={containerRef}>
      <div 
        className={`date-input ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="date-text">{formatDateRange()}</span>
        <span className="date-icon">📅</span>
      </div>

      {isOpen && (
        <div className="date-dropdown">
          <div className="calendar-header">
            <button 
              className="nav-button" 
              onClick={() => navigateMonth(-1)}
              type="button"
            >
              ←
            </button>
            <h3 className="month-year">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button 
              className="nav-button" 
              onClick={() => navigateMonth(1)}
              type="button"
            >
              →
            </button>
          </div>

          <div className="calendar-grid">
            <div className="weekdays">
              {weekDays.map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>
            
            <div className="days">
              {getDaysInMonth(currentMonth).map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const isInRange = isDateInRange(date);
                const isSelected = isDateSelected(date);

                return (
                  <button
                    key={index}
                    className={`day ${!isCurrentMonth ? 'other-month' : ''} 
                               ${isToday ? 'today' : ''} 
                               ${isInRange ? 'in-range' : ''} 
                               ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleDateClick(date)}
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
              <button 
                className="clear-button" 
                onClick={clearDates}
                type="button"
              >
                Limpar
              </button>
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
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;