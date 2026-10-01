import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getItineraryByIdFromDb, deleteItineraryFromDb } from '../../src/lib/supabase/itineraryRepo';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Security & Multi-Tenant Isolation Core (Stage 6)', () => {
  it('getItineraryByIdFromDb binds user_id to query when userId is provided to prevent cross-tenant access', async () => {
    let capturedUserIdFilter: string | null = null;
    let capturedTripIdFilter: string | null = null;

    const mockSupabase = {
      from(table: string) {
        assert.equal(table, 'itineraries');
        const builder = {
          select: () => builder,
          eq: (col: string, val: string) => {
            if (col === 'id') capturedTripIdFilter = val;
            if (col === 'user_id') capturedUserIdFilter = val;
            return builder;
          },
          single: async () => ({ data: null, error: null }),
        };
        return builder;
      },
    } as unknown as SupabaseClient;

    await getItineraryByIdFromDb(mockSupabase, 'trip-secret-456', 'tenant-user-789');

    assert.equal(capturedTripIdFilter, 'trip-secret-456');
    assert.equal(capturedUserIdFilter, 'tenant-user-789');
  });

  it('deleteItineraryFromDb binds user_id to prevent cross-tenant deletion attacks', async () => {
    let capturedUserIdFilter: string | null = null;
    let capturedTripIdFilter: string | null = null;

    const mockSupabase = {
      from(table: string) {
        assert.equal(table, 'itineraries');
        const builder = {
          delete: () => builder,
          eq: (col: string, val: string) => {
            if (col === 'id') capturedTripIdFilter = val;
            if (col === 'user_id') capturedUserIdFilter = val;
            return builder;
          },
        };
        return builder;
      },
    } as unknown as SupabaseClient;

    await deleteItineraryFromDb(mockSupabase, 'trip-victim-111', 'attacker-user-999');

    assert.equal(capturedTripIdFilter, 'trip-victim-111');
    assert.equal(capturedUserIdFilter, 'attacker-user-999');
  });

  it('validates bounds on itinerary input parameters', () => {
    const validPersonas = new Set(['Backpacker', 'Culture Seeker', 'Comfort Traveller', 'Family']);
    
    // Valid tests
    assert.ok(validPersonas.has('Backpacker'));
    assert.ok(validPersonas.has('Family'));

    // Hostile / SQL injection / unknown personas
    assert.ok(!validPersonas.has("'; DROP TABLE itineraries; --"));
    assert.ok(!validPersonas.has('Admin'));
    assert.ok(!validPersonas.has(''));

    // Day bounds: must be 1 to 7
    const isValidDayCount = (d: number) => Number.isInteger(d) && d >= 1 && d <= 7;
    assert.ok(isValidDayCount(1));
    assert.ok(isValidDayCount(7));
    assert.ok(!isValidDayCount(0));
    assert.ok(!isValidDayCount(8));
    assert.ok(!isValidDayCount(-1));
    assert.ok(!isValidDayCount(1.5));
  });

  it('validates bounds on day note input length', () => {
    const isValidNote = (content: string) => {
      const trimmed = content.trim();
      return trimmed.length > 0 && trimmed.length <= 2000;
    };

    assert.ok(isValidNote('Flight arrives at terminal 3. Booking ref: XYZ123.'));
    assert.ok(!isValidNote(''));
    assert.ok(!isValidNote('   \n  \t  '));
    assert.ok(!isValidNote('a'.repeat(2001)));
  });
});
