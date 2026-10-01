import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getUserItinerariesFromDb, saveItineraryToDb } from '@/lib/supabase/itineraryRepo';
import { GeneratedTrip } from '@/lib/tripStore';

const VALID_PERSONAS = new Set(['Backpacker', 'Culture Seeker', 'Comfort Traveller', 'Family']);
const MAX_PAYLOAD_BYTES = 128 * 1024; // 128KB upper bound for serialized itinerary

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

  try {
    const itineraries = await getUserItinerariesFromDb(supabase, user.id);
    return NextResponse.json({ itineraries, supabaseConfigured: true });
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve itineraries' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rawText = await req.text();
    if (new TextEncoder().encode(rawText).length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: 'Payload too large (max 128KB)' }, { status: 413 });
    }

    let body: { trip?: unknown };
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const trip = body.trip as GeneratedTrip | undefined;

    if (!trip || typeof trip !== 'object') {
      return NextResponse.json({ error: 'Missing trip in request body' }, { status: 400 });
    }

    if (!trip.destination || typeof trip.destination !== 'string' || trip.destination.length > 100) {
      return NextResponse.json({ error: 'Invalid or missing destination' }, { status: 400 });
    }

    if (!VALID_PERSONAS.has(trip.persona)) {
      return NextResponse.json({ error: 'Invalid persona' }, { status: 400 });
    }

    if (!Number.isInteger(trip.days) || trip.days < 1 || trip.days > 7) {
      return NextResponse.json({ error: 'Days must be an integer between 1 and 7' }, { status: 400 });
    }

    if (!trip.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(trip.startDate)) {
      return NextResponse.json({ error: 'Invalid start date format (expected YYYY-MM-DD)' }, { status: 400 });
    }

    if (!Array.isArray(trip.itineraryDays) || trip.itineraryDays.length === 0) {
      return NextResponse.json({ error: 'Itinerary days array cannot be empty' }, { status: 400 });
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
        message: 'Saved locally (Database client unavailable)',
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
