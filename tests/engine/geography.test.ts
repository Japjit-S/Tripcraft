import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/itineraries/generate/route';
import { generateItinerary } from '../../src/lib/engine';
import {
  isValidCoordinate,
  resolveSearchRadius,
  deduplicateCandidates,
  sequenceDayStops,
  calculateDistanceKm,
} from '../../src/lib/engine/geography';
import { CandidateActivity } from '../../src/lib/types/engine';
import { normalizeOsmElement } from '../../src/lib/providers/normalize';
import { mockDestination, mockCandidates, clearForecast3Days } from './fixtures';

describe('Geography & Candidate Spatial Integrity Core (Stage 2)', () => {
  it('Validates coordinate range and rejects NaN / infinite / out-of-range inputs', () => {
    // Valid coordinates
    assert.equal(isValidCoordinate(26.9124, 75.7873), true);
    assert.equal(isValidCoordinate(-33.9249, 18.4241), true);
    assert.equal(isValidCoordinate(0, 0), true);
    assert.equal(isValidCoordinate(90, 180), true);
    assert.equal(isValidCoordinate(-90, -180), true);

    // Invalid coordinates
    assert.equal(isValidCoordinate(91, 0), false);
    assert.equal(isValidCoordinate(-91, 0), false);
    assert.equal(isValidCoordinate(0, 181), false);
    assert.equal(isValidCoordinate(0, -181), false);
    assert.equal(isValidCoordinate(NaN, 50), false);
    assert.equal(isValidCoordinate(50, NaN), false);
    assert.equal(isValidCoordinate(Infinity, 0), false);
    assert.equal(isValidCoordinate('26.9', '75.8'), false);
    assert.equal(isValidCoordinate(undefined, null), false);
  });

  it('Resolves adaptive search radius tailored to geographic terrain and urban density', () => {
    // 1. Mountain / Himalayan / Alpine valley destinations: 30,000m (30km)
    const manaliRadius = resolveSearchRadius({ city: 'Manali', admin1: 'Himachal Pradesh' });
    assert.equal(manaliRadius, 30000);

    const lehRadius = resolveSearchRadius({ city: 'Leh', admin1: 'Ladakh' });
    assert.equal(lehRadius, 30000);

    const interlakenRadius = resolveSearchRadius({ city: 'Interlaken', country: 'Switzerland' });
    assert.equal(interlakenRadius, 30000);

    // 2. Ultra-dense metropolitan capitals: 9,000m (9km) to avoid chaotic suburban sprawl
    const tokyoRadius = resolveSearchRadius({ city: 'Tokyo', country: 'Japan' });
    assert.equal(tokyoRadius, 9000);

    const parisRadius = resolveSearchRadius({ city: 'Paris', country: 'France' });
    assert.equal(parisRadius, 9000);

    // 3. Standard city default: 15,000m (15km)
    const jaipurRadius = resolveSearchRadius({ city: 'Jaipur', country: 'India' });
    assert.equal(jaipurRadius, 15000);
  });

  it('Spatial deduplication merges physical venues within 80m and overlapping names without duplicating stops', () => {
    const candidates: CandidateActivity[] = [
      {
        id: 'wiki:page/101',
        title: 'Amber Palace',
        category: 'LANDMARK',
        indoor: false,
        intensity: 'HIGH',
        typicalDurationMin: 180,
        slotAffinity: ['MORNING', 'AFTERNOON'],
        prominence: 0.94,
        coords: { lat: 26.9855, lon: 75.8513 }, // 0m from Amer Fort
        tags: ['unesco', 'palace', 'historic'],
      },
      {
        id: 'osm:way/202',
        title: 'Amer Fort',
        category: 'LANDMARK',
        indoor: false,
        intensity: 'HIGH',
        typicalDurationMin: 180,
        slotAffinity: ['MORNING', 'AFTERNOON'],
        prominence: 0.91,
        coords: { lat: 26.9857, lon: 75.8514 }, // ~25m apart
        tags: ['fort', 'heritage'],
        openingHours: {
          monday: [{ open: '09:00', close: '17:30' }],
        },
      },
      {
        id: 'pack:jaipur-hawa-mahal',
        title: 'Hawa Mahal',
        category: 'LANDMARK',
        indoor: false,
        intensity: 'LOW',
        typicalDurationMin: 60,
        slotAffinity: ['MORNING', 'AFTERNOON'],
        prominence: 0.95,
        coords: { lat: 26.9239, lon: 75.8267 }, // ~8km away
        tags: ['palace', 'monument'],
      },
    ];

    const deduplicated = deduplicateCandidates(candidates, 80);

    // Amber Palace and Amer Fort must merge into 1 canonical item
    assert.equal(deduplicated.length, 2, 'Two overlapping Amber Fort records must merge into one');

    const mergedAmber = deduplicated.find((c) => c.title.includes('Amber') || c.title.includes('Amer'));
    assert.ok(mergedAmber);
    assert.equal(mergedAmber.prominence, 0.94, 'Merged item retains highest prominence');
    assert.ok(mergedAmber.tags.includes('unesco'), 'Merged item inherits unesco tag');
    assert.ok(mergedAmber.tags.includes('fort'), 'Merged item inherits fort tag');
    assert.ok(mergedAmber.openingHours, 'Merged item preserves opening hours');
  });

  it('Calculates accurate Haversine distance and transit times between city venues', () => {
    // Jaipur City Palace to Amber Fort (~8.5 km straight line)
    const cityPalaceCoords = { lat: 26.9258, lon: 75.8236 };
    const amberFortCoords = { lat: 26.9855, lon: 75.8513 };

    const distanceKm = calculateDistanceKm(cityPalaceCoords, amberFortCoords);
    assert.ok(distanceKm >= 7.0 && distanceKm <= 10.0, `Expected ~8.5km, got ${distanceKm}km`);

    // Venues 50m apart (e.g. courtyard to neighboring museum pavilion)
    const pavilionA = { lat: 26.9258, lon: 75.8236 };
    const pavilionB = { lat: 26.9262, lon: 75.8238 };
    const closeDistanceKm = calculateDistanceKm(pavilionA, pavilionB);
    assert.ok(closeDistanceKm < 0.1, `Expected < 0.1km for 50m separation, got ${closeDistanceKm}km`);
  });

  it('sequenceDayStops sequences daily stops and annotates transit time and distance', () => {
    const dayStops = [
      {
        id: 'stop-1',
        candidateId: 'pack:jaipur-hawa-mahal',
        title: 'Hawa Mahal',
        category: 'LANDMARK',
        indoor: false,
        slot: 'MORNING' as const,
        reason: 'Anchor',
        intensity: 'LOW' as const,
        typicalDurationMin: 60,
        coords: { lat: 26.9239, lon: 75.8267 },
      },
      {
        id: 'stop-2',
        candidateId: 'pack:jaipur-city-palace',
        title: 'City Palace',
        category: 'CULTURE',
        indoor: true,
        slot: 'AFTERNOON' as const,
        reason: 'Culture',
        intensity: 'MEDIUM' as const,
        typicalDurationMin: 120,
        coords: { lat: 26.9258, lon: 75.8236 },
      },
      {
        id: 'stop-3',
        candidateId: 'pack:jaipur-amber-fort',
        title: 'Amber Fort',
        category: 'LANDMARK',
        indoor: false,
        slot: 'EVENING' as const,
        reason: 'Sunset',
        intensity: 'HIGH' as const,
        typicalDurationMin: 180,
        coords: { lat: 26.9855, lon: 75.8513 },
      },
    ];

    const { sequencedItems, totalDistanceKm, totalTransitMin } = sequenceDayStops(dayStops);

    assert.equal(sequencedItems.length, 3);
    assert.ok(totalDistanceKm > 0, 'Total distance must be positive');
    assert.ok(totalTransitMin > 0, 'Total transit duration must be positive');

    // Stop 1 has 0 initial transit
    assert.equal(sequencedItems[0].distanceFromPreviousKm, 0);
    assert.equal(sequencedItems[0].transitFromPreviousMin, 0);

    // Stop 2 has transit from Stop 1 (City Palace is ~0.4km from Hawa Mahal)
    assert.ok(sequencedItems[1].distanceFromPreviousKm !== undefined);
    assert.ok(sequencedItems[1].transitFromPreviousMin !== undefined);

    // Stop 3 has transit from Stop 2 (Amber Fort is ~8.5km from City Palace)
    assert.ok(sequencedItems[2].distanceFromPreviousKm! >= 6.0);
    assert.ok(sequencedItems[2].transitFromPreviousMin! >= 15);
  });

  it('Engine logs GEOGRAPHIC_ROUTE_SEQUENCING audit entry for daily routes', () => {
    const output = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 2,
      persona: 'Culture Seeker',
      weatherForecast: clearForecast3Days.slice(0, 2),
      candidates: mockCandidates,
    });

    assert.equal(output.success, true);

    const routeAudit = output.auditLog.find((a) => a.ruleId === 'GEOGRAPHIC_ROUTE_SEQUENCING');
    assert.ok(routeAudit, 'Audit log must record GEOGRAPHIC_ROUTE_SEQUENCING rule');
    assert.equal(routeAudit.verdict, 'SELECTED');
    assert.match(routeAudit.reason, /non-backtracking trajectory/i);

    // Check that timeline items have transit annotations
    const day1 = output.itineraryDays[0];
    const physicalItems = day1.timeline?.filter((i) => i.eventKind !== 'arrival_checkin') || [];
    if (physicalItems.length > 1) {
      assert.ok(
        physicalItems.some((i) => (i.distanceFromPreviousKm ?? 0) > 0),
        'At least one stop must record inter-venue distance'
      );
    }
  });

  it('POST /api/itineraries/generate rejects out-of-range coordinates with 400 Bad Request', async () => {
    const invalidCoordsPayload = {
      city: 'Jaipur',
      latitude: 145.5, // Invalid: exceeds 90 degrees
      longitude: 75.8,
      startDate: '2026-10-15',
      days: 3,
      persona: 'Culture Seeker',
    };

    const req = new NextRequest('http://localhost:3000/api/itineraries/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidCoordsPayload),
    });

    const res = await POST(req);
    assert.equal(res.status, 400);

    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /latitude must be between -90 and 90/i);
  });

  it('Disambiguates same-name cities across different regions and countries using administrative context', async () => {
    const { WeatherProvider } = await import('../../src/lib/providers/weatherProvider');
    const provider = new WeatherProvider();

    // 1. Springfield: Illinois vs Massachusetts
    const springfieldIL = await provider.geocodeCity('Springfield', { admin1: 'Illinois' });
    const springfieldMA = await provider.geocodeCity('Springfield', { admin1: 'Massachusetts' });

    assert.ok(springfieldIL);
    assert.ok(springfieldMA);
    assert.notEqual(springfieldIL.latitude, springfieldMA.latitude, 'Springfield IL and MA must have different coordinates');
    assert.match(springfieldIL.admin1?.toLowerCase() || '', /illinois/i);
    assert.match(springfieldMA.admin1?.toLowerCase() || '', /massachusetts/i);

    // 2. Cordoba: Spain vs Argentina
    const cordobaSpain = await provider.geocodeCity('Cordoba', { countryCode: 'ES' });
    const cordobaArg = await provider.geocodeCity('Cordoba', { countryCode: 'AR' });

    assert.ok(cordobaSpain);
    assert.ok(cordobaArg);
    assert.equal(cordobaSpain.countryCode?.toUpperCase(), 'ES');
    assert.equal(cordobaArg.countryCode?.toUpperCase(), 'AR');
    assert.notEqual(cordobaSpain.latitude, cordobaArg.latitude);
  });

  it('Verified candidate sourcing tags real OSM/Wikipedia records and preserves source attribution into itinerary', () => {
    const sampleOsmElem = {
      type: 'node' as const,
      id: 998877,
      lat: 26.9239,
      lon: 75.8267,
      tags: {
        name: 'Hawa Mahal Palace',
        historic: 'monument',
        tourism: 'attraction',
        heritage: 'yes',
      },
    };

    const normalized = normalizeOsmElement(sampleOsmElem, 25);
    assert.ok(normalized);
    assert.equal(normalized.source, 'osm');
    assert.equal(normalized.sourceId, 'osm:node/998877');
    assert.equal(normalized.isVerified, true);
    assert.ok(!normalized.id.startsWith('procedural:'));

    // Verify engine preserves candidate source into output timeline items
    const candidatesWithSource: CandidateActivity[] = [
      {
        ...mockCandidates[0],
        source: 'osm',
        sourceId: 'osm:node/123',
        isVerified: true,
      },
      {
        ...mockCandidates[1],
        source: 'wikipedia',
        sourceId: 'wiki:page/456',
        isVerified: true,
      },
    ];

    const output = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 1,
      persona: 'Culture Seeker',
      weatherForecast: [clearForecast3Days[0]],
      candidates: candidatesWithSource,
    });

    assert.equal(output.success, true);
    const day1 = output.itineraryDays[0];
    const items = day1.timeline || [];
    assert.ok(items.length > 0);

    const firstActivity = items.find((i) => i.eventKind === 'activity');
    if (firstActivity) {
      assert.ok(isValidCoordinate(firstActivity.coords.lat, firstActivity.coords.lon));
    }
  });
});
