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

interface DbDestinationRow {
  id?: string;
  city?: string;
  country?: string;
  country_code?: string;
  admin1?: string;
  latitude?: number;
  longitude?: number;
}

interface DbItineraryItemRow {
  id: string;
  candidate_id?: string;
  slot: 'MORNING' | 'AFTERNOON' | 'EVENING';
  sort_order: number;
  title: string;
  category: string;
  reason: string;
  indoor: boolean;
  latitude?: number;
  longitude?: number;
  is_flex?: boolean;
  flex_reason?: string;
  start_time?: string;
  end_time?: string;
  duration_min?: number;
  event_kind?: string;
  linked_expedition_id?: string;
  distance_from_previous_km?: number;
  transit_from_previous_min?: number;
  source?: string;
  is_verified?: boolean;
}

interface DbItineraryDayRow {
  id: string;
  day_number: number;
  date: string;
  weather_summary: string;
  weather_state?: string;
  is_estimated_weather?: boolean;
  weather_source?: 'forecast' | 'historical_estimate' | 'fallback_estimate';
  weather_confidence?: 'high' | 'medium' | 'low';
  weather_resolution?: 'daily' | 'hourly';
  itinerary_items?: DbItineraryItemRow[];
}

interface DbItineraryRow {
  id: string;
  version?: number;
  destination_timezone?: string;
  persona: GeneratedTrip['persona'];
  start_date: string;
  days: number;
  origin_city?: string;
  arrival_mode: GeneratedTrip['arrivalMode'];
  arrival_at: string;
  feasibility_status?: GeneratedTrip['feasibilityStatus'];
  warnings?: string[];
  audit_log?: GeneratedTrip['auditLog'];
  destinations?: DbDestinationRow | null;
  itinerary_days?: DbItineraryDayRow[];
}

