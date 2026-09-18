import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NextRequest } from 'next/server';
import { GET } from '../../src/app/api/destinations/search/route';
import { WeatherProvider } from '../../src/lib/providers/weatherProvider';

function createMockSearchRequest(queryString: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/destinations/search${queryString}`, {
    method: 'GET',
  });
}

describe('GET /api/destinations/search API Route', () => {
  it('returns empty results array when query is missing or too short', async () => {
    // Missing query
    const req1 = createMockSearchRequest('');
    const res1 = await GET(req1);
    assert.equal(res1.status, 200);
    const data1 = await res1.json();
    assert.deepEqual(data1.results, []);

    // Single character query
    const req2 = createMockSearchRequest('?q=J');
    const res2 = await GET(req2);
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.deepEqual(data2.results, []);
  });

  it('rejects queries that exceed 60 characters with 400 Bad Request', async () => {
    const longQuery = 'A'.repeat(61);
    const req = createMockSearchRequest(`?q=${longQuery}`);
    const res = await GET(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /maximum 60 characters/i);
  });

  it('returns geocoded city suggestions for a valid city query', async () => {
    const req = createMockSearchRequest('?q=Jaipur');
    const res = await GET(req);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.results));
    assert.ok(data.results.length > 0);

    const first = data.results[0];
    assert.ok(first.id);
    assert.match(first.city, /jaipur/i);
    assert.equal(typeof first.latitude, 'number');
    assert.equal(typeof first.longitude, 'number');
    assert.ok(first.country);
  });

  it('WeatherProvider.searchCities returns empty array for short strings directly', async () => {
    const provider = new WeatherProvider();
    const results = await provider.searchCities('a');
    assert.deepEqual(results, []);
  });
});
