import { DestinationArtworkDescriptor } from '../types/engine';
import {
  DestinationArtworkCache,
  sharedArtworkCache,
} from './artworkCache';
import {
  DestinationIdentityInput,
  fnv1aHex,
  normalizeDestinationIdentity,
  normalizeToken,
} from './canonicalDestination';
import {
  ART_RESOLVER_VERSION,
  ART_SCHEMA_VERSION,
  buildLocalSceneParameters,
  resolveLocalDestinationArtwork,
} from './sceneCatalog';
import { lookupWikimediaIllustration } from './wikimediaProvider';

export interface ResolveArtworkOptions {
  cache?: DestinationArtworkCache;
  fetchImpl?: typeof fetch;
  enableExternalLookup?: boolean;
  now?: number;
}

/**
 * Server-side, cache-first destination artwork resolver.
 *
 * Resolution pipeline:
 * 1. Normalize geocoded destination into canonical identity (disambiguating same-name cities).
 * 2. Return bundled curated local illustration for the six flagship cities and their aliases.
 * 3. Reuse cached descriptor for previously resolved Tier 2 destinations.
 * 4. On cache miss, optionally perform a bounded server-side Wikimedia Commons lookup
 *    for a verified destination-matched illustration with complete attribution.
 * 5. If no trustworthy match exists or provider fails/backs off, return a deterministic
 *    local vector scene composed from bundled primitives.
 * 6. If destination metadata is incomplete, immediately return a local travel scene.
 */
export async function resolveDestinationArtwork(
  input: DestinationIdentityInput | string | null | undefined,
  options?: ResolveArtworkOptions
): Promise<DestinationArtworkDescriptor> {
  const cache = options?.cache ?? sharedArtworkCache;
  const now = options?.now ?? Date.now();
  const resolvedIso = new Date(now).toISOString();

  const identity = normalizeDestinationIdentity(input);

  // Step 2: Under India-only scope or incomplete metadata -> immediate local resolution with zero network calls
  const isIndia =
    identity.countryCode === 'IN' ||
    normalizeToken(identity.country) === 'india' ||
    (!identity.countryCode && !identity.country);

  if (isIndia || !identity.hasCompleteMetadata || !identity.country) {
    return resolveLocalDestinationArtwork(input, resolvedIso);
  }

  // Step 3: Cache lookup by canonical destination identity
  const cached = cache.get(identity.canonicalId, now, ART_RESOLVER_VERSION);
  if (cached) {
    return cached;
  }

  // Deduplicate concurrent requests for the same canonical destination
  const existingInFlight = cache.getInFlight(identity.canonicalId);
  if (existingInFlight) {
    return existingInFlight;
  }

  const enableExternal = options?.enableExternalLookup ?? true;

  const resolutionPromise = (async (): Promise<DestinationArtworkDescriptor> => {
    const localFallbackDescriptor = resolveLocalDestinationArtwork(
      input,
      resolvedIso
    );

    if (!enableExternal || cache.isProviderInBackoff(now)) {
      return localFallbackDescriptor;
    }

    // Step 4: Bounded server-side Wikimedia Commons lookup
    const outcome = await lookupWikimediaIllustration(
      identity,
      options?.fetchImpl ?? fetch
    );

    if (outcome.providerError) {
      cache.recordProviderFailure(outcome.retryAfterMs, now);
      return localFallbackDescriptor;
    }

    cache.recordProviderSuccess();

    if (outcome.match) {
      const fallbackScene = buildLocalSceneParameters(identity);
      const contentHash = fnv1aHex(
        `${ART_RESOLVER_VERSION}:${identity.canonicalId}:${outcome.match.imageUrl}`
      );
      const externalDescriptor: DestinationArtworkDescriptor = {
        schemaVersion: ART_SCHEMA_VERSION,
        artVersion: ART_RESOLVER_VERSION,
        destinationId: identity.canonicalId,
        artworkId: `art:ext:${identity.seedHash}`,
        kind: 'external_illustration',
        imageUrl: outcome.match.imageUrl,
        fallbackScene,
        alt: outcome.match.alt,
        landmarkVerified: false,
        focalPoint: { x: 0.7, y: 0.48 },
        attribution: outcome.match.attribution,
        resolvedAt: resolvedIso,
        contentHash,
      };

      cache.set(identity.canonicalId, externalDescriptor, {
        isNegativeLookupMatch: false,
        now,
      });
      return externalDescriptor;
    }

    // Step 5: No acceptable external illustration -> cache negative outcome & return local vector scene
    cache.set(identity.canonicalId, localFallbackDescriptor, {
      isNegativeLookupMatch: true,
      now,
    });
    return localFallbackDescriptor;
  })();

  cache.setInFlight(identity.canonicalId, resolutionPromise);

  try {
    return await resolutionPromise;
  } finally {
    cache.deleteInFlight(identity.canonicalId);
  }
}
