import {
  ActivityProvider,
  CandidateActivity,
  Destination,
} from '../types/engine';
import { normalizeOsmElement, RawOsmElement } from './normalize';

interface CacheEntry {
  timestamp: number;
  candidates: CandidateActivity[];
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const WIKIDATA_API_ENDPOINT = 'https://www.wikidata.org/w/api.php';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Provider B: OpenStreetMap Overpass + Wikidata Prominence Provider.
 * Free, open-data sourcing covering arbitrary cities worldwide.
 */
export class OsmActivityProvider implements ActivityProvider {
  private cache = new Map<string, CacheEntry>();

  /**
   * Builds an Overpass QL query searching for key tourism, historic, leisure,
   * and amenity objects within a radius around the city center.
   */
  private buildOverpassQuery(lat: number, lon: number, radiusM = 15000): string {
    return `[out:json][timeout:20];
(
  nwr["tourism"~"museum|attraction|viewpoint|gallery|theme_park"](around:${radiusM},${lat},${lon});
  nwr["historic"~"fort|palace|monument|castle|ruins"](around:${radiusM},${lat},${lon});
  nwr["leisure"~"park|garden"](around:${radiusM},${lat},${lon});
  nwr["amenity"~"marketplace|place_of_worship"](around:${radiusM},${lat},${lon});
);
out center tags;`;
  }

  /**
   * Fetches Wikipedia sitelink counts in batch from the Wikidata API
   */
  private async fetchWikidataSitelinks(
    wikidataIds: string[]
  ): Promise<Record<string, number>> {
    if (wikidataIds.length === 0) return {};

    const uniqueIds = Array.from(new Set(wikidataIds)).slice(0, 50);
    const params = new URLSearchParams({
      action: 'wbgetentities',
      ids: uniqueIds.join('|'),
      props: 'sitelinks',
      format: 'json',
      origin: '*',
    });

    try {
      const res = await fetch(`${WIKIDATA_API_ENDPOINT}?${params.toString()}`, {
        headers: { 'User-Agent': 'Tripcraft/1.0 (travel-planner-app)' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return {};
      const data = await res.json();
      const entities = data.entities || {};
      const counts: Record<string, number> = {};

      for (const [id, entity] of Object.entries<any>(entities)) {
        if (entity && entity.sitelinks) {
          counts[id] = Object.keys(entity.sitelinks).length;
        }
      }
      return counts;
    } catch {
      // Graceful fallback to 0 sitelinks if Wikidata query times out
      return {};
    }
  }

  /**
   * Queries Overpass API for elements around coords
   */
  private async queryOverpass(lat: number, lon: number): Promise<RawOsmElement[]> {
    const query = this.buildOverpassQuery(lat, lon);

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Tripcraft/1.0 (travel-planner-app)',
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const data = await response.json();
          return (data.elements || []) as RawOsmElement[];
        }
      } catch {
        continue; // Try next mirror if this one fails
      }
    }

    throw new Error(
      `Failed to query OpenStreetMap Overpass API for coordinates (${lat}, ${lon}).`
    );
  }

  /**
   * Main entry point: Slices and normalizes OSM items with Wikidata prominence
   */
  async getCandidates(dest: Destination): Promise<CandidateActivity[]> {
    const cacheKey = `${dest.latitude.toFixed(3)},${dest.longitude.toFixed(3)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.candidates;
    }

    const rawElements = await this.queryOverpass(dest.latitude, dest.longitude);

    // Extract Wikidata IDs for prominence joining
    const wikidataIds: string[] = [];
    for (const elem of rawElements) {
      if (elem.tags?.wikidata) {
        wikidataIds.push(elem.tags.wikidata);
      }
    }

    const sitelinkMap = await this.fetchWikidataSitelinks(wikidataIds);

    const candidates: CandidateActivity[] = [];
    const seenTitles = new Set<string>();

    for (const elem of rawElements) {
      const qId = elem.tags?.wikidata;
      const sitelinks = qId ? sitelinkMap[qId] || 0 : 0;
      const normalized = normalizeOsmElement(elem, sitelinks);

      if (normalized) {
        const titleKey = normalized.title.toLowerCase().trim();
        if (!seenTitles.has(titleKey)) {
          seenTitles.add(titleKey);
          candidates.push(normalized);
        }
      }
    }

    // Sort by prominence descending
    candidates.sort((a, b) => b.prominence - a.prominence || a.id.localeCompare(b.id));

    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      candidates,
    });

    return candidates;
  }
}
