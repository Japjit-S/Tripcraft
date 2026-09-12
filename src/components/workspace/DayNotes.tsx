"use client";

interface DayNotesProps {
  dayId: string;
}

export default function DayNotes({ dayId }: DayNotesProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-100 p-6 flex items-center justify-center">
      <p className="text-sm font-medium text-slate-400 italic">
        No note as of now
      </p>
    </div>
  );
}
