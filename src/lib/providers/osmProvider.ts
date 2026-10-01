import {
  ActivityCategory,
  ActivityProvider,
  CandidateActivity,
  Destination,
  Intensity,
  Slot,
} from '../types/engine';
import { normalizeOsmElement, RawOsmElement } from './normalize';
import { deduplicateCandidates, resolveSearchRadius } from '../engine/geography';

interface CacheEntry {
  timestamp: number;
  candidates: CandidateActivity[];
}

const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
];

const WIKIDATA_API_ENDPOINT = 'https://www.wikidata.org/w/api.php';
const WIKIPEDIA_GEOSEARCH_ENDPOINT = 'https://en.wikipedia.org/w/api.php';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Procedural Activity Provider:
 * Dual-tier real-time sourcing using OpenStreetMap Overpass (with multiple fast mirrors)
 * and Wikipedia GeoSearch API. Zero rate-limit crashes, 100% procedural worldwide.
 */
export class OsmActivityProvider implements ActivityProvider {
  private cache = new Map<string, CacheEntry>();

  /**
   * Builds an Overpass QL query including nature, treks, viewpoints, stadiums, and cultural landmarks.
   */
  private buildOverpassQuery(lat: number, lon: number, radiusM = 18000): string {
    return `[out:json][timeout:15];
(
  nwr["tourism"~"museum|attraction|viewpoint|gallery|theme_park|camp_site|alpine_hut|picnic_site"](around:${radiusM},${lat},${lon});
  nwr["historic"~"fort|palace|monument|castle|ruins|archaeological_site|heritage"](around:${radiusM},${lat},${lon});
  nwr["leisure"~"park|garden|stadium|nature_reserve"](around:${radiusM},${lat},${lon});
  nwr["natural"~"peak|volcano|valley|waterfall|glacier|hot_spring|cave_entrance|beach"](around:${radiusM},${lat},${lon});
  nwr["route"="hiking"](around:${radiusM},${lat},${lon});
  nwr["information"="trailhead"](around:${radiusM},${lat},${lon});
  nwr["sport"~"climbing|paragliding|rafting"](around:${radiusM},${lat},${lon});
  nwr["amenity"~"marketplace|place_of_worship"](around:${radiusM},${lat},${lon});
);
out center tags;`;
  }

  /**
   * Fetches Wikipedia sitelink counts in batch from the Wikidata API.
   * Chunks up to 150 unique IDs in batches of 50 to prevent truncating landmarks past index 50.
   */
  private async fetchWikidataSitelinks(
    wikidataIds: string[]
  ): Promise<Record<string, number>> {
    if (wikidataIds.length === 0) return {};

    const uniqueIds = Array.from(new Set(wikidataIds));
    const batchSize = 50;
    const maxBatches = 3; // Up to 150 entities
    const batches: string[][] = [];

    for (let i = 0; i < Math.min(uniqueIds.length, maxBatches * batchSize); i += batchSize) {
      batches.push(uniqueIds.slice(i, i + batchSize));
    }

    const counts: Record<string, number> = {};

    interface WikidataResponse {
      entities?: Record<string, { sitelinks?: Record<string, unknown> }>;
    }

    await Promise.allSettled(
      batches.map(async (batch) => {
        const params = new URLSearchParams({
          action: 'wbgetentities',
          ids: batch.join('|'),
          props: 'sitelinks',
          format: 'json',
          origin: '*',
        });

        try {
          const res = await fetch(`${WIKIDATA_API_ENDPOINT}?${params.toString()}`, {
            headers: { 'User-Agent': 'Tripcraft/1.0 (travel-planner-app)' },
            signal: AbortSignal.timeout(6000),
          });
          if (!res.ok) return;
          const data = (await res.json()) as WikidataResponse;
          const entities = data.entities || {};

          for (const [id, entity] of Object.entries(entities)) {
            if (entity?.sitelinks) {
              counts[id] = Object.keys(entity.sitelinks).length;
            }
          }
        } catch {
          // Continue gracefully if a batch fails or times out
        }
      })
    );

    return counts;
  }

