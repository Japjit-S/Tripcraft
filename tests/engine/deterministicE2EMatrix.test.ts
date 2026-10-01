import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateItinerary } from '../../src/lib/engine';
import { Destination, CandidateActivity, DayForecast } from '../../src/lib/types/engine';

describe('Deterministic E2E Verification Matrix (Stage 8)', () => {
  // 1. Destination Profiles
  const manaliDest: Destination = {
    id: 'dest-manali',
    city: 'Manali',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Himachal Pradesh',
    latitude: 32.2432,
    longitude: 77.1892,
    timezone: 'Asia/Kolkata',
  };

  const jaipurDest: Destination = {
    id: 'dest-jaipur',
    city: 'Jaipur',
    country: 'India',
    countryCode: 'IN',
    admin1: 'Rajasthan',
    latitude: 26.9124,
    longitude: 75.7873,
    timezone: 'Asia/Kolkata',
  };

  const tokyoDest: Destination = {
    id: 'dest-tokyo',
    city: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    admin1: 'Tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
  };

  const capeTownDest: Destination = {
    id: 'dest-capetown',
    city: 'Cape Town',
    country: 'South Africa',
    countryCode: 'ZA',
    admin1: 'Western Cape',
    latitude: -33.9249,
    longitude: 18.4241,
    timezone: 'Africa/Johannesburg',
  };

  // Weather Fixtures
  const createForecast = (days: number, condition: 'CLEAR' | 'STORM' | 'RAIN' = 'CLEAR'): DayForecast[] => {
    return Array.from({ length: days }, (_, i) => ({
      date: `2026-11-0${i + 1}`,
      maxTemp: condition === 'CLEAR' ? 24 : 16,
      minTemp: 12,
      windSpeed: condition === 'STORM' ? 65 : 15,
      weatherCode: condition === 'STORM' ? 95 : condition === 'RAIN' ? 61 : 0,
      precipitationMm: condition === 'STORM' ? 35 : condition === 'RAIN' ? 12 : 0,
      estimated: false,
      temporalResolution: 'daily' as const,
      confidence: 'high' as const,
      source: 'forecast' as const,
    }));
  };

  // Candidate Pool Generator
  const createCandidates = (dest: Destination, count: number): CandidateActivity[] => {
    const categories: Array<'LANDMARK' | 'CULTURE' | 'FOOD' | 'NATURE' | 'ENTERTAINMENT'> = [
      'LANDMARK',
      'CULTURE',
      'FOOD',
      'NATURE',
      'ENTERTAINMENT',
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: `${dest.id}-poi-${i + 1}`,
      title: `${dest.city} Attraction ${i + 1}`,
      category: categories[i % categories.length],
      coords: {
        lat: dest.latitude + (i * 0.005) * (i % 2 === 0 ? 1 : -1),
        lon: dest.longitude + (i * 0.005) * (i % 2 === 0 ? 1 : -1),
      },
      indoor: i % 3 === 0,
      typicalDurationMin: 60 + (i % 3) * 30,
      intensity: i % 4 === 0 ? 'HIGH' : i % 2 === 0 ? 'MEDIUM' : 'LOW',
      slotAffinity: ['MORNING', 'AFTERNOON', 'EVENING'],
      prominence: 0.8 - (i * 0.02),
      tags: i % 2 === 0 ? ['heritage', 'outdoors'] : ['museum', 'dining'],
      source: 'osm',
      isVerified: true,
    }));
  };

  // Scenario 1: Manali (Mountain / Trek / Backpacker / 3 Days / Early Morning Arrival)
  it('Matrix Scenario 1: Manali Mountain Trek (Backpacker, 3 Days, Early Morning)', () => {
    const candidates = createCandidates(manaliDest, 12);
    // Add a multi-day trek anchor
    candidates.push({
      id: 'manali-bhrigu-lake-trek',
      title: 'Bhrigu Lake Alpine Expedition',
      category: 'NATURE',
      coords: { lat: 32.29, lon: 77.24 },
      indoor: false,
      typicalDurationMin: 360,
      intensity: 'HIGH',
      slotAffinity: ['MORNING', 'AFTERNOON'],
      prominence: 0.95,
      tags: ['hiking', 'trekking', 'nature'],
      isVerified: true,
    });

    const res = generateItinerary({
      destination: manaliDest,
      startDate: '2026-11-01',
      days: 3,
      persona: 'Backpacker',
      arrivalMode: 'bus',
      arrivalAt: '07:00 AM',
      weatherForecast: createForecast(3, 'CLEAR'),
      candidates,
    });

    assert.equal(res.success, true);
    assert.equal(res.itineraryDays.length, 3);

    // Day 1 early arrival starts on morning schedule
    const day1Morning = res.itineraryDays[0].morning;
    assert.ok(day1Morning.length > 0);
  });

  // Scenario 2: Jaipur (Heritage / Culture Seeker / 7 Days / Midday Arrival)
  it('Matrix Scenario 2: Jaipur Heritage Tour (Culture Seeker, 7 Days, Midday)', () => {
    const candidates = createCandidates(jaipurDest, 25);
    const res = generateItinerary({
      destination: jaipurDest,
      startDate: '2026-11-01',
      days: 7,
      persona: 'Culture Seeker',
      arrivalMode: 'train',
      arrivalAt: '12:30 PM',
      weatherForecast: createForecast(7, 'CLEAR'),
      candidates,
    });

    assert.equal(res.success, true);
    assert.equal(res.itineraryDays.length, 7);

    // Midday arrival converts morning slot into arrival_checkin
    const day1Morning = res.itineraryDays[0].morning[0];
    assert.ok(day1Morning);
    assert.equal(day1Morning.eventKind, 'arrival_checkin');

    // Afternoon and evening activities allocated
    assert.ok(res.itineraryDays[0].afternoon.length > 0);
  });

  // Scenario 3: Tokyo (Dense Urban / Family / 3 Days / Late Night Arrival)
  it('Matrix Scenario 3: Tokyo Urban (Family, 3 Days, Late Night Arrival 23:00)', () => {
    const candidates = createCandidates(tokyoDest, 15);
    const res = generateItinerary({
      destination: tokyoDest,
      startDate: '2026-11-01',
      days: 3,
      persona: 'Family',
      arrivalMode: 'flight',
      arrivalAt: '23:00',
      weatherForecast: createForecast(3, 'CLEAR'),
      candidates,
    });

    assert.equal(res.success, true);
    assert.equal(res.itineraryDays.length, 3);

    // Day 1 has late arrival: morning and afternoon are gated for arrival / transit
    const day1 = res.itineraryDays[0];
    assert.equal(day1.morning[0].eventKind, 'arrival_checkin');
    assert.equal(day1.afternoon[0].eventKind, 'arrival_checkin');

    // Day 2 has full daytime activities
    const day2 = res.itineraryDays[1];
    assert.ok(day2.morning.length > 0);
  });

  // Scenario 4: Cape Town (Coastal / Comfort Traveller / 1 Day / Storm Weather Gate)
  it('Matrix Scenario 4: Cape Town Coastal (Comfort Traveller, 1 Day, Severe Storm)', () => {
    const candidates = createCandidates(capeTownDest, 10);
    const res = generateItinerary({
      destination: capeTownDest,
      startDate: '2026-11-01',
      days: 1,
      persona: 'Comfort Traveller',
      arrivalMode: 'flight',
      arrivalAt: '09:00 AM',
      weatherForecast: createForecast(1, 'STORM'),
      candidates,
    });

    assert.equal(res.success, true);
    // Outdoor activities should be eliminated or gated by storm safety
    const allItems = [
      ...res.itineraryDays[0].morning,
      ...res.itineraryDays[0].afternoon,
      ...res.itineraryDays[0].evening,
    ];
    for (const item of allItems) {
      if (!item.isFlex) {
        assert.equal(item.indoor, true, `Item ${item.title} must be indoor during a severe storm`);
      }
    }
  });

  // Scenario 5: Deterministic Repeatability Check
  it('Matrix Scenario 5: Strict Byte-Identical Determinism Across Invocations', () => {
    const candidates = createCandidates(jaipurDest, 15);
    const forecast = createForecast(3, 'CLEAR');

    const run1 = generateItinerary({
      destination: jaipurDest,
      startDate: '2026-11-01',
      days: 3,
      persona: 'Culture Seeker',
      weatherForecast: forecast,
      candidates,
    });

    const run2 = generateItinerary({
      destination: jaipurDest,
      startDate: '2026-11-01',
      days: 3,
      persona: 'Culture Seeker',
      weatherForecast: forecast,
      candidates,
    });

    assert.deepEqual(JSON.stringify(run1), JSON.stringify(run2));
  });
});
