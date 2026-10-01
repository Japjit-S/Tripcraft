import { SupabaseClient } from '@supabase/supabase-js';
import { GeneratedTrip } from '../tripStore';
import { ItineraryItem, TripDay } from '../types';

export interface DbDayNote {
  id: string;
  dayId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Saves a GeneratedTrip to PostgreSQL via Supabase with complete relational hierarchy.
 */
export async function saveItineraryToDb(
  supabase: SupabaseClient,
  userId: string,
  trip: GeneratedTrip
): Promise<GeneratedTrip> {
  const destId = trip.destinationId || `dest:${trip.destination.toLowerCase().replace(/\s+/g, '-')}`;

  // 1. Upsert Destination
  await supabase.from('destinations').upsert(
    {
      id: destId,
      city: trip.destination,
      country: trip.destinationCountry || 'Unknown',
      country_code: trip.destinationCountryCode || null,
      admin1: trip.destinationAdmin1 || null,
      latitude: trip.destinationCoords?.lat ?? 0,
      longitude: trip.destinationCoords?.lon ?? 0,
    },
    { onConflict: 'id' }
  );

  // 2. Insert Itinerary header
  const { data: itineraryRow, error: itinErr } = await supabase
    .from('itineraries')
    .insert({
      user_id: userId,
      destination_id: destId,
      persona: trip.persona,
      start_date: trip.startDate,
      days: trip.days,
      origin_city: trip.originCity || '',
      arrival_mode: trip.arrivalMode || 'flight',
      arrival_at: trip.arrivalAt || trip.arrivalTime || '10:00 AM',
      feasibility_status: trip.feasibilityStatus || 'PASSED',
      warnings: trip.warnings || [],
      audit_log: trip.auditLog || [],
    })
    .select('id, created_at')
    .single();

  if (itinErr || !itineraryRow) {
    throw new Error(`Failed to save itinerary header: ${itinErr?.message}`);
  }

  const savedItineraryId = itineraryRow.id as string;
  const savedDays: TripDay[] = [];

  // 3. Insert Days and Items
  for (const day of trip.itineraryDays) {
    const { data: dayRow, error: dayErr } = await supabase
      .from('itinerary_days')
      .insert({
        itinerary_id: savedItineraryId,
        day_number: day.dayNumber,
        date: day.date,
        weather_summary: day.weatherSummary,
      })
      .select('id')
      .single();

    if (dayErr || !dayRow) {
      throw new Error(`Failed to save itinerary day ${day.dayNumber}: ${dayErr?.message}`);
    }

    const savedDayId = dayRow.id as string;

    const itemsToInsert: Array<{
      itinerary_day_id: string;
      candidate_id?: string;
      slot: 'MORNING' | 'AFTERNOON' | 'EVENING';
      sort_order: number;
      title: string;
      category: string;
      reason: string;
      indoor: boolean;
      latitude?: number;
      longitude?: number;
      is_flex: boolean;
      flex_reason?: string;
    }> = [];

    const appendItems = (items: ItineraryItem[], slot: 'MORNING' | 'AFTERNOON' | 'EVENING') => {
      items.forEach((item, idx) => {
        itemsToInsert.push({
          itinerary_day_id: savedDayId,
          candidate_id: item.id,
          slot,
          sort_order: idx,
          title: item.title,
          category: item.category,
          reason: item.reason,
          indoor: Boolean(item.indoor),
          latitude: item.coords?.lat,
          longitude: item.coords?.lon,
          is_flex: Boolean(item.isFlex),
          flex_reason: item.flexReason,
        });
      });
    };

    appendItems(day.morning, 'MORNING');
    appendItems(day.afternoon, 'AFTERNOON');
    appendItems(day.evening, 'EVENING');

    if (itemsToInsert.length > 0) {
      const { error: itemsErr } = await supabase.from('itinerary_items').insert(itemsToInsert);
      if (itemsErr) {
        throw new Error(`Failed to save items for day ${day.dayNumber}: ${itemsErr.message}`);
      }
    }

    savedDays.push({
      ...day,
      id: savedDayId,
    });
  }

  return {
    ...trip,
    id: savedItineraryId,
    itineraryDays: savedDays,
  };
}

/**
 * Retrieves all saved itineraries for an authenticated user with full relational data.
 */
export async function getUserItinerariesFromDb(
  supabase: SupabaseClient,
  userId: string
): Promise<GeneratedTrip[]> {
  const { data: itineraries, error } = await supabase
    .from('itineraries')
    .select(`
      id,
      persona,
      start_date,
      days,
      origin_city,
      arrival_mode,
      arrival_at,
      feasibility_status,
      warnings,
      audit_log,
      destinations (
        id,
        city,
        country,
        country_code,
        admin1,
        latitude,
        longitude
      ),
      itinerary_days (
        id,
        day_number,
        date,
        weather_summary,
        itinerary_items (
          id,
          candidate_id,
          slot,
          sort_order,
          title,
          category,
          reason,
          indoor,
          latitude,
          longitude,
          is_flex,
          flex_reason
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !itineraries) {
    return [];
  }

  return itineraries.map((row: any): GeneratedTrip => {
    const dest = row.destinations || {};
    const daysRaw = (row.itinerary_days || []).sort(
      (a: any, b: any) => a.day_number - b.day_number
    );

    const itineraryDays: TripDay[] = daysRaw.map((d: any) => {
      const itemsRaw = (d.itinerary_items || []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order
      );

      const morning: ItineraryItem[] = [];
      const afternoon: ItineraryItem[] = [];
      const evening: ItineraryItem[] = [];

      for (const item of itemsRaw) {
        const mapped: ItineraryItem = {
          id: item.candidate_id || item.id,
          title: item.title,
          category: item.category,
          reason: item.reason,
          indoor: Boolean(item.indoor),
          coords:
            item.latitude && item.longitude
              ? { lat: item.latitude, lon: item.longitude }
              : undefined,
          isFlex: item.is_flex,
          flexReason: item.flex_reason,
        };

        if (item.slot === 'MORNING') morning.push(mapped);
        else if (item.slot === 'AFTERNOON') afternoon.push(mapped);
        else evening.push(mapped);
      }

      return {
        id: d.id,
        dayNumber: d.day_number,
        date: d.date,
        weatherSummary: d.weather_summary,
        morning,
        afternoon,
        evening,
      };
    });

    return {
      id: row.id,
      destination: dest.city || 'Destination',
      destinationId: dest.id,
      destinationCountry: dest.country,
      destinationCountryCode: dest.country_code,
      destinationAdmin1: dest.admin1,
      destinationCoords:
        dest.latitude && dest.longitude
          ? { lat: dest.latitude, lon: dest.longitude }
          : undefined,
      persona: row.persona,
      startDate: row.start_date,
      days: row.days,
      originCity: row.origin_city,
      arrivalMode: row.arrival_mode,
      arrivalAt: row.arrival_at,
      arrivalTime: row.arrival_at,
      itineraryDays,
      warnings: row.warnings || [],
      auditLog: row.audit_log || [],
      feasibilityStatus: row.feasibility_status,
    };
  });
}

/**
 * Retrieves a single itinerary by ID for the authenticated user.
 */
export async function getItineraryByIdFromDb(
  supabase: SupabaseClient,
  tripId: string
): Promise<GeneratedTrip | null> {
  const { data: row, error } = await supabase
    .from('itineraries')
    .select(`
      id,
      persona,
      start_date,
      days,
      origin_city,
      arrival_mode,
      arrival_at,
      feasibility_status,
      warnings,
      audit_log,
      destinations (
        id,
        city,
        country,
        country_code,
        admin1,
        latitude,
        longitude
      ),
      itinerary_days (
        id,
        day_number,
        date,
        weather_summary,
        itinerary_items (
          id,
          candidate_id,
          slot,
          sort_order,
          title,
          category,
          reason,
          indoor,
          latitude,
          longitude,
          is_flex,
          flex_reason
        )
      )
    `)
    .eq('id', tripId)
    .single();

  if (error || !row) {
    return null;
  }

  const dest = (row as any).destinations || {};
  const daysRaw = ((row as any).itinerary_days || []).sort(
    (a: any, b: any) => a.day_number - b.day_number
  );

  const itineraryDays: TripDay[] = daysRaw.map((d: any) => {
    const itemsRaw = (d.itinerary_items || []).sort(
      (a: any, b: any) => a.sort_order - b.sort_order
    );

    const morning: ItineraryItem[] = [];
    const afternoon: ItineraryItem[] = [];
    const evening: ItineraryItem[] = [];

    for (const item of itemsRaw) {
      const mapped: ItineraryItem = {
        id: item.candidate_id || item.id,
        title: item.title,
        category: item.category,
        reason: item.reason,
        indoor: Boolean(item.indoor),
        coords:
          item.latitude && item.longitude
            ? { lat: item.latitude, lon: item.longitude }
            : undefined,
        isFlex: item.is_flex,
        flexReason: item.flex_reason,
      };

      if (item.slot === 'MORNING') morning.push(mapped);
      else if (item.slot === 'AFTERNOON') afternoon.push(mapped);
      else evening.push(mapped);
    }

    return {
      id: d.id,
      dayNumber: d.day_number,
      date: d.date,
      weatherSummary: d.weather_summary,
      morning,
      afternoon,
      evening,
    };
  });

  return {
    id: (row as any).id,
    destination: dest.city || 'Destination',
    destinationId: dest.id,
    destinationCountry: dest.country,
    destinationCountryCode: dest.country_code,
    destinationAdmin1: dest.admin1,
    destinationCoords:
      dest.latitude && dest.longitude
        ? { lat: dest.latitude, lon: dest.longitude }
        : undefined,
    persona: (row as any).persona,
    startDate: (row as any).start_date,
    days: (row as any).days,
    originCity: (row as any).origin_city,
    arrivalMode: (row as any).arrival_mode,
    arrivalAt: (row as any).arrival_at,
    arrivalTime: (row as any).arrival_at,
    itineraryDays,
    warnings: (row as any).warnings || [],
    auditLog: (row as any).audit_log || [],
    feasibilityStatus: (row as any).feasibility_status,
  };
}

/**
 * Deletes an itinerary by ID (cascades to days, items, and notes).
 */
export async function deleteItineraryFromDb(
  supabase: SupabaseClient,
  tripId: string
): Promise<boolean> {
  const { error } = await supabase.from('itineraries').delete().eq('id', tripId);
  return !error;
}

/**
 * Creates or appends a note for an itinerary day.
 */
export async function saveDayNoteToDb(
  supabase: SupabaseClient,
  dayId: string,
  content: string
): Promise<DbDayNote> {
  const { data, error } = await supabase
    .from('itinerary_day_notes')
    .insert({
      itinerary_day_id: dayId,
      content,
    })
    .select('id, itinerary_day_id, content, created_at, updated_at')
    .single();

  if (error || !data) {
    throw new Error(`Failed to save day note: ${error?.message}`);
  }

  return {
    id: data.id,
    dayId: data.itinerary_day_id,
    content: data.content,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Gets all notes for a specific day.
 */
export async function getDayNotesFromDb(
  supabase: SupabaseClient,
  dayId: string
): Promise<DbDayNote[]> {
  const { data, error } = await supabase
    .from('itinerary_day_notes')
    .select('id, itinerary_day_id, content, created_at, updated_at')
    .eq('itinerary_day_id', dayId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id,
    dayId: d.itinerary_day_id,
    content: d.content,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }));
}
