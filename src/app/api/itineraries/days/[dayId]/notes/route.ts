import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { deleteDayNoteFromDb, getDayNotesFromDb, saveDayNoteToDb } from '@/lib/supabase/itineraryRepo';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dayId: string }> }
) {
  const { dayId } = await params;

  if (!dayId || typeof dayId !== 'string' || dayId.length > 100) {
    return NextResponse.json({ error: 'Invalid day identifier' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ notes: [] });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ notes: [] });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notes = await getDayNotesFromDb(supabase, dayId);
  return NextResponse.json({ notes });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ dayId: string }> }
) {
  const { dayId } = await params;

  if (!dayId || typeof dayId !== 'string' || dayId.length > 100) {
    return NextResponse.json({ error: 'Invalid day identifier' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    if (!content) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Note content exceeds 2,000 characters limit' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        note: {
          id: `local-note-${Date.now()}`,
          dayId,
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const note = await saveDayNoteToDb(supabase, dayId, content);
    return NextResponse.json({ note });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ dayId: string }> }
) {
  const { dayId } = await params;

  if (!dayId || typeof dayId !== 'string' || dayId.length > 100) {
    return NextResponse.json({ error: 'Invalid day identifier' }, { status: 400 });
  }

  try {
    const url = new URL(req.url);
    let noteId = url.searchParams.get('noteId');

    if (!noteId) {
      try {
        const body = await req.json();
        if (body && typeof body.noteId === 'string') {
          noteId = body.noteId;
        }
      } catch {
        // query param was empty, json parse may fail if no body provided
      }
    }

    if (!noteId || noteId.length > 100) {
      return NextResponse.json({ error: 'Missing or invalid note identifier' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, localOnly: true });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deleted = await deleteDayNoteFromDb(supabase, noteId);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
