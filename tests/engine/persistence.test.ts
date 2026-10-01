import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapDbRowToGeneratedTrip,
  saveItineraryToDb,
  deleteDayNoteFromDb,
} from '../../src/lib/supabase/itineraryRepo';
import { GeneratedTrip, upgradeLegacyTrip } from '../../src/lib/tripStore';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Persistence, Schema Mapping & Atomic Rollback Core (Stage 5)', () => {
  it('mapDbRowToGeneratedTrip preserves all Stage 1-3 temporal, transit, and weather fields', () => {
    const mockDbRow = {
      id: 'trip-101',
      version: 2,
      destination_timezone: 'Asia/Kolkata',
      persona: 'Culture Seeker' as const,
      start_date: '2026-11-01',
      days: 1,
      origin_city: 'Delhi',
      arrival_mode: 'train' as const,
      arrival_at: '10:00 AM',
      feasibility_status: 'PASSED' as const,
      warnings: ['Mild heat advisory in afternoon'],
      audit_log: [],
      destinations: {
        id: 'dest-jaipur',
        city: 'Jaipur',
        country: 'India',
        country_code: 'IN',
        admin1: 'Rajasthan',
        latitude: 26.9124,
        longitude: 75.7873,
      },
      itinerary_days: [
        {
          id: 'day-1',
          day_number: 1,
          date: '2026-11-01',
          weather_summary: 'Sunny, 28°C',
          weather_state: 'CLEAR',
          is_estimated_weather: false,
          weather_source: 'forecast' as const,
          weather_confidence: 'high' as const,
          weather_resolution: 'daily' as const,
          itinerary_items: [
            {
              id: 'item-1',
              candidate_id: 'poi-amber-fort',
              slot: 'MORNING' as const,
              sort_order: 0,
              title: 'Amber Fort Expedition',
              category: 'CULTURE',
              reason: 'Historic landmark',
              indoor: false,
              latitude: 26.9855,
              longitude: 75.8513,
              is_flex: false,
              start_time: '10:30',
              end_time: '14:30',
              duration_min: 240,
              event_kind: 'expedition',
              linked_expedition_id: 'amber-exp-1',
              distance_from_previous_km: 8.5,
              transit_from_previous_min: 22,
              source: 'osm:relation:12345',
              is_verified: true,
            },
          ],
        },
      ],
    };

    const trip = mapDbRowToGeneratedTrip(mockDbRow);

    assert.equal(trip.id, 'trip-101');
    assert.equal(trip.version, 2);
    assert.equal(trip.destinationTimezone, 'Asia/Kolkata');
    assert.equal(trip.destination, 'Jaipur');
    assert.equal(trip.destinationCoords?.lat, 26.9124);
    assert.equal(trip.destinationCoords?.lon, 75.7873);

    const day = trip.itineraryDays[0];
    assert.ok(day);
    assert.equal(day.weatherSource, 'forecast');
    assert.equal(day.weatherConfidence, 'high');
    assert.equal(day.weatherResolution, 'daily');
    assert.equal(day.timeline?.length, 1);

    const item = day.morning[0];
    assert.ok(item);
    assert.equal(item.id, 'poi-amber-fort');
    assert.equal(item.startTime, '10:30');
    assert.equal(item.endTime, '14:30');
    assert.equal(item.durationMin, 240);
    assert.equal(item.eventKind, 'expedition');
    assert.equal(item.linkedExpeditionId, 'amber-exp-1');
    assert.equal(item.distanceFromPreviousKm, 8.5);
    assert.equal(item.transitFromPreviousMin, 22);
    assert.equal(item.source, 'osm:relation:12345');
    assert.equal(item.isVerified, true);
  });

  it('upgradeLegacyTrip transforms unversioned legacy trip into version 2 temporal schedule', () => {
    const legacyTrip: GeneratedTrip = {
      id: 'legacy-trip-99',
      destination: 'Tokyo',
      destinationCountry: 'Japan',
      destinationCoords: { lat: 35.6762, lon: 139.6503 },
      persona: 'Backpacker',
      startDate: '2026-12-01',
      days: 1,
      originCity: '',
      arrivalMode: 'flight',
      arrivalAt: '09:00 AM',
      arrivalTime: '09:00 AM',
      itineraryDays: [
        {
          id: 'day-leg-1',
          dayNumber: 1,
          date: '2026-12-01',
          weatherSummary: 'Partly Cloudy, 12°C',
          morning: [
            {
              id: 'sensoji',
              title: 'Senso-ji Temple',
              category: 'CULTURE',
              reason: 'Historic temple',
              indoor: false,
            },
          ],
          afternoon: [
            {
              id: 'akihabara',
              title: 'Akihabara Electric Town',
              category: 'CULTURE',
              reason: 'Tech hub',
              indoor: true,
            },
          ],
          evening: [
            {
              id: 'shinjuku',
              title: 'Shinjuku Night Walk',
              category: 'ENTERTAINMENT',
              reason: 'Nightlife',
              indoor: false,
            },
          ],
        },
      ],
    };

    const upgraded = upgradeLegacyTrip(legacyTrip);

    assert.equal(upgraded.version, 2);
    assert.equal(upgraded.itineraryDays[0].timeline?.length, 3);
    assert.equal(upgraded.itineraryDays[0].morning[0].startTime, '09:00');
    assert.equal(upgraded.itineraryDays[0].morning[0].durationMin, 90);
    assert.equal(upgraded.itineraryDays[0].afternoon[0].startTime, '13:30');
    assert.equal(upgraded.itineraryDays[0].evening[0].startTime, '18:30');
  });

  it('saveItineraryToDb triggers atomic rollback if day/item insertion fails mid-stream', async () => {
    let deletedId: string | null = null;

    const mockSupabase = {
      from(table: string) {
        if (table === 'destinations') {
          return {
            upsert: async () => ({ error: null }),
          };
        }
        if (table === 'itineraries') {
          return {
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: { id: 'itin-atomic-test-1', created_at: new Date().toISOString() },
                  error: null,
                }),
              }),
            }),
            delete: () => ({
              eq: (col: string, val: string) => {
                if (col === 'id') deletedId = val;
                return Promise.resolve({ error: null });
              },
            }),
          };
        }
        if (table === 'itinerary_days') {
          // Simulate database connection interruption or constraint failure on days insert
          return {
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: null,
                  error: { message: 'Simulated connection failure during day insert' },
                }),
              }),
            }),
          };
        }
        return {};
      },
    } as unknown as SupabaseClient;

    const testTrip: GeneratedTrip = {
      id: 'client-trip-id',
      version: 2,
      destination: 'Kyoto',
      persona: 'Backpacker',
      startDate: '2026-10-10',
      days: 1,
      originCity: '',
      arrivalMode: 'train',
      arrivalAt: '10:00 AM',
      arrivalTime: '10:00 AM',
      itineraryDays: [
        {
          id: 'temp-day-1',
          dayNumber: 1,
          date: '2026-10-10',
          weatherSummary: 'Clear',
          morning: [],
          afternoon: [],
          evening: [],
        },
      ],
    };

    await assert.rejects(
      async () => {
        await saveItineraryToDb(mockSupabase, 'user-123', testTrip);
      },
      /Failed to save itinerary day 1: Simulated connection failure/
    );

    // Verify atomic rollback occurred: the newly created itinerary was deleted
    assert.equal(deletedId, 'itin-atomic-test-1');
  });

  it('deleteDayNoteFromDb deletes note by identifier', async () => {
    let deletedNoteId: string | null = null;
    const mockSupabase = {
      from(table: string) {
        if (table === 'itinerary_day_notes') {
          return {
            delete: () => ({
              eq: (col: string, val: string) => {
                if (col === 'id') deletedNoteId = val;
                return Promise.resolve({ error: null });
              },
            }),
          };
        }
        return {};
      },
    } as unknown as SupabaseClient;

    const res = await deleteDayNoteFromDb(mockSupabase, 'note-abc-123');
    assert.equal(res, true);
    assert.equal(deletedNoteId, 'note-abc-123');
  });
});
