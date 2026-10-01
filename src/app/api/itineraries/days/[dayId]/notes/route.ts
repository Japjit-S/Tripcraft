import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getDayNotesFromDb, saveDayNoteToDb } from '@/lib/supabase/itineraryRepo';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dayId: string }> }
) {
  const { dayId } = await params;

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

  try {
    const body = await req.json();
    const content = (body.content || '').trim();

    if (!content) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
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
