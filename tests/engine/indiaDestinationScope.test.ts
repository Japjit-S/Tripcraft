import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { NextRequest } from 'next/server';
import { GET as destinationSearchGET } from '../../src/app/api/destinations/search/route';
import { POST as generatePOST } from '../../src/app/api/itineraries/generate/route';
import { WeatherProvider } from '../../src/lib/providers/weatherProvider';
import {
  clearAllStoredTrips,
  getAllStoredTrips,
  getTripFromStorage,
  isIndiaDestinationTrip,
  saveTripToStorage,
  GeneratedTrip,
} from '../../src/lib/tripStore';

describe('Tripcraft India-Only Destination Scope & Validation Core', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Mock fetch for deterministic, offline testing
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();

      // Open-Meteo Geocoding Mock
      if (url.includes('geocoding-api.open-meteo.com')) {
        const parsedUrl = new URL(url);
        const nameParam = decodeURIComponent(parsedUrl.searchParams.get('name') || '').toLowerCase();

        if (nameParam.includes('jaipur')) {
          return new Response(
            JSON.stringify({
              results: [
                {
                  id: 1269515,
                  name: 'Jaipur',
                  country: 'India',
                  country_code: 'IN',
                  admin1: 'Rajasthan',
                  latitude: 26.9124,
                  longitude: 75.7873,
                  timezone: 'Asia/Kolkata',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (nameParam.includes('delhi')) {
          return new Response(
            JSON.stringify({
              results: [
                {
                  id: 1273294,
                  name: 'Delhi',
                  country: 'India',
                  country_code: 'IN',
                  admin1: 'Delhi',
                  latitude: 28.6519,
                  longitude: 77.2315,
                  timezone: 'Asia/Kolkata',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (nameParam.includes('kochi')) {
          return new Response(
            JSON.stringify({
              results: [
                {
                  id: 1273874,
                  name: 'Kochi',
                  country: 'India',
                  country_code: 'IN',
                  admin1: 'Kerala',
                  latitude: 9.9399,
                  longitude: 76.2602,
                  timezone: 'Asia/Kolkata',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (nameParam.includes('bengaluru') || nameParam.includes('bangalore')) {
          return new Response(
            JSON.stringify({
              results: [
                {
                  id: 1277333,
                  name: 'Bengaluru',
                  country: 'India',
                  country_code: 'IN',
                  admin1: 'Karnataka',
                  latitude: 12.9719,
                  longitude: 77.5937,
                  timezone: 'Asia/Kolkata',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (nameParam.includes('tokyo')) {
          return new Response(
            JSON.stringify({
              results: [
                {
                  id: 1850147,
                  name: 'Tokyo',
                  country: 'Japan',
                  country_code: 'JP',
                  admin1: 'Tokyo',
                  latitude: 35.6895,
                  longitude: 139.6917,
                  timezone: 'Asia/Tokyo',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (nameParam.includes('paris')) {
          return new Response(
            JSON.stringify({
              results: [
                {
                  id: 2988507,
                  name: 'Paris',
                  country: 'France',
                  country_code: 'FR',
                  admin1: 'Île-de-France',
                  latitude: 48.8534,
                  longitude: 2.3488,
                  timezone: 'Europe/Paris',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (nameParam.includes('cape town') || nameParam.includes('cape+town')) {
          return new Response(
            JSON.stringify({
              results: [
                {
                  id: 3369157,
                  name: 'Cape Town',
                  country: 'South Africa',
                  country_code: 'ZA',
                  admin1: 'Western Cape',
                  latitude: -33.9258,
                  longitude: 18.4232,
                  timezone: 'Africa/Johannesburg',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (nameParam.includes('ambiguous')) {
          return new Response(
            JSON.stringify({
              results: [
                {
                  id: 9999999,
                  name: 'Ambiguous Town',
                  // Missing country and country_code
                  latitude: 20.0,
                  longitude: 80.0,
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Open-Meteo Weather Forecast Mock
      if (url.includes('api.open-meteo.com/v1/forecast')) {
        return new Response(
          JSON.stringify({
            daily: {
              time: ['2026-10-15', '2026-10-16', '2026-10-17'],
              temperature_2m_max: [31.5, 32.0, 31.0],
              temperature_2m_min: [19.0, 19.5, 18.8],
              precipitation_sum: [0.0, 0.0, 0.0],
              wind_speed_10m_max: [12.0, 14.0, 11.5],
              weather_code: [1, 0, 1],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // OSM Overpass Mock
      if (url.includes('overpass-api.de') || url.includes('overpass')) {
        return new Response(
          JSON.stringify({
            elements: [
              {
                type: 'node',
                id: 101,
                lat: 26.9239,
                lon: 75.8267,
                tags: { name: 'Hawa Mahal', tourism: 'attraction' },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Wikipedia GeoSearch Mock
      if (url.includes('wikipedia.org')) {
        return new Response(
          JSON.stringify({
            query: {
              geosearch: [
                { pageid: 201, title: 'Amber Fort', lat: 26.9855, lon: 75.8513 },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return originalFetch(input, init);
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('1. Indian destinations from multiple regions remain searchable and return normalized IN metadata', async () => {
    const provider = new WeatherProvider();

    // North: Delhi
    const delhiResults = await provider.searchCities('Delhi', 5, 'IN');
    assert.ok(delhiResults.length > 0);
    const delhi = delhiResults[0]!;
    assert.equal((delhi.countryCode ?? '').toUpperCase(), 'IN');
    assert.equal(delhi.country, 'India');

    // West: Jaipur
    const jaipurResults = await provider.searchCities('Jaipur', 5, 'IN');
    assert.ok(jaipurResults.length > 0);
    const jaipur = jaipurResults[0]!;
    assert.equal((jaipur.countryCode ?? '').toUpperCase(), 'IN');

    // South: Kochi
    const kochiResults = await provider.searchCities('Kochi', 5, 'IN');
    assert.ok(kochiResults.length > 0);
    const kochi = kochiResults[0]!;
    assert.equal((kochi.countryCode ?? '').toUpperCase(), 'IN');

    // South: Bengaluru
    const blrResults = await provider.searchCities('Bengaluru', 5, 'IN');
    assert.ok(blrResults.length > 0);
    const blr = blrResults[0]!;
    assert.equal((blr.countryCode ?? '').toUpperCase(), 'IN');
  });

  it('2. Overseas destinations (Tokyo, Paris, Cape Town) return 0 results under India destination search', async () => {
    const provider = new WeatherProvider();

    const tokyoResults = await provider.searchCities('Tokyo', 5, 'IN');
    assert.deepEqual(tokyoResults, [], 'Tokyo must be excluded from India destination search');

    const parisResults = await provider.searchCities('Paris', 5, 'IN');
    assert.deepEqual(parisResults, [], 'Paris must be excluded from India destination search');

    const capeTownResults = await provider.searchCities('Cape Town', 5, 'IN');
    assert.deepEqual(capeTownResults, [], 'Cape Town must be excluded from India destination search');
  });

  it('3. GET /api/destinations/search enforces India scope and blocks client override attempts', async () => {
    // Normal query for Paris
    const req1 = new NextRequest('http://localhost:3000/api/destinations/search?q=Paris');
    const res1 = await destinationSearchGET(req1);
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.deepEqual(data1.results, [], 'Paris should return no results');

    // Malicious attempt to override country code to FR
    const req2 = new NextRequest('http://localhost:3000/api/destinations/search?q=Paris&country=FR');
    const res2 = await destinationSearchGET(req2);
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.deepEqual(data2.results, [], 'Client cannot override India destination restriction');

    // Valid Indian query
    const req3 = new NextRequest('http://localhost:3000/api/destinations/search?q=Jaipur');
    const res3 = await destinationSearchGET(req3);
    assert.equal(res3.status, 200);
    const data3 = await res3.json();
    assert.ok(data3.results.length > 0);
    assert.equal(data3.results[0].countryCode, 'IN');
  });

  it('4. POST /api/itineraries/generate rejects Tokyo, Paris, and Cape Town with INDIA_ONLY_DESTINATION (400)', async () => {
    const testCases = ['Tokyo', 'Paris', 'Cape Town'];

    for (const city of testCases) {
      const req = new NextRequest('http://localhost:3000/api/itineraries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          startDate: '2026-10-15',
          days: 3,
          persona: 'Culture Seeker',
        }),
      });

      const res = await generatePOST(req);
      assert.equal(res.status, 400, `${city} must be rejected with 400`);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.code, 'INDIA_ONLY_DESTINATION');
      assert.match(data.error, /Tripcraft currently plans destinations within India/i);
    }
  });

  it('5. Forged client country code or coordinates cannot bypass server-side geocoding verification', async () => {
    // Attack 1: Client claims Paris is in India ('IN') with Delhi coordinates
    const forgedCountryReq = new NextRequest('http://localhost:3000/api/itineraries/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: 'Paris',
        country: 'India',
        countryCode: 'IN',
        latitude: 28.6139,
        longitude: 77.2090,
        startDate: '2026-10-15',
        days: 3,
        persona: 'Backpacker',
      }),
    });

    const res1 = await generatePOST(forgedCountryReq);
    assert.equal(res1.status, 400);
    const data1 = await res1.json();
    assert.equal(data1.code, 'INDIA_ONLY_DESTINATION');
    assert.match(data1.error, /Tripcraft currently plans destinations within India/i);

    // Attack 2: Client specifies Indian city but submits coordinates outside India bbox
    const forgedCoordsReq = new NextRequest('http://localhost:3000/api/itineraries/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: 'Jaipur',
        country: 'India',
        countryCode: 'IN',
        latitude: 48.8566, // Paris latitude (outside India envelope)
        longitude: 2.3522,  // Paris longitude (outside India envelope)
        startDate: '2026-10-15',
        days: 3,
        persona: 'Backpacker',
      }),
    });

    const res2 = await generatePOST(forgedCoordsReq);
    assert.equal(res2.status, 400);
    const data2 = await res2.json();
    assert.equal(data2.code, 'INDIA_ONLY_DESTINATION');
  });

  it('6. Missing, ambiguous, or unverified country metadata fails closed with INDIA_ONLY_DESTINATION', async () => {
    const ambiguousReq = new NextRequest('http://localhost:3000/api/itineraries/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: 'Ambiguous Town',
        startDate: '2026-10-15',
        days: 2,
        persona: 'Comfort Traveller',
      }),
    });

    const res = await generatePOST(ambiguousReq);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.code, 'INDIA_ONLY_DESTINATION');
  });

  it('7. International origin city is explicitly exempt and inbound journeys to India succeed', async () => {
    const internationalOriginReq = new NextRequest('http://localhost:3000/api/itineraries/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: 'Jaipur',
        originCity: 'London, United Kingdom', // Overseas origin
        arrivalMode: 'flight',
        arrivalTime: '10:00 AM',
        startDate: '2026-10-15',
        days: 3,
        persona: 'Culture Seeker',
      }),
    });

    const res = await generatePOST(internationalOriginReq);
    assert.equal(res.status, 200, 'Inbound journey from London to Jaipur must succeed');
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.destination.city, 'Jaipur');
    assert.equal(data.originCity, 'London, United Kingdom');
  });

  it('8. tripStore cleanses legacy overseas trips and prevents their revival in localStorage', () => {
    // Setup mock localStorage in Node environment
    const storageMap = new Map<string, string>();
    const mockLocalStorage = {
      getItem: (key: string) => storageMap.get(key) || null,
      setItem: (key: string, value: string) => storageMap.set(key, value),
      removeItem: (key: string) => storageMap.delete(key),
      clear: () => storageMap.clear(),
      get length() { return storageMap.size; },
      key: (i: number) => Array.from(storageMap.keys())[i] || null,
    };

    (globalThis as unknown as { window: unknown }).window = globalThis;
    (globalThis as unknown as { localStorage: typeof mockLocalStorage }).localStorage = mockLocalStorage;

    const legacyTokyoTrip: GeneratedTrip = {
      id: 'trip-legacy-tokyo',
      destination: 'Tokyo',
      destinationCountry: 'Japan',
      destinationCountryCode: 'JP',
      persona: 'Backpacker',
      startDate: '2026-10-15',
      days: 3,
      originCity: 'Tokyo',
      arrivalMode: 'flight',
      arrivalAt: '10:00 AM',
      arrivalTime: '10:00 AM',
      itineraryDays: [],
    };

    const validJaipurTrip: GeneratedTrip = {
      id: 'trip-valid-jaipur',
      destination: 'Jaipur',
      destinationCountry: 'India',
      destinationCountryCode: 'IN',
      persona: 'Culture Seeker',
      startDate: '2026-10-15',
      days: 3,
      originCity: 'Delhi',
      arrivalMode: 'train',
      arrivalAt: '10:00 AM',
      arrivalTime: '10:00 AM',
      itineraryDays: [],
    };

    // Test discriminator
    assert.equal(isIndiaDestinationTrip(legacyTokyoTrip), false);
    assert.equal(isIndiaDestinationTrip(validJaipurTrip), true);

    // Save both
    saveTripToStorage(legacyTokyoTrip);
    saveTripToStorage(validJaipurTrip);

    // getAllStoredTrips must filter out Tokyo
    const stored = getAllStoredTrips();
    assert.equal(stored.length, 1);
    assert.equal(stored[0].id, 'trip-valid-jaipur');

    // Direct get of Tokyo must return null and purge from storage
    const retrievedTokyo = getTripFromStorage('trip-legacy-tokyo');
    assert.equal(retrievedTokyo, null);
    assert.equal(mockLocalStorage.getItem('tripcraft_trip_trip-legacy-tokyo'), null);

    // clearAllStoredTrips removes everything
    clearAllStoredTrips();
    assert.equal(getAllStoredTrips().length, 0);

    // Cleanup globals
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
  });
});
