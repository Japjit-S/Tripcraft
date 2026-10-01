"use client";

import React, { useState, useEffect } from 'react';
import { Plus, StickyNote, Loader2, Trash2 } from 'lucide-react';

interface NoteItem {
  id: string;
  dayId: string;
  content: string;
  createdAt: string;
}

interface DayNotesProps {
  dayId: string;
}

export default function DayNotes({ dayId }: DayNotesProps) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadNotes() {
      setLoading(true);
      try {
        const res = await fetch(`/api/itineraries/days/${encodeURIComponent(dayId)}/notes`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.notes && data.notes.length > 0) {
            setNotes(data.notes);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fall back to localStorage
      }

      if (typeof window !== 'undefined') {
        try {
          const local = localStorage.getItem(`tripcraft_day_notes_${dayId}`);
          if (local && isMounted) {
            setNotes(JSON.parse(local));
          }
        } catch {
          // ignore
        }
      }
      if (isMounted) setLoading(false);
    }

    loadNotes();
    return () => {
      isMounted = false;
    };
  }, [dayId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newNote.trim();
    if (!content) return;

    setSaving(true);
    const tempNote: NoteItem = {
      id: `note-${Date.now()}`,
      dayId,
      content,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      const res = await fetch(`/api/itineraries/days/${encodeURIComponent(dayId)}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          tempNote.id = data.note.id;
          tempNote.createdAt = new Date(data.note.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
    } catch {
      // Local fallback
    }

    const updated = [...notes, tempNote];
    setNotes(updated);
    setNewNote('');
    setSaving(false);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`tripcraft_day_notes_${dayId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`tripcraft_day_notes_${dayId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    try {
      await fetch(
        `/api/itineraries/days/${encodeURIComponent(dayId)}/notes?noteId=${encodeURIComponent(noteId)}`,
        { method: 'DELETE' }
      );
    } catch {
      // server sync failure fallback is handled gracefully
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/70 rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-4 h-4 text-amber-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Day Notes & Reminders
        </h4>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[120px] max-h-[220px]">
        {loading ? (
          <div className="flex items-center justify-center h-full py-6">
            <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex items-center justify-center h-full py-6">
            <p className="text-xs text-slate-400 italic">
              No notes for this day yet. Add key booking codes, tips, or reminders below.
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs text-xs text-slate-700 flex justify-between items-start group"
            >
              <div className="flex-1 pr-2">
                <p className="whitespace-pre-wrap">{note.content}</p>
                <span className="block mt-1 text-[10px] text-slate-400 font-medium">
                  {note.createdAt}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteNote(note.id)}
                className="text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-50 cursor-pointer"
                title="Delete note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAddNote} className="mt-3 pt-3 border-t border-slate-200/60">
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a reminder or note..."
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            disabled={saving}
          />
          <button
            type="submit"
            disabled={saving || !newNote.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Add</span>
          </button>
        </div>
      </form>
    </div>
  );
}
