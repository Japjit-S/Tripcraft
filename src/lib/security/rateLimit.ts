/**
 * In-memory sliding window rate limiter for public Next.js API endpoints.
 * Provides abuse prevention, DoS mitigation, and deterministic header metadata.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

function purgeExpiredKeys(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    const valid = record.timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      rateLimitStore.delete(key);
    } else {
      record.timestamps = valid;
    }
  }
}

export interface RateLimitOptions {
  maxRequests: number; // e.g. 20
  windowMs: number; // e.g. 60,000 (1 minute)
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks and updates rate limit for a client identifier (e.g. IP address).
 */
export function checkRateLimit(
  clientId: string,
  options: RateLimitOptions = { maxRequests: 20, windowMs: 60 * 1000 }
): RateLimitResult {
  const { maxRequests, windowMs } = options;
  const now = Date.now();

  purgeExpiredKeys(windowMs);

  let record = rateLimitStore.get(clientId);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(clientId, record);
  }

  // Remove timestamps outside current sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetSeconds,
    };
  }

  record.timestamps.push(now);
  const resetSeconds = Math.ceil(windowMs / 1000);

  return {
    allowed: true,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - record.timestamps.length),
    resetSeconds,
  };
}

/**
 * Extracts client IP safely from request headers, falling back to localhost.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

/**
 * Resets rate limit store (for testing and isolation).
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}
