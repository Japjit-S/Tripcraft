"use client";

import { useState } from 'react';
import { AuditEntry } from '@/lib/types/engine';
import {
  X,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

interface DecisionLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  auditLog: AuditEntry[];
  totalDays: number;
}

export default function DecisionLogDrawer({
  isOpen,
  onClose,
  auditLog = [],
  totalDays = 3,
}: DecisionLogDrawerProps) {
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedVerdict, setSelectedVerdict] = useState<string>('ALL');

  if (!isOpen) return null;

  // Filtering
  const filteredEntries = auditLog.filter((entry) => {
    if (selectedDay !== 'ALL' && entry.dayNumber !== selectedDay) return false;
    if (selectedStage !== 'ALL' && entry.stage !== selectedStage) return false;
    if (selectedVerdict !== 'ALL' && entry.verdict !== selectedVerdict) return false;
    return true;
  });

  // Statistics
  const totalSelected = auditLog.filter((e) => e.verdict === 'SELECTED').length;
  const totalRemoved = auditLog.filter((e) => e.verdict === 'REMOVED').length;
  const totalDegraded = auditLog.filter((e) => e.stage === 'DEGRADATION').length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--color-tc-ink)]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-[var(--color-tc-cream)] shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-6 lg:p-8 border-b border-[var(--color-tc-sage)]/50 bg-[var(--color-tc-parchment)]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--color-tc-ink)] text-[var(--color-tc-ink)] flex items-center justify-center shadow-[4px_4px_0px_rgba(23,60,57,0.15)] shadow-[#1d6b8f]/20">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-serif text-[var(--color-tc-ink)] tracking-tight">
                  Decision Log Drawer
                </h2>
                <p className="text-xs text-[var(--color-tc-ink)]/60 font-medium">
                  Deterministic rules engine audit trail & score breakdowns
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[var(--color-tc-cream)] text-[var(--color-tc-ink)]/50 hover:text-[var(--color-tc-ink)] flex items-center justify-center shadow-[2px_2px_0px_rgba(23,60,57,0.1)] transition-all hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-[var(--color-tc-cream)] p-3 rounded-2xl border border-[var(--color-tc-sage)]/50 shadow-[2px_2px_0px_rgba(23,60,57,0.1)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-tc-ink)]/50">
                Selected
              </p>
              <p className="text-xl font-bold font-serif text-[var(--color-tc-teal)] flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
                {totalSelected}
              </p>
            </div>
            <div className="bg-[var(--color-tc-cream)] p-3 rounded-2xl border border-[var(--color-tc-sage)]/50 shadow-[2px_2px_0px_rgba(23,60,57,0.1)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-tc-ink)]/50">
                Filtered Out
              </p>
              <p className="text-xl font-bold font-serif text-[#7F1D1D] flex items-center gap-1.5 mt-0.5">
                <XCircle className="w-4 h-4" />
                {totalRemoved}
              </p>
            </div>
            <div className="bg-[var(--color-tc-cream)] p-3 rounded-2xl border border-[var(--color-tc-sage)]/50 shadow-[2px_2px_0px_rgba(23,60,57,0.1)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-tc-ink)]/50">
                FLEX Degraded
              </p>
              <p className="text-xl font-bold font-serif text-[var(--color-tc-saffron)] flex items-center gap-1.5 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
                {totalDegraded}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 px-6 lg:px-8 bg-[var(--color-tc-cream)] border-b border-[var(--color-tc-sage)]/50 flex flex-wrap gap-3 items-center text-xs">
          <div className="flex items-center gap-1 text-[var(--color-tc-ink)]/50 font-bold uppercase tracking-wider text-[10px]">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>

          {/* Day Filter */}
          <select
            value={selectedDay}
            onChange={(e) =>
              setSelectedDay(
                e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
              )
            }
            className="px-3 py-1.5 bg-[var(--color-tc-parchment)] text-[var(--color-tc-ink)] font-bold rounded-xl border border-[var(--color-tc-sage)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-tc-teal)]/30"
          >
            <option value="ALL">All Days</option>
            {Array.from({ length: totalDays }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Day {i + 1}
              </option>
            ))}
          </select>

          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-1.5 bg-[var(--color-tc-parchment)] text-[var(--color-tc-ink)] font-bold rounded-xl border border-[var(--color-tc-sage)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-tc-teal)]/30"
          >
            <option value="ALL">All Stages</option>
            <option value="WEATHER_FILTER">Weather Gate</option>
            <option value="ARRIVAL_GATE">Arrival Gate</option>
            <option value="HOURS_FILTER">Opening Hours</option>
            <option value="ALLOCATION">Allocation</option>
            <option value="DEGRADATION">Degradation</option>
            <option value="FEASIBILITY">Feasibility</option>
          </select>

          {/* Verdict Filter */}
          <select
            value={selectedVerdict}
            onChange={(e) => setSelectedVerdict(e.target.value)}
            className="px-3 py-1.5 bg-[var(--color-tc-parchment)] text-[var(--color-tc-ink)] font-bold rounded-xl border border-[var(--color-tc-sage)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-tc-teal)]/30"
          >
            <option value="ALL">All Verdicts</option>
            <option value="SELECTED">Selected</option>
            <option value="REMOVED">Removed</option>
            <option value="KEPT">Kept</option>
          </select>

          <span className="ml-auto text-[var(--color-tc-ink)]/50 font-medium">
            Showing <strong className="text-[var(--color-tc-ink)]">{filteredEntries.length}</strong> of{' '}
            {auditLog.length} events
          </span>
        </div>

        {/* Audit Log Entries Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-4 bg-[var(--color-tc-parchment)]/50">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-16 text-[var(--color-tc-ink)]/50">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-bold text-sm">No decisions match active filter criteria.</p>
            </div>
          ) : (
            filteredEntries.map((entry, idx) => {
              const isSelected = entry.verdict === 'SELECTED';
              const isRemoved = entry.verdict === 'REMOVED';
              const isDegradation = entry.stage === 'DEGRADATION';

              return (
                <div
                  key={`${entry.candidateId}-${idx}`}
                  className="bg-[var(--color-tc-cream)] p-5 rounded-2xl border border-[var(--color-tc-sage)]/50 shadow-[2px_2px_0px_rgba(23,60,57,0.1)] transition-all hover:shadow-[4px_4px_0px_rgba(23,60,57,0.15)]"
                >
                  {/* Top line: Day, Stage, Verdict, Rule */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-serif uppercase tracking-wider px-2.5 py-1 bg-[var(--color-tc-parchment)] text-[var(--color-tc-ink)] rounded-lg">
                        Day {entry.dayNumber}
                      </span>
                      <span className="text-[10px] font-bold font-serif uppercase tracking-wider px-2.5 py-1 bg-blue-50 text-[var(--color-tc-tangerine)] rounded-lg">
                        {entry.stage}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[var(--color-tc-ink)]/50">
                        [{entry.ruleId}]
                      </span>
                    </div>

                    <div>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold font-serif text-[var(--color-tc-teal)] bg-[var(--color-tc-teal)]/10 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          SELECTED
                        </span>
                      )}
                      {isRemoved && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold font-serif text-[#7F1D1D] bg-[#FEF2F2] px-2.5 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" />
                          REMOVED
                        </span>
                      )}
                      {isDegradation && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold font-serif text-[var(--color-tc-saffron)] bg-[var(--color-tc-saffron)]/10 px-2.5 py-1 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          FLEX BLOCK
                        </span>
                      )}
                      {!isSelected && !isRemoved && !isDegradation && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold font-serif text-[var(--color-tc-ink)] bg-[var(--color-tc-parchment)] px-2.5 py-1 rounded-full">
                          <Info className="w-3.5 h-3.5" />
                          {entry.verdict}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Reason */}
                  <h4 className="text-base font-bold font-serif text-[var(--color-tc-ink)] mb-1">
                    {entry.candidateTitle}
                  </h4>
                  <p className="text-xs text-[var(--color-tc-ink)]/80 leading-relaxed font-medium">
                    {entry.reason}
                  </p>

                  {/* Score Breakdown (Transparent Explanations) */}
                  {entry.scoreBreakdown && (
                    <div className="mt-4 pt-3 border-t border-[var(--color-tc-sage)]/50">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-tc-ink)]/50 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--color-tc-tangerine)]" />
                        Score Breakdown (Total: {entry.scoreBreakdown.total})
                      </p>
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--color-tc-parchment)] text-[var(--color-tc-ink)]/80">
                          Prominence: +{entry.scoreBreakdown.prominence}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                          Persona: +{entry.scoreBreakdown.personaAffinity}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700">
                          Weather: +{entry.scoreBreakdown.weatherFit}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[var(--color-tc-ink)]">
                          Slot: +{entry.scoreBreakdown.slotFit}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-[var(--color-tc-ink)]">
                          Proximity: +{entry.scoreBreakdown.proximityToDayAnchor}
                        </span>
                        {entry.scoreBreakdown.categoryRepetition > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-[var(--color-tc-tangerine)]/10 text-[var(--color-tc-tangerine)]">
                            Repeat Penalty: -{entry.scoreBreakdown.categoryRepetition}
                          </span>
                        )}
                        {entry.scoreBreakdown.fatigueCost > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FEF2F2] text-[#7F1D1D]">
                            Fatigue Penalty: -{entry.scoreBreakdown.fatigueCost}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