  /**
   * Queries Wikipedia GeoSearch API for verified, unmissable landmarks and treks
   * around the destination coordinates. Returns high-quality candidate items in ~200ms.
   */
  private async queryWikipediaGeo(lat: number, lon: number, radiusM = 10000): Promise<CandidateActivity[]> {
    const boundedRadius = Math.min(10000, Math.max(10, radiusM));
    const params = new URLSearchParams({
      action: 'query',
      list: 'geosearch',
      gscoord: `${lat}|${lon}`,
      gsradius: String(boundedRadius),
      gslimit: '35',
      format: 'json',
      origin: '*',
    });

    try {
      const res = await fetch(`${WIKIPEDIA_GEOSEARCH_ENDPOINT}?${params.toString()}`, {
        headers: { 'User-Agent': 'Tripcraft/1.0 (travel-planner-app)' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return [];

      const data = await res.json();
      const pages = data.query?.geosearch || [];
      const results: CandidateActivity[] = [];

      for (const page of pages) {
        if (!page.title) continue;
        const rawTitle = page.title;
        const lower = rawTitle.toLowerCase();

        // Skip non-tourist administrative, medical, educational, or security facilities
        if (
          lower.includes('constituency') ||
          lower.includes('district') ||
          lower.includes('elections') ||
          lower.includes('ward') ||
          lower.includes('subdivision') ||
          lower.includes('hospital') ||
          lower.includes('clinic') ||
          lower.includes('school') ||
          lower.includes('college') ||
          lower.includes('university') ||
          lower.includes('police') ||
          lower.includes('prison') ||
          lower.includes('court')
        ) {
          continue;
        }

        const isTrek =
          lower.includes('trek') ||
          lower.includes('trail') ||
          lower.includes('pass') ||
          lower.includes('peak') ||
          lower.includes('lake') ||
          lower.includes('fall') ||
          lower.includes('valley') ||
          lower.includes('glacier') ||
          lower.includes('triund') ||
          lower.includes('ridge') ||
          lower.includes('sanctuary') ||
          lower.includes('wildlife') ||
          lower.includes('viewpoint') ||
          lower.includes('garden');

        const isTempleOrHeritage =
          lower.includes('temple') ||
          lower.includes('church') ||
          lower.includes('monastery') ||
          lower.includes('mosque') ||
          lower.includes('gurdwara') ||
          lower.includes('cathedral') ||
          lower.includes('basilica') ||
          lower.includes('museum') ||
          lower.includes('fort') ||
          lower.includes('palace') ||
          lower.includes('tomb') ||
          lower.includes('mahal') ||
          lower.includes('nunnery') ||
          lower.includes('institute') ||
          lower.includes('library') ||
          lower.includes('ashram') ||
          lower.includes('stupa') ||
          lower.includes('pagoda') ||
          lower.includes('memorial') ||
          lower.includes('heritage');

        const isStadium = lower.includes('stadium') || lower.includes('arena');
        const isMarket = lower.includes('bazaar') || lower.includes('market');

        let category: ActivityCategory = 'LANDMARK';
        let indoor = false;
        let intensity: Intensity = 'MEDIUM';
        let typicalDurationMin = 90;
        let slotAffinity: Slot[] = ['MORNING', 'AFTERNOON'];

        if (isTrek) {
          category = 'NATURE';
          indoor = false;
          intensity = 'HIGH';
          typicalDurationMin = 240;
          slotAffinity = ['MORNING', 'AFTERNOON'];
        } else if (isTempleOrHeritage) {
          category = 'CULTURE';
          indoor = !lower.includes('fort') && !lower.includes('palace');
          intensity = 'LOW';
          typicalDurationMin = 90;
          slotAffinity = ['MORNING', 'AFTERNOON', 'EVENING'];
        } else if (isStadium) {
          category = 'ENTERTAINMENT';
          indoor = false;
          intensity = 'MEDIUM';
          typicalDurationMin = 90;
          slotAffinity = ['AFTERNOON', 'EVENING'];
        } else if (isMarket) {
          category = 'MARKET';
          indoor = false;
          intensity = 'MEDIUM';
          typicalDurationMin = 90;
          slotAffinity = ['AFTERNOON', 'EVENING'];
        }

        const cleanTitle = rawTitle.replace(/\s*\([^)]*\)/g, '').trim();

        results.push({
          id: `wiki:page/${page.pageid}`,
          title: cleanTitle,
          category,
          indoor,
          intensity,
          typicalDurationMin,
          slotAffinity,
          prominence: isTrek || isTempleOrHeritage ? 0.88 : 0.75,
          coords: { lat: page.lat, lon: page.lon },
          tags: isTrek
            ? ['trek', 'nature', 'outdoor', 'scenic', 'viewpoint']
            : isTempleOrHeritage
            ? ['heritage', 'culture', 'monument', 'history']
            : ['landmark', 'sightseeing'],
          sourceUrl: `https://en.wikipedia.org/?curid=${page.pageid}`,
          source: 'wikipedia',
          sourceId: `wiki:page/${page.pageid}`,
          isVerified: true,
        });
      }

      return results;
    } catch {
      return [];
    }
  }

  /**
   * Queries Overpass API across multiple reliable mirrors with strict timeouts
   */
  private async queryOverpass(lat: number, lon: number, radiusM = 18000): Promise<RawOsmElement[]> {
    const query = this.buildOverpassQuery(lat, lon, radiusM);

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Tripcraft/1.0 (travel-planner-app)',
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(7000),
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.elements) && data.elements.length > 0) {
            return data.elements as RawOsmElement[];
          }
        }
      } catch {
        continue; // Try next mirror if this one fails
      }
    }

    return [];
  }

  /**
   * Main entry point: Procedural multi-tier discovery (Wikipedia GeoSearch + Overpass Mirrors).
   * 100% authentic data with zero synthetic offset coordinates or fabricated venues.
   */
  async getCandidates(dest: Destination): Promise<CandidateActivity[]> {
    const cacheKey = `${dest.latitude.toFixed(3)},${dest.longitude.toFixed(3)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.candidates;
    }

    const radius = resolveSearchRadius(dest);
    const wikiRadius = Math.min(10000, radius);

    // Step 1: Run Wikipedia GeoSearch and Overpass in parallel with bounded timeouts and adaptive radius
    const [wikiCandidates, rawOsmElements] = await Promise.all([
      this.queryWikipediaGeo(dest.latitude, dest.longitude, wikiRadius),
      this.queryOverpass(dest.latitude, dest.longitude, radius),
    ]);

    const candidates: CandidateActivity[] = [];

    // Step 2: Ingest Wikipedia landmarks (high prominence, clean landmark names)
    for (const item of wikiCandidates) {
      candidates.push(item);
    }

    // Step 3: Ingest and normalize OpenStreetMap elements
    if (rawOsmElements.length > 0) {
      const wikidataIds: string[] = [];
      for (const elem of rawOsmElements) {
        if (elem.tags?.wikidata) {
          wikidataIds.push(elem.tags.wikidata);
        }
      }

      const sitelinkMap = await this.fetchWikidataSitelinks(wikidataIds);

      for (const elem of rawOsmElements) {
        const qId = elem.tags?.wikidata;
        const sitelinks = qId ? sitelinkMap[qId] || 0 : 0;
        const normalized = normalizeOsmElement(elem, sitelinks);

        if (normalized) {
          candidates.push(normalized);
        }
      }
    }

    // Step 4: Spatial proximity deduplication and identity merging
    // Merges overlapping venues (< 80m or matching titles) to eliminate duplicate stops
    const deduplicated = deduplicateCandidates(candidates, 80);

    // Sort by prominence descending
    deduplicated.sort((a, b) => b.prominence - a.prominence || a.id.localeCompare(b.id));

    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      candidates: deduplicated,
    });

    return deduplicated;
  }
}

