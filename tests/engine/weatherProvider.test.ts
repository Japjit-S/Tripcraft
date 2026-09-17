import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateItinerary } from '../../src/lib/engine/index';
import { CuratedPackProvider } from '../../src/lib/providers/curatedPackProvider';
import { WeatherProvider } from '../../src/lib/providers/weatherProvider';

describe('WeatherProvider (Open-Meteo Integration)', () => {
  const weatherProvider = new WeatherProvider();
  const curatedProvider = new CuratedPackProvider();

  it('geocodes Jaipur into a valid normalized Destination', async () => {
    const dest = await weatherProvider.geocodeCity('Jaipur');
    assert.ok(dest);
    assert.equal(dest.city, 'Jaipur');
    assert.equal(dest.countryCode, 'IN');
    assert.ok(dest.latitude > 26 && dest.latitude < 27);
    assert.ok(dest.longitude > 75 && dest.longitude < 76);
  });

  it('returns null for an empty or invalid city name', async () => {
    const emptyResult = await weatherProvider.geocodeCity('');
    assert.equal(emptyResult, null);

    const nonsenseResult = await weatherProvider.geocodeCity('Zyxwvutsrqponmlkjihgfedcba999');
    assert.equal(nonsenseResult, null);
  });

  it('fetches forecast for near-term dates and uses cache on repeats', async () => {
    // Current date + 2 days is well within 16-day horizon
    const now = new Date();
    const nearDate = new Date(now.getTime() + 2 * 86400000).toISOString().slice(0, 10);

    const forecasts = await weatherProvider.fetchForecast({
      latitude: 26.9124,
      longitude: 75.7873,
      startDate: nearDate,
      days: 3,
    });

    assert.equal(forecasts.length, 3);
    assert.equal(forecasts[0].date, nearDate);
    assert.ok(forecasts[0].maxTemp > 0);
    assert.equal(forecasts[0].estimated, false, 'Near-term dates should be real forecasts');

    // Test caching on repeat
    const startCached = Date.now();
    const cachedForecasts = await weatherProvider.fetchForecast({
      latitude: 26.9124,
      longitude: 75.7873,
      startDate: nearDate,
      days: 3,
    });
    const elapsed = Date.now() - startCached;

    assert.equal(cachedForecasts.length, 3);
    assert.ok(elapsed < 20, 'Repeat call should serve instantly from in-memory cache');
  });

  it('handles the 16-day horizon hole with historical climate archive and estimated: true', async () => {
    // 90 days out into the future
    const now = new Date();
    const futureDate = new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 10);

    const forecasts = await weatherProvider.fetchForecast({
      latitude: 26.9124,
      longitude: 75.7873,
      startDate: futureDate,
      days: 3,
    });

    assert.equal(forecasts.length, 3);
    assert.equal(forecasts[0].date, futureDate);
    assert.equal(forecasts[0].estimated, true, 'Dates >16 days must be marked estimated: true');
  });

  it('end-to-end integration: geocode + weather + curated pack + engine', async () => {
    const dest = await weatherProvider.geocodeCity('Jaipur');
    assert.ok(dest);

    const now = new Date();
    const startDate = new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10);

    const weatherForecast = await weatherProvider.fetchForecast({
      latitude: dest.latitude,
      longitude: dest.longitude,
      startDate,
      days: 3,
    });

    const candidates = await curatedProvider.getCandidates(dest);

    const output = generateItinerary({
      destination: dest,
      startDate,
      days: 3,
      persona: 'Culture Seeker',
      weatherForecast,
      candidates,
    });

    assert.equal(output.success, true);
    assert.equal(output.itineraryDays.length, 3);
    assert.ok(output.auditLog.length > 0);
  });
});
