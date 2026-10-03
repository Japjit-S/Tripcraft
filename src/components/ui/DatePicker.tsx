"use client";

import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track current month being viewed (defaults to selected date or current month)
  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDate = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    onChange(`${viewYear}-${formattedMonth}-${formattedDay}`);
    setIsOpen(false);
  };

  // Generate calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  // 0 = Sunday, 1 = Monday. We want Monday = 0
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const grid = [];
  for (let i = 0; i < offset; i++) {
    grid.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push(i);
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Formatting selected value for display
  let displayValue = 'Select Date';
  if (value) {
    const [y, m, d] = value.split('-');
    if (y && m && d) {
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      displayValue = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-12 pr-4 py-4 bg-[var(--color-tc-parchment)] rounded-2xl cursor-pointer hover:bg-[var(--color-tc-parchment)]/80 border border-[var(--color-tc-sage)]/60 transition-all flex items-center min-h-[56px]"
      >
        <CalendarIcon className="absolute left-4 h-5 w-5 text-[var(--color-tc-ink)]/50" />
        <span className={`font-bold ${value ? 'text-[var(--color-tc-ink)]' : 'text-[var(--color-tc-ink)]/40 font-normal'}`}>
          {displayValue}
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-[var(--color-tc-cream)] rounded-2xl shadow-xl border-2 border-[var(--color-tc-sage)]/60 z-50 w-72 animate-in fade-in zoom-in-95 duration-150">
          
          <div className="flex justify-between items-center mb-4">
            <button 
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-tc-sage)]/20 text-[var(--color-tc-ink)]/70 hover:text-[var(--color-tc-ink)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="font-bold font-serif text-[var(--color-tc-ink)]">
              {monthNames[viewMonth]} {viewYear}
            </div>
            <button 
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-tc-sage)]/20 text-[var(--color-tc-ink)]/70 hover:text-[var(--color-tc-ink)] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <div key={d} className="text-[10px] font-bold text-[var(--color-tc-ink)]/60 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {grid.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="w-8 h-8" />;
              }
              
              const currentDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = value === currentDateStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  className={`w-8 h-8 mx-auto rounded-full text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-[var(--color-tc-ink)] text-white shadow-md scale-110' 
                      : 'text-[var(--color-tc-ink)] hover:bg-[var(--color-tc-sage)]/30 hover:text-[var(--color-tc-ink)]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
