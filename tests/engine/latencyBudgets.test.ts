import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/itineraries/generate/route';
import { GET } from '../../src/app/api/destinations/search/route';
import {
  checkRateLimit,
  getClientIp,
  resetRateLimitStore,
} from '../../src/lib/security/rateLimit';
import {
  isCircuitAvailable,
  recordFailure,
  recordSuccess,
  resetCircuitBreakers,
  withCircuitBreaker,
} from '../../src/lib/providers/circuitBreaker';
import { OsmActivityProvider } from '../../src/lib/providers/osmProvider';
import { mockDestination } from './fixtures';

describe('Latency Budgets, Degradation & Public API Protection (Stage 4)', () => {
  beforeEach(() => {
    resetRateLimitStore();
    resetCircuitBreakers();
  });

  // ==========================================
  // 1. Sliding Window Rate Limiting
  // ==========================================
  it('Allows requests within limits and rejects requests exceeding sliding window with 429', () => {
    const ip = '198.51.100.42';

    // Allow first 3 requests with limit = 3
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit(ip, { maxRequests: 3, windowMs: 10000 });
      assert.equal(result.allowed, true);
      assert.equal(result.remaining, 2 - i);
    }

    // 4th request must be rejected
    const blocked = checkRateLimit(ip, { maxRequests: 3, windowMs: 10000 });
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.resetSeconds > 0);

    // Another client IP should still be allowed
    const otherResult = checkRateLimit('198.51.100.99', { maxRequests: 3, windowMs: 10000 });
    assert.equal(otherResult.allowed, true);
  });

  it('Extracts client IP safely from forwarded headers with fallback', () => {
    const reqWithForwarded = new Request('https://roamwise.app/api/destinations/search', {
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
    });
    assert.equal(getClientIp(reqWithForwarded), '203.0.113.195');

    const reqWithoutHeaders = new Request('https://roamwise.app/api/destinations/search');
    assert.equal(getClientIp(reqWithoutHeaders), '127.0.0.1');
  });

  // ==========================================
  // 2. Upstream Circuit Breaker & Fail-Fast Protection
  // ==========================================
  it('Circuit breaker enters OPEN state after consecutive failures and skips dead mirrors', async () => {
    const mirror = 'https://failing-overpass.example.com/api/interpreter';

    assert.equal(isCircuitAvailable(mirror), true);

    // Record 2 failures
    recordFailure(mirror, { failureThreshold: 2, cooldownMs: 5000 });
    assert.equal(isCircuitAvailable(mirror), true); // 1st failure

    recordFailure(mirror, { failureThreshold: 2, cooldownMs: 5000 });
    // Now circuit is OPEN
    assert.equal(isCircuitAvailable(mirror, { failureThreshold: 2, cooldownMs: 5000 }), false);

    // Calling withCircuitBreaker immediately throws without network call
    await assert.rejects(
      () =>
        withCircuitBreaker(mirror, async () => 'data', {
          failureThreshold: 2,
          cooldownMs: 5000,
        }),
      { message: `Circuit open for endpoint: ${mirror}` }
    );

    // Success on recovery resets failures
    recordSuccess(mirror);
    assert.equal(isCircuitAvailable(mirror), true);
  });

  // ==========================================
  // 3. Typed Discovery Outcomes & Partial Degradation
  // ==========================================
  it('OsmActivityProvider returns typed outcome and degrades to cached/partial without crashing', async () => {
    const provider = new OsmActivityProvider();

    // Use fixture-based destination
    const res = await provider.getCandidatesWithOutcome(mockDestination);
    assert.ok(Array.isArray(res.candidates));
    assert.ok(['fresh', 'cached', 'partial'].includes(res.outcome));

    // Calling again immediately hits in-memory cache
    const cachedRes = await provider.getCandidatesWithOutcome(mockDestination);
    assert.equal(cachedRes.outcome, 'cached');
  });

  // ==========================================
  // 4. Public API Endpoint Abuse & Payload Protection
  // ==========================================
  it('POST /api/itineraries/generate rejects payloads exceeding 32KB with 413 Payload Too Large', async () => {
    const oversizedReq = new NextRequest('http://localhost:3000/api/itineraries/generate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '45000',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify({ city: 'Jaipur' }),
    });

    const res = await POST(oversizedReq);
    assert.equal(res.status, 413);
    const data = await res.json();
    assert.match(data.error, /Payload too large/);
  });

  it('GET /api/destinations/search enforces rate limit headers and returns 429 when abused', async () => {
    const spamIp = '192.0.2.77';

    // Exhaust rate limit of 60
    for (let i = 0; i < 60; i++) {
      checkRateLimit(spamIp, { maxRequests: 60, windowMs: 60000 });
    }

    const req = new NextRequest('http://localhost:3000/api/destinations/search?q=Jaipur', {
      headers: { 'x-forwarded-for': spamIp },
    });

    const res = await GET(req);
    assert.equal(res.status, 429);
    assert.ok(res.headers.get('Retry-After'));
    assert.equal(res.headers.get('X-RateLimit-Remaining'), '0');
  });
});
