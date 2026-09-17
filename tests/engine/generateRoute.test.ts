import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/itineraries/generate/route';

function createMockRequest(body: Record<string, any>): NextRequest {
  return new NextRequest('http://localhost:3000/api/itineraries/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/itineraries/generate API Route', () => {
  it('validates required input fields and returns 400 on bad requests', async () => {
    // 1. Missing city
    const req1 = createMockRequest({
      startDate: '2026-10-15',
      days: 3,
      persona: 'Culture Seeker',
    });
    const res1 = await POST(req1);
    assert.equal(res1.status, 400);
    const data1 = await res1.json();
    assert.match(data1.error, /city name is required/i);

    // 2. Invalid duration
    const req2 = createMockRequest({
      city: 'Jaipur',
      startDate: '2026-10-15',
      days: 10,
      persona: 'Culture Seeker',
    });
    const res2 = await POST(req2);
    assert.equal(res2.status, 400);
    const data2 = await res2.json();
    assert.match(data2.error, /between 1 and 7/i);

    // 3. Invalid persona
    const req3 = createMockRequest({
      city: 'Jaipur',
      startDate: '2026-10-15',
      days: 3,
      persona: 'InvalidPersona',
    });
    const res3 = await POST(req3);
    assert.equal(res3.status, 400);
    const data3 = await res3.json();
    assert.match(data3.error, /persona must be one of/i);
  });

  it('returns 404 when city cannot be resolved by geocoding', async () => {
    const req = createMockRequest({
      city: 'NonExistentCityXyz123456789',
      startDate: '2026-10-15',
      days: 3,
      persona: 'Culture Seeker',
    });
    const res = await POST(req);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.match(data.error, /unable to geocode/i);
  });

  it('generates a full itinerary and audit trail for Jaipur', async () => {
    const req = createMockRequest({
      city: 'Jaipur',
      startDate: '2026-10-15',
      days: 3,
      persona: 'Culture Seeker',
      originCity: 'New Delhi',
      arrivalMode: 'train',
      arrivalTime: '11:45 AM',
    });

    const res = await POST(req);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.destination.city, 'Jaipur');
    assert.equal(data.days, 3);
    assert.equal(data.itineraryDays.length, 3);
    assert.ok(data.auditLog.length > 0);

    // Verify day 1 arrival gate handled late train arrival
    const day1 = data.itineraryDays[0];
    const morningItems = day1.morning;
    assert.ok(
      morningItems.some((item: any) => item.id.includes('transit')),
      'Day 1 morning should collapse to arrival transit'
    );
  });
});
