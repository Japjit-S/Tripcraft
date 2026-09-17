import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateItinerary } from '../../src/lib/engine/index';
import { CuratedPackProvider } from '../../src/lib/providers/curatedPackProvider';
import { clearForecast3Days, mockDestination } from './fixtures';

describe('CuratedPackProvider', () => {
  const provider = new CuratedPackProvider();

  it('lists all supported curated destination cities', () => {
    const cities = provider.getAvailableCities();
    assert.ok(cities.includes('Jaipur'));
    assert.ok(cities.includes('Delhi'));
    assert.ok(cities.includes('Agra'));
    assert.ok(cities.includes('Varanasi'));
    assert.ok(cities.includes('Udaipur'));
    assert.ok(cities.includes('Goa'));
  });

  it('retrieves high-quality candidates for Jaipur', async () => {
    const candidates = await provider.getCandidates(mockDestination);
    assert.ok(candidates.length >= 10);

    const hawaMahal = candidates.find((c) => c.title.includes('Hawa Mahal'));
    assert.ok(hawaMahal);
    assert.equal(hawaMahal.category, 'LANDMARK');
    assert.equal(hawaMahal.indoor, false);
    assert.ok(hawaMahal.prominence > 0.9);
    assert.ok(hawaMahal.coords.lat > 26 && hawaMahal.coords.lon > 75);
  });

  it('resolves city aliases like New Delhi, Kashi, and Panjim', async () => {
    const delhiCandidates = await provider.getCandidates({
      id: 'dest-delhi',
      city: 'New Delhi',
      country: 'India',
      latitude: 28.6139,
      longitude: 77.209,
    });
    assert.ok(delhiCandidates.some((c) => c.title.includes('Red Fort')));

    const varanasiCandidates = await provider.getCandidates({
      id: 'dest-varanasi',
      city: 'Kashi',
      country: 'India',
      latitude: 25.3176,
      longitude: 82.9739,
    });
    assert.ok(varanasiCandidates.some((c) => c.title.includes('Ganga Aarti')));

    const goaCandidates = await provider.getCandidates({
      id: 'dest-goa',
      city: 'Panjim',
      country: 'India',
      latitude: 15.4909,
      longitude: 73.8278,
    });
    assert.ok(goaCandidates.some((c) => c.title.includes('Bom Jesus')));
  });

  it('throws a descriptive error when city is not supported', async () => {
    await assert.rejects(
      async () => {
        await provider.getCandidates({
          id: 'dest-unknown',
          city: 'Unknown Atlantis',
          country: 'Nowhere',
          latitude: 0,
          longitude: 0,
        });
      },
      /No curated pack available for destination "Unknown Atlantis"/
    );
  });

  it('integrates seamlessly with generateItinerary for a 3-day Jaipur trip', async () => {
    const candidates = await provider.getCandidates(mockDestination);
    const output = generateItinerary({
      destination: mockDestination,
      startDate: '2026-10-15',
      days: 3,
      persona: 'Culture Seeker',
      weatherForecast: clearForecast3Days,
      candidates,
    });

    assert.equal(output.success, true);
    assert.equal(output.itineraryDays.length, 3);
    assert.ok(output.auditLog.length > 0);

    // Verify all 3 days have morning, afternoon, and evening filled
    for (const day of output.itineraryDays) {
      assert.ok(day.morning.length > 0);
      assert.ok(day.afternoon.length > 0);
      assert.ok(day.evening.length > 0);
    }
  });
});
