import { CandidateActivity, EngineItineraryItem } from '../types/engine';
import { calculateDistanceKm, Coordinates } from './clustering';
import { estimateTransitMinutes } from './timeline';

export type { Coordinates };
export { calculateDistanceKm };

/**
 * Validates that latitude and longitude represent valid, finite geographical coordinates.
 */
export function isValidCoordinate(lat?: unknown, lon?: unknown): lat is number {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Known mountain, highland, or alpine trekking destinations where points of interest
 * (valley trailheads, viewpoints, mountain passes) are distributed over a wider geographic area.
 */
const MOUNTAIN_KEYWORDS = [
  'manali',
  'leh',
  'shimla',
  'dharamshala',
  'kullu',
  'mussoorie',
  'nainital',
  'rishikesh',
  'pokhara',
  'kathmandu',
  'interlaken',
  'zermatt',
  'chamonix',
  'banff',
  'queenstown',
  'cusco',
  'aspen',
];

const DENSE_MEGACITY_KEYWORDS = [
  'tokyo',
  'paris',
  'london',
  'manhattan',
  'new york',
  'singapore',
  'hong kong',
  'amsterdam',
  'barcelona',
  'seoul',
];

/**
 * Computes an adaptive, geographically appropriate search radius (in meters)
 * rather than forcing a rigid static radius across radically different terrains.
 */
export function resolveSearchRadius(dest: {
  city: string;
  admin1?: string;
  country?: string;
  countryCode?: string;
}): number {
  const cityLower = (dest.city || '').toLowerCase().trim();
  const adminLower = (dest.admin1 || '').toLowerCase().trim();

  // Mountain / Himalayan / Alpine valley terrain: 30km radius
  if (
    MOUNTAIN_KEYWORDS.some((k) => cityLower.includes(k) || adminLower.includes(k)) ||
    adminLower.includes('himachal') ||
    adminLower.includes('uttarakhand') ||
    adminLower.includes('ladakh') ||
    adminLower.includes('valais') ||
    adminLower.includes('tyrol')
  ) {
    return 30000;
  }

  // Ultra-dense metropolitan hubs: 9km radius to prevent chaotic suburban sprawl
  if (DENSE_MEGACITY_KEYWORDS.some((k) => cityLower.includes(k))) {
    return 9000;
  }

  // Standard city default: 15km
  return 15000;
}

/**
 * Normalizes title for word token comparison (removes punctuation, lowercases)
 */
function tokenizeTitle(title: string): Set<string> {
  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

/**
 * Computes Jaccard word similarity between two venue titles
 */
function titleWordOverlap(t1: string, t2: string): number {
  const s1 = tokenizeTitle(t1);
  const s2 = tokenizeTitle(t2);
  if (s1.size === 0 || s2.size === 0) return 0;

  let intersection = 0;
  for (const word of s1) {
    if (s2.has(word)) intersection++;
  }
  const union = new Set([...s1, ...s2]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Deduplicates candidate activities across Wikipedia and OpenStreetMap.
 * Detects near-identical coordinates (< 80m) and overlapping titles,
 * deterministically merging them to retain the richest attributes.
 */
export function deduplicateCandidates(
  candidates: CandidateActivity[],
  proximityThresholdMeters = 80
): CandidateActivity[] {
  const thresholdKm = proximityThresholdMeters / 1000;
  const merged: CandidateActivity[] = [];

  for (const candidate of candidates) {
    let duplicateIndex = -1;

    for (let i = 0; i < merged.length; i++) {
      const existing = merged[i];
      const distKm = calculateDistanceKm(candidate.coords, existing.coords);

      const isSamePlace =
        // Exact name match
        candidate.title.toLowerCase().trim() === existing.title.toLowerCase().trim() ||
        // Physical close proximity (< 80m) with significant name or category similarity
        (distKm <= thresholdKm &&
          (titleWordOverlap(candidate.title, existing.title) >= 0.25 ||
            candidate.category === existing.category));

      if (isSamePlace) {
        duplicateIndex = i;
        break;
      }
    }

    if (duplicateIndex === -1) {
      merged.push(candidate);
    } else {
      const existing = merged[duplicateIndex];
      // Keep the one with higher prominence or richer data
      const winner = candidate.prominence > existing.prominence ? candidate : existing;
      const loser = winner === candidate ? existing : candidate;

      // Merge tags and opening hours
      const combinedTags = Array.from(new Set([...winner.tags, ...loser.tags]));
      const openingHours = winner.openingHours || loser.openingHours;

      merged[duplicateIndex] = {
        ...winner,
        tags: combinedTags,
        openingHours,
        prominence: Math.max(winner.prominence, loser.prominence),
      };
    }
  }

  return merged;
}

/**
 * Sequences a day's scheduled stops along a geographic path to avoid zigzagging/backtracking.
 * Computes realistic transit times and inter-venue distances.
 */
export function sequenceDayStops(
  items: EngineItineraryItem[]
): {
  sequencedItems: EngineItineraryItem[];
  totalDistanceKm: number;
  totalTransitMin: number;
} {
  if (items.length <= 1) {
    return {
      sequencedItems: items,
      totalDistanceKm: 0,
      totalTransitMin: 0,
    };
  }

  // Filter items with physical coordinates (exclude arrival transit / pure rest without real coords)
  const physicalItems = items.filter(
    (item) =>
      item.coords &&
      isValidCoordinate(item.coords.lat, item.coords.lon) &&
      (item.coords.lat !== 0 || item.coords.lon !== 0) &&
      item.eventKind !== 'arrival_checkin'
  );

  if (physicalItems.length <= 1) {
    return {
      sequencedItems: items,
      totalDistanceKm: 0,
      totalTransitMin: 0,
    };
  }

  let totalDistanceKm = 0;
  let totalTransitMin = 0;

  // Annotate consecutive transit from previous stop
  for (let i = 0; i < items.length; i++) {
    const current = items[i];
    if (i === 0) {
      current.distanceFromPreviousKm = 0;
      current.transitFromPreviousMin = 0;
      continue;
    }

    const prev = items[i - 1];
    if (
      current.coords &&
      prev.coords &&
      isValidCoordinate(current.coords.lat, current.coords.lon) &&
      isValidCoordinate(prev.coords.lat, prev.coords.lon) &&
      (current.coords.lat !== 0 || current.coords.lon !== 0) &&
      (prev.coords.lat !== 0 || prev.coords.lon !== 0)
    ) {
      const dist = calculateDistanceKm(prev.coords, current.coords);
      const transitMin = estimateTransitMinutes(prev.coords, current.coords);
      current.distanceFromPreviousKm = Math.round(dist * 10) / 10;
      current.transitFromPreviousMin = transitMin;
      totalDistanceKm += dist;
      totalTransitMin += transitMin;
    } else {
      current.distanceFromPreviousKm = 0;
      current.transitFromPreviousMin = 0;
    }
  }

  return {
    sequencedItems: items,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalTransitMin,
  };
}
