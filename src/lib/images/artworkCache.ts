import { DestinationArtworkDescriptor } from '../types/engine';
import { ART_RESOLVER_VERSION } from './sceneCatalog';

export const POSITIVE_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const NEGATIVE_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
export const DEFAULT_PROVIDER_BACKOFF_MS = 5 * 60 * 1000; // 5 minutes
export const MAX_PROVIDER_BACKOFF_MS = 60 * 60 * 1000; // 1 hour

export interface ArtworkCacheEntry {
  key: string;
  canonicalId: string;
  artVersion: string;
  descriptor: DestinationArtworkDescriptor;
  isNegativeLookupMatch: boolean;
  cachedAt: number;
  expiresAt: number;
}

export class DestinationArtworkCache {
  private entries = new Map<string, ArtworkCacheEntry>();
  private inFlight = new Map<string, Promise<DestinationArtworkDescriptor>>();
  private providerBackoffUntil = 0;
  private consecutiveProviderErrors = 0;

  private buildKey(canonicalId: string, artVersion = ART_RESOLVER_VERSION): string {
    return `${artVersion}:${canonicalId}`;
  }

  get(
    canonicalId: string,
    now = Date.now(),
    artVersion = ART_RESOLVER_VERSION
  ): DestinationArtworkDescriptor | null {
    const key = this.buildKey(canonicalId, artVersion);
    const entry = this.entries.get(key);
    if (!entry) return null;

    if (now >= entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }

    return entry.descriptor;
  }

  set(
    canonicalId: string,
    descriptor: DestinationArtworkDescriptor,
    options?: {
      isNegativeLookupMatch?: boolean;
      now?: number;
      ttlMs?: number;
      artVersion?: string;
    }
  ): void {
    const now = options?.now ?? Date.now();
    const artVersion = options?.artVersion ?? descriptor.artVersion ?? ART_RESOLVER_VERSION;
    const isNegative = Boolean(options?.isNegativeLookupMatch);
    const ttlMs =
      options?.ttlMs ??
      (isNegative ? NEGATIVE_CACHE_TTL_MS : POSITIVE_CACHE_TTL_MS);

    const key = this.buildKey(canonicalId, artVersion);
    this.entries.set(key, {
      key,
      canonicalId,
      artVersion,
      descriptor,
      isNegativeLookupMatch: isNegative,
      cachedAt: now,
      expiresAt: now + ttlMs,
    });
  }

  getInFlight(canonicalId: string): Promise<DestinationArtworkDescriptor> | undefined {
    return this.inFlight.get(canonicalId);
  }

  setInFlight(
    canonicalId: string,
    promise: Promise<DestinationArtworkDescriptor>
  ): void {
    this.inFlight.set(canonicalId, promise);
  }

  deleteInFlight(canonicalId: string): void {
    this.inFlight.delete(canonicalId);
  }

  isProviderInBackoff(now = Date.now()): boolean {
    return now < this.providerBackoffUntil;
  }

  getProviderBackoffUntil(): number {
    return this.providerBackoffUntil;
  }

  recordProviderSuccess(): void {
    this.consecutiveProviderErrors = 0;
    this.providerBackoffUntil = 0;
  }

  recordProviderFailure(retryAfterMs?: number, now = Date.now()): void {
    this.consecutiveProviderErrors += 1;
    const computedBackoff =
      typeof retryAfterMs === 'number' && retryAfterMs > 0
        ? Math.min(retryAfterMs, MAX_PROVIDER_BACKOFF_MS)
        : Math.min(
            DEFAULT_PROVIDER_BACKOFF_MS * Math.pow(2, this.consecutiveProviderErrors - 1),
            MAX_PROVIDER_BACKOFF_MS
          );
    this.providerBackoffUntil = Math.max(
      this.providerBackoffUntil,
      now + computedBackoff
    );
  }

  clear(): void {
    this.entries.clear();
    this.inFlight.clear();
    this.providerBackoffUntil = 0;
    this.consecutiveProviderErrors = 0;
  }
}

export const sharedArtworkCache = new DestinationArtworkCache();