interface DbDayNoteRow {
  id: string;
  itinerary_day_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function mapDbRowToGeneratedTrip(row: DbItineraryRow): GeneratedTrip {
  const dest = row.destinations || {};
  const daysRaw = (row.itinerary_days || []).slice().sort(
    (a, b) => a.day_number - b.day_number
  );

  const itineraryDays: TripDay[] = daysRaw.map((d) => {
    const itemsRaw = (d.itinerary_items || []).slice().sort(
      (a, b) => a.sort_order - b.sort_order
    );

    const morning: ItineraryItem[] = [];
    const afternoon: ItineraryItem[] = [];
    const evening: ItineraryItem[] = [];
    const timeline: ItineraryItem[] = [];

    for (const item of itemsRaw) {
      const mapped: ItineraryItem = {
        id: item.candidate_id || item.id,
        title: item.title,
        category: item.category,
        reason: item.reason,
        indoor: Boolean(item.indoor),
        coords:
          item.latitude !== undefined && item.longitude !== undefined
            ? { lat: item.latitude, lon: item.longitude }
            : undefined,
        isFlex: item.is_flex,
        flexReason: item.flex_reason,
        startTime: item.start_time,
        endTime: item.end_time,
        durationMin: item.duration_min,
        eventKind: item.event_kind,
        linkedExpeditionId: item.linked_expedition_id,
        distanceFromPreviousKm: item.distance_from_previous_km,
        transitFromPreviousMin: item.transit_from_previous_min,
        source: item.source,
        isVerified: item.is_verified,
      };

      timeline.push(mapped);

      if (item.slot === 'MORNING') morning.push(mapped);
      else if (item.slot === 'AFTERNOON') afternoon.push(mapped);
      else evening.push(mapped);
    }

    return {
      id: d.id,
      dayNumber: d.day_number,
      date: d.date,
      weatherSummary: d.weather_summary,
      weatherState: d.weather_state,
      isEstimatedWeather: d.is_estimated_weather,
      weatherSource: d.weather_source || (d.is_estimated_weather ? 'historical_estimate' : 'forecast'),
      weatherConfidence: d.weather_confidence || (d.is_estimated_weather ? 'low' : 'high'),
      weatherResolution: d.weather_resolution || 'daily',
      timeline,
      morning,
      afternoon,
      evening,
    };
  });

  return {
    id: row.id,
    version: row.version ?? 2,
    destination: dest.city || 'Destination',
    destinationId: dest.id,
    destinationCountry: dest.country,
    destinationCountryCode: dest.country_code,
    destinationAdmin1: dest.admin1,
    destinationTimezone: row.destination_timezone || 'UTC',
    destinationCoords:
      dest.latitude !== undefined && dest.longitude !== undefined
        ? { lat: dest.latitude, lon: dest.longitude }
        : undefined,
    persona: row.persona,
    startDate: row.start_date,
    days: row.days,
    originCity: row.origin_city || '',
    arrivalMode: row.arrival_mode,
    arrivalAt: row.arrival_at,
    arrivalTime: row.arrival_at,
    itineraryDays,
    warnings: row.warnings || [],
    auditLog: row.audit_log || [],
    feasibilityStatus: row.feasibility_status,
  };
}

/**
 * Saves a GeneratedTrip to PostgreSQL via Supabase with complete relational hierarchy.
 * Enforces atomic rollback: if any day or item fails to insert, the parent itinerary is deleted
 * immediately so that partial, corrupt trips are never persisted.
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
      version: trip.version ?? 2,
      destination_timezone: trip.destinationTimezone || 'UTC',
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

  // 3. Insert Days and Items with Atomic Rollback Guard
  try {
    for (const day of trip.itineraryDays) {
      const { data: dayRow, error: dayErr } = await supabase
        .from('itinerary_days')
        .insert({
          itinerary_id: savedItineraryId,
          day_number: day.dayNumber,
          date: day.date,
          weather_summary: day.weatherSummary,
          weather_state: day.weatherState || 'CLEAR',
          is_estimated_weather: Boolean(day.isEstimatedWeather),
          weather_source: day.weatherSource || (day.isEstimatedWeather ? 'historical_estimate' : 'forecast'),
          weather_confidence: day.weatherConfidence || (day.isEstimatedWeather ? 'low' : 'high'),
          weather_resolution: day.weatherResolution || 'daily',
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
        start_time?: string;
        end_time?: string;
        duration_min?: number;
        event_kind?: string;
        linked_expedition_id?: string;
        distance_from_previous_km?: number;
        transit_from_previous_min?: number;
        source?: string;
        is_verified?: boolean;
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
            start_time: item.startTime,
            end_time: item.endTime,
            duration_min: item.durationMin,
            event_kind: item.eventKind,
            linked_expedition_id: item.linkedExpeditionId,
            distance_from_previous_km: item.distanceFromPreviousKm,
            transit_from_previous_min: item.transitFromPreviousMin,
            source: item.source,
            is_verified: Boolean(item.isVerified),
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
  } catch (rollbackErr) {
    // Atomic rollback: clean up partial itinerary record
    try {
      await supabase.from('itineraries').delete().eq('id', savedItineraryId);
    } catch {
      // suppress secondary rollback errors to re-throw primary cause
    }
    throw rollbackErr;
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
      version,
      destination_timezone,
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
        weather_state,
        is_estimated_weather,
        weather_source,
        weather_confidence,
        weather_resolution,
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
          flex_reason,
          start_time,
          end_time,
          duration_min,
          event_kind,
          linked_expedition_id,
          distance_from_previous_km,
          transit_from_previous_min,
          source,
          is_verified
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !itineraries) {
    return [];
  }

  return (itineraries as unknown as DbItineraryRow[]).map(mapDbRowToGeneratedTrip);
}

/**
 * Retrieves a single itinerary by ID for the authenticated user.
 */
export async function getItineraryByIdFromDb(
  supabase: SupabaseClient,
  tripId: string,
  userId?: string
): Promise<GeneratedTrip | null> {
  let query = supabase
    .from('itineraries')
    .select(`
      id,
      version,
      destination_timezone,
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
        weather_state,
        is_estimated_weather,
        weather_source,
        weather_confidence,
        weather_resolution,
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
          flex_reason,
          start_time,
          end_time,
          duration_min,
          event_kind,
          linked_expedition_id,
          distance_from_previous_km,
          transit_from_previous_min,
          source,
          is_verified
        )
      )
    `)
    .eq('id', tripId);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: row, error } = await query.single();

  if (error || !row) {
    return null;
  }

  return mapDbRowToGeneratedTrip(row as unknown as DbItineraryRow);
}

/**
 * Deletes an itinerary by ID (cascades to days, items, and notes).
 */
export async function deleteItineraryFromDb(
  supabase: SupabaseClient,
  tripId: string,
  userId?: string
): Promise<boolean> {
  let query = supabase.from('itineraries').delete().eq('id', tripId);
  if (userId) {
    query = query.eq('user_id', userId);
  }
  const { error } = await query;
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

  const noteRow = data as unknown as DbDayNoteRow;
  return {
    id: noteRow.id,
    dayId: noteRow.itinerary_day_id,
    content: noteRow.content,
    createdAt: noteRow.created_at,
    updatedAt: noteRow.updated_at,
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
  const noteRows = data as unknown as DbDayNoteRow[];
  return noteRows.map((d) => ({
    id: d.id,
    dayId: d.itinerary_day_id,
    content: d.content,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }));
}

/**
 * Deletes a note by ID from the database.
 */
export async function deleteDayNoteFromDb(
  supabase: SupabaseClient,
  noteId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('itinerary_day_notes')
    .delete()
    .eq('id', noteId);

  return !error;
}
