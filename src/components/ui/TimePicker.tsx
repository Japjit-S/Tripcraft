"use client";

import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value: string; // Format: "hh:mm A" (e.g., "10:30 AM") or 24h "HH:mm". We'll manage internally as AM/PM.
  onChange: (time: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value or default to 10:00 AM
  let initHour = '10';
  let initMinute = '00';
  let initPeriod = 'AM';

  if (value) {
    // Basic parse assuming "HH:mm AM" or "HH:mm"
    const isAmPm = value.toLowerCase().includes('m');
    if (isAmPm) {
      const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        initHour = String(parseInt(match[1])).padStart(2, '0');
        initMinute = match[2];
        initPeriod = match[3].toUpperCase();
      }
    } else {
      const [h, m] = value.split(':');
      if (h && m) {
        let hourNum = parseInt(h);
        initPeriod = hourNum >= 12 ? 'PM' : 'AM';
        if (hourNum === 0) hourNum = 12;
        if (hourNum > 12) hourNum -= 12;
        initHour = String(hourNum).padStart(2, '0');
        initMinute = m;
      }
    }
  } else {
    // Default when empty
    initHour = '10';
    initMinute = '00';
    initPeriod = 'AM';
  }

  const [hour, setHour] = useState(initHour);
  const [minute, setMinute] = useState(initMinute);
  const [period, setPeriod] = useState(initPeriod);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync internal state to external when it changes (only if it was already set, or user interacts)
  const handleTimeChange = (newHour: string, newMin: string, newPeriod: string) => {
    setHour(newHour);
    setMinute(newMin);
    setPeriod(newPeriod);
    onChange(`${newHour}:${newMin} ${newPeriod}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-12 pr-4 py-4 bg-[var(--color-tc-parchment)] rounded-2xl cursor-pointer hover:bg-[var(--color-tc-parchment)]/80 border border-[var(--color-tc-sage)]/60 transition-all flex items-center min-h-[56px] h-full"
      >
        <Clock className="absolute left-4 h-5 w-5 text-[var(--color-tc-ink)]/50" />
        <span className={`font-bold ${value ? 'text-[var(--color-tc-ink)]' : 'text-[var(--color-tc-ink)]/40 font-normal'}`}>
          {value || 'Select Time'}
        </span>
      </div>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-[var(--color-tc-cream)] rounded-2xl shadow-xl border-2 border-[var(--color-tc-sage)]/60 z-50 flex overflow-hidden animate-in fade-in zoom-in-95 duration-150 h-56 w-[260px]">
          
          {/* Hours Column */}
          <div className="flex-1 overflow-y-auto no-scrollbar border-r border-[var(--color-tc-sage)]/40 p-2 scroll-smooth">
            <div className="text-[10px] font-black text-[var(--color-tc-ink)]/60 uppercase tracking-widest text-center mb-2">Hour</div>
            <div className="space-y-1">
              {hours.map(h => (
                <button
                  key={`h-${h}`}
                  type="button"
                  onClick={() => handleTimeChange(h, minute, period)}
                  className={`w-full py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    hour === h ? 'bg-[var(--color-tc-ink)] text-white shadow-xs' : 'text-[var(--color-tc-ink)]/80 hover:bg-[var(--color-tc-sage)]/25 hover:text-[var(--color-tc-ink)]'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Minutes Column */}
          <div className="flex-1 overflow-y-auto no-scrollbar border-r border-[var(--color-tc-sage)]/40 p-2 scroll-smooth">
            <div className="text-[10px] font-black text-[var(--color-tc-ink)]/60 uppercase tracking-widest text-center mb-2">Min</div>
            <div className="space-y-1">
              {minutes.map(m => (
                <button
                  key={`m-${m}`}
                  type="button"
                  onClick={() => handleTimeChange(hour, m, period)}
                  className={`w-full py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    minute === m ? 'bg-[var(--color-tc-ink)] text-white shadow-xs' : 'text-[var(--color-tc-ink)]/80 hover:bg-[var(--color-tc-sage)]/25 hover:text-[var(--color-tc-ink)]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* AM/PM Column */}
          <div className="flex-1 p-2 flex flex-col gap-2 pt-8 bg-[var(--color-tc-parchment)]/60">
            <button
              type="button"
              onClick={() => handleTimeChange(hour, minute, 'AM')}
              className={`w-full py-3 rounded-xl text-sm font-black transition-colors cursor-pointer ${
                period === 'AM' ? 'bg-[var(--color-tc-ink)] text-white shadow-md shadow-[var(--color-tc-ink)]/20' : 'bg-[var(--color-tc-cream)] text-[var(--color-tc-ink)]/70 hover:bg-[var(--color-tc-sage)]/20 border border-[var(--color-tc-sage)]/50 hover:text-[var(--color-tc-ink)]'
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => handleTimeChange(hour, minute, 'PM')}
              className={`w-full py-3 rounded-xl text-sm font-black transition-colors cursor-pointer ${
                period === 'PM' ? 'bg-[var(--color-tc-ink)] text-white shadow-md shadow-[var(--color-tc-ink)]/20' : 'bg-[var(--color-tc-cream)] text-[var(--color-tc-ink)]/70 hover:bg-[var(--color-tc-sage)]/20 border border-[var(--color-tc-sage)]/50 hover:text-[var(--color-tc-ink)]'
              }`}
            >
              PM
            </button>
          </div>

        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
