/**
 * Circuit breaker for external upstream providers (Overpass, Wikidata, Open-Meteo).
 * Prevents cascading timeouts and avoids wasting latency on failing mirrors.
 */

interface BreakerState {
  failures: number;
  lastFailureAt: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const registry = new Map<string, BreakerState>();

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Failures before opening circuit (default 2)
  cooldownMs?: number; // Cooldown before trying again (default 30,000ms)
}

/**
 * Checks whether an upstream endpoint is currently available or in cooldown.
 */
export function isCircuitAvailable(endpoint: string, options?: CircuitBreakerOptions): boolean {
  const state = registry.get(endpoint);
  if (!state || state.state === 'CLOSED') return true;

  const cooldownMs = options?.cooldownMs ?? 30000;
  const now = Date.now();

  if (now - state.lastFailureAt > cooldownMs) {
    state.state = 'HALF_OPEN';
    return true;
  }

  return false;
}

/**
 * Records a successful request, resetting failure count.
 */
export function recordSuccess(endpoint: string): void {
  const state = registry.get(endpoint);
  if (state) {
    state.failures = 0;
    state.state = 'CLOSED';
  }
}

/**
 * Records a failed request (timeout or HTTP 5xx/429), incrementing failure count
 * and opening the circuit when the threshold is exceeded.
 */
export function recordFailure(endpoint: string, options?: CircuitBreakerOptions): void {
  const threshold = options?.failureThreshold ?? 2;
  const now = Date.now();

  let state = registry.get(endpoint);
  if (!state) {
    state = { failures: 0, lastFailureAt: now, state: 'CLOSED' };
    registry.set(endpoint, state);
  }

  state.failures++;
  state.lastFailureAt = now;

  if (state.failures >= threshold) {
    state.state = 'OPEN';
  }
}

/**
 * Executes an async task with circuit breaker tracking.
 */
export async function withCircuitBreaker<T>(
  endpoint: string,
  fn: () => Promise<T>,
  options?: CircuitBreakerOptions
): Promise<T> {
  if (!isCircuitAvailable(endpoint, options)) {
    throw new Error(`Circuit open for endpoint: ${endpoint}`);
  }

  try {
    const result = await fn();
    recordSuccess(endpoint);
    return result;
  } catch (err) {
    recordFailure(endpoint, options);
    throw err;
  }
}

/**
 * Resets the circuit breaker registry (for testing and isolation).
 */
export function resetCircuitBreakers(): void {
  registry.clear();
}
