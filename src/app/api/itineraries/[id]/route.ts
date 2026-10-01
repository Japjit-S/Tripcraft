import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { deleteItineraryFromDb, getItineraryByIdFromDb } from '@/lib/supabase/itineraryRepo';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 404 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase unavailable' }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!id || typeof id !== 'string' || id.length > 100) {
    return NextResponse.json({ error: 'Invalid itinerary identifier' }, { status: 400 });
  }

  const itinerary = await getItineraryByIdFromDb(supabase, id, user.id);
  if (!itinerary) {
    return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
  }

  return NextResponse.json({ itinerary });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== 'string' || id.length > 100) {
    return NextResponse.json({ error: 'Invalid itinerary identifier' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 404 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase unavailable' }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deleted = await deleteItineraryFromDb(supabase, id, user.id);
  return NextResponse.json({ success: deleted });
}
