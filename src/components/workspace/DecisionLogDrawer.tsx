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
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-6 lg:p-8 border-b border-slate-100 bg-[#f8f9fc]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1d6b8f] text-white flex items-center justify-center shadow-md shadow-[#1d6b8f]/20">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Decision Log Drawer
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Deterministic rules engine audit trail & score breakdowns
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center shadow-sm transition-all hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Selected
              </p>
              <p className="text-xl font-black text-emerald-600 flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
                {totalSelected}
              </p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Filtered Out
              </p>
              <p className="text-xl font-black text-rose-600 flex items-center gap-1.5 mt-0.5">
                <XCircle className="w-4 h-4" />
                {totalRemoved}
              </p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                FLEX Degraded
              </p>
              <p className="text-xl font-black text-amber-600 flex items-center gap-1.5 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
                {totalDegraded}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 px-6 lg:px-8 bg-white border-b border-slate-100 flex flex-wrap gap-3 items-center text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
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
            className="px-3 py-1.5 bg-[#f8f9fc] text-slate-700 font-bold rounded-xl border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-[#1d6b8f]/30"
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
            className="px-3 py-1.5 bg-[#f8f9fc] text-slate-700 font-bold rounded-xl border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-[#1d6b8f]/30"
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
            className="px-3 py-1.5 bg-[#f8f9fc] text-slate-700 font-bold rounded-xl border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-[#1d6b8f]/30"
          >
            <option value="ALL">All Verdicts</option>
            <option value="SELECTED">Selected</option>
            <option value="REMOVED">Removed</option>
            <option value="KEPT">Kept</option>
          </select>

          <span className="ml-auto text-slate-400 font-medium">
            Showing <strong className="text-slate-800">{filteredEntries.length}</strong> of{' '}
            {auditLog.length} events
          </span>
        </div>

        {/* Audit Log Entries Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-4 bg-[#f8f9fc]/50">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
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
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md"
                >
                  {/* Top line: Day, Stage, Verdict, Rule */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                        Day {entry.dayNumber}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-blue-50 text-[#1d6b8f] rounded-lg">
                        {entry.stage}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        [{entry.ruleId}]
                      </span>
                    </div>

                    <div>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          SELECTED
                        </span>
                      )}
                      {isRemoved && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" />
                          REMOVED
                        </span>
                      )}
                      {isDegradation && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          FLEX BLOCK
                        </span>
                      )}
                      {!isSelected && !isRemoved && !isDegradation && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                          <Info className="w-3.5 h-3.5" />
                          {entry.verdict}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Reason */}
                  <h4 className="text-base font-black text-slate-900 mb-1">
                    {entry.candidateTitle}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {entry.reason}
                  </p>

                  {/* Score Breakdown (Transparent Explanations) */}
                  {entry.scoreBreakdown && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#1d6b8f]" />
                        Score Breakdown (Total: {entry.scoreBreakdown.total})
                      </p>
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600">
                          Prominence: +{entry.scoreBreakdown.prominence}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                          Persona: +{entry.scoreBreakdown.personaAffinity}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700">
                          Weather: +{entry.scoreBreakdown.weatherFit}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                          Slot: +{entry.scoreBreakdown.slotFit}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                          Proximity: +{entry.scoreBreakdown.proximityToDayAnchor}
                        </span>
                        {entry.scoreBreakdown.categoryRepetition > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700">
                            Repeat Penalty: -{entry.scoreBreakdown.categoryRepetition}
                          </span>
                        )}
                        {entry.scoreBreakdown.fatigueCost > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700">
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
