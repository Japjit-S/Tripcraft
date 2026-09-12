import { CandidateActivity } from '../types/engine';

export interface Coordinates {
  lat: number;
  lon: number;
}

/**
 * Clean ~10-line Haversine distance calculation in kilometers.
 * Pure mathematical formula, zero external dependencies.
 */
export function calculateDistanceKm(c1: Coordinates, c2: Coordinates): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(c2.lat - c1.lat);
  const dLon = toRad(c2.lon - c1.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(c1.lat)) *
      Math.cos(toRad(c2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Assigns candidates to the nearest day anchor to form geographic clusters.
 * If no anchors exist, returns all candidates for each day.
 */
export function clusterCandidatesByAnchor(
  candidates: CandidateActivity[],
  dayAnchors: (CandidateActivity | null)[]
): Map<number, CandidateActivity[]> {
  const clusterMap = new Map<number, CandidateActivity[]>();

  for (let i = 0; i < dayAnchors.length; i++) {
    clusterMap.set(i + 1, []);
  }

  for (const candidate of candidates) {
    let closestDay = 1;
    let minDistance = Infinity;

    for (let dayIdx = 0; dayIdx < dayAnchors.length; dayIdx++) {
      const anchor = dayAnchors[dayIdx];
      if (!anchor) continue;
      const dist = calculateDistanceKm(candidate.coords, anchor.coords);
      if (dist < minDistance) {
        minDistance = dist;
        closestDay = dayIdx + 1;
      }
    }

    const currentList = clusterMap.get(closestDay) ?? [];
    currentList.push(candidate);
    clusterMap.set(closestDay, currentList);
  }

  return clusterMap;
}
