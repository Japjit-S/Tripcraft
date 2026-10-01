import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getUserItinerariesFromDb, saveItineraryToDb } from '@/lib/supabase/itineraryRepo';
import { GeneratedTrip } from '@/lib/tripStore';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ itineraries: [], supabaseConfigured: false });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ itineraries: [], supabaseConfigured: false });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const itineraries = await getUserItinerariesFromDb(supabase, user.id);
  return NextResponse.json({ itineraries, supabaseConfigured: true });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const trip = body.trip as GeneratedTrip;

    if (!trip || !trip.destination || !trip.itineraryDays) {
      return NextResponse.json(
        { error: 'Invalid trip payload' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        savedToDb: false,
        trip,
        message: 'Saved locally (Supabase not configured)',
      });
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        savedToDb: false,
        trip,
      });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        success: true,
        savedToDb: false,
        trip,
        message: 'Saved locally (User not authenticated in Supabase)',
      });
    }

    const saved = await saveItineraryToDb(supabase, user.id, trip);
    return NextResponse.json({
      success: true,
      savedToDb: true,
      trip: saved,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save itinerary';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
