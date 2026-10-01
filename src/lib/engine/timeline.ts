import {
  CandidateActivity,
  DayOfWeek,
  TimeWindow,
} from '../types/engine';
import { calculateDistanceKm } from './clustering';

/**
 * Converts a 24h or 12h time string (e.g. "09:30", "9:30 AM", "14:15") to minutes from midnight (0–1439).
 */
export function timeStrToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return Math.min(1439, Math.max(0, hours * 60 + minutes));
}

/**
 * Converts minutes from midnight (0–1439) into a 24h "HH:MM" string.
 */
export function minutesToTimeStr(minutes: number): string {
  const bounded = Math.min(1439, Math.max(0, Math.round(minutes)));
  const h = Math.floor(bounded / 60);
  const m = bounded % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Formats a 24h "HH:MM" string into friendly 12h display (e.g. "9:30 AM", "2:15 PM").
 */
export function formatTime12h(timeStr: string): string {
  const mins = timeStrToMinutes(timeStr);
  if (mins === null) return timeStr;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Deterministically estimates transit duration in minutes between two coordinates.
 * Relies on Haversine distance without external paid APIs.
 */
export function estimateTransitMinutes(
  fromCoords?: { lat: number; lon: number },
  toCoords?: { lat: number; lon: number }
): number {
  if (!fromCoords || !toCoords) return 20;

  const distKm = calculateDistanceKm(fromCoords, toCoords);
  if (distKm <= 0.5) return 10;
  if (distKm <= 2) return 15;
  if (distKm <= 7) return 25;
  if (distKm <= 15) return 35;
  if (distKm <= 30) return 50;
  return 60;
}

/**
 * Evaluates whether a candidate activity can physically be visited within a scheduled time interval.
 * Returns true if open or if hours are unlisted/unknown.
 */
export function isVenueOpenDuringInterval(
  candidate: CandidateActivity,
  dayOfWeek: DayOfWeek | string,
  startMin: number,
  endMin: number
): { isOpen: boolean; reason?: string; isHoursKnown: boolean } {
  if (!candidate.openingHours || typeof candidate.openingHours !== 'object') {
    return { isOpen: true, isHoursKnown: false };
  }

  const normalizedDay = (dayOfWeek || '').toLowerCase() as DayOfWeek;
  const schedule = candidate.openingHours[normalizedDay];
  if (schedule === 'closed') {
    return {
      isOpen: false,
      isHoursKnown: true,
      reason: `${candidate.title} is closed on ${dayOfWeek}s according to opening schedule.`,
    };
  }

  if (!schedule || schedule.length === 0) {
    return { isOpen: true, isHoursKnown: false };
  }

  // Check if the scheduled visit overlaps at least partially with any open time window
  const matchesWindow = schedule.some((window: TimeWindow) => {
    const openMin = timeStrToMinutes(window.open);
    const closeMin = timeStrToMinutes(window.close);
    if (openMin === null || closeMin === null) return true;

    // Venue must be open during a substantial portion of the visit
    const overlapStart = Math.max(startMin, openMin);
    const overlapEnd = Math.min(endMin, closeMin);
    return overlapEnd - overlapStart >= Math.min(30, (endMin - startMin) * 0.5);
  });

  if (!matchesWindow) {
    const windowsText = schedule.map((w) => `${w.open}–${w.close}`).join(', ');
    return {
      isOpen: false,
      isHoursKnown: true,
      reason: `${candidate.title} opening hours (${windowsText}) do not fit scheduled window (${minutesToTimeStr(startMin)}–${minutesToTimeStr(endMin)}).`,
    };
  }

  return { isOpen: true, isHoursKnown: true };
}

/**
 * Identifies if a candidate qualifies as a multi-day or multi-slot expedition
 * (e.g. Himalayan treks, high-altitude pass walks, national park safaris).
 */
export function isExpeditionCandidate(candidate: CandidateActivity): boolean {
  if (candidate.typicalDurationMin >= 240) return true;

  const titleLower = candidate.title.toLowerCase();
  const hasTrekKeyword =
    titleLower.includes('trek') ||
    titleLower.includes('trail') ||
    titleLower.includes('valley') ||
    titleLower.includes('pass') ||
    titleLower.includes('peak') ||
    titleLower.includes('hike');

  const hasTrekTag = candidate.tags.some((t) => {
    const l = t.toLowerCase();
    return l.includes('trek') || l.includes('hiking') || l.includes('mountaineering') || l.includes('trail');
  });

  return candidate.category === 'NATURE' && (hasTrekKeyword || hasTrekTag);
}
