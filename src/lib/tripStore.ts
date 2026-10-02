import { AuditEntry, Trip } from './types';
import {
  ART_SCHEMA_VERSION,
  resolveLocalDestinationArtwork,
} from './images/sceneCatalog';
import { minutesToTimeStr, timeStrToMinutes } from './engine/timeline';

export interface GeneratedTrip extends Trip {
  auditLog?: AuditEntry[];
  warnings?: string[];
  feasibilityStatus?: 'PASSED' | 'CAUTION' | 'BLOCKED';
}

const STORAGE_PREFIX = 'tripcraft_trip_';
const LIST_KEY = 'tripcraft_trips_list';

/**
 * Ensures a trip record has a valid, up-to-date destination artwork descriptor.
 * Legacy trips without artwork metadata are deterministically upgraded.
 */
export function ensureTripArtwork(trip: GeneratedTrip): GeneratedTrip {
  if (
    trip.artwork &&
    trip.artwork.schemaVersion === ART_SCHEMA_VERSION &&
    trip.artwork.destinationId &&
    trip.artwork.fallbackScene &&
    (trip.artwork.assetPath?.startsWith('/artwork/') || trip.artwork.imageUrl)
  ) {
    return trip;
  }

  const destinationCity =
    typeof trip.destination === 'string'
      ? trip.destination
      : (trip.destination as { city?: string } | undefined)?.city || '';

  const resolvedArtwork = resolveLocalDestinationArtwork({
    id: trip.destinationId,
    city: destinationCity,
    country: trip.destinationCountry,
    countryCode: trip.destinationCountryCode,
    admin1: trip.destinationAdmin1,
    latitude: trip.destinationCoords?.lat,
    longitude: trip.destinationCoords?.lon,
  });

  return {
    ...trip,
    destinationId: trip.destinationId || resolvedArtwork.destinationId,
    bannerUrl:
      trip.bannerUrl || resolvedArtwork.assetPath || resolvedArtwork.imageUrl,
    artwork: resolvedArtwork,
  };
}

export function upgradeLegacyTrip(trip: GeneratedTrip): GeneratedTrip {
  const withArtwork = ensureTripArtwork(trip);

  const upgradedDays = (withArtwork.itineraryDays || []).map((day) => {
    const weatherSource = day.weatherSource || (day.isEstimatedWeather ? 'historical_estimate' : 'forecast');
    const weatherConfidence = day.weatherConfidence || (day.isEstimatedWeather ? 'low' : 'high');
    const weatherResolution = day.weatherResolution || 'daily';

    if (day.timeline && day.timeline.length > 0) {
      return {
        ...day,
        weatherSource,
        weatherConfidence,
        weatherResolution,
      };
    }

    const morningItems = (day.morning || []).map((item, idx) => {
      const startTime = item.startTime || `${(9 + idx).toString().padStart(2, '0')}:00`;
      const durationMin = item.durationMin || item.typicalDurationMin || 90;
      const startMin = timeStrToMinutes(startTime) ?? (9 + idx) * 60;
      const endTime = item.endTime || minutesToTimeStr(startMin + durationMin);
      return {
        ...item,
        slot: 'MORNING' as const,
        startTime,
        endTime,
        durationMin,
        eventKind: item.eventKind || 'activity',
      };
    });
    const afternoonItems = (day.afternoon || []).map((item, idx) => {
      const startTime = item.startTime || `${(13 + idx).toString().padStart(2, '0')}:30`;
      const durationMin = item.durationMin || item.typicalDurationMin || 90;
      const startMin = timeStrToMinutes(startTime) ?? ((13 + idx) * 60 + 30);
      const endTime = item.endTime || minutesToTimeStr(startMin + durationMin);
      return {
        ...item,
        slot: 'AFTERNOON' as const,
        startTime,
        endTime,
        durationMin,
        eventKind: item.eventKind || 'activity',
      };
    });
    const eveningItems = (day.evening || []).map((item, idx) => {
      const startTime = item.startTime || `${(18 + idx).toString().padStart(2, '0')}:30`;
      const durationMin = item.durationMin || item.typicalDurationMin || 90;
      const startMin = timeStrToMinutes(startTime) ?? ((18 + idx) * 60 + 30);
      const endTime = item.endTime || minutesToTimeStr(startMin + durationMin);
      return {
        ...item,
        slot: 'EVENING' as const,
        startTime,
        endTime,
        durationMin,
        eventKind: item.eventKind || (item.category === 'FOOD' ? 'meal' : 'activity'),
      };
    });

    return {
      ...day,
      weatherSource,
      weatherConfidence,
      weatherResolution,
      morning: morningItems,
      afternoon: afternoonItems,
      evening: eveningItems,
      timeline: [...morningItems, ...afternoonItems, ...eveningItems],
    };
  });

  return {
    ...withArtwork,
    version: 2,
    destinationTimezone: withArtwork.destinationTimezone || 'UTC',
    itineraryDays: upgradedDays,
  };
}

/**
 * Saves a generated trip and its audit log to client storage
 */
export function saveTripToStorage(trip: GeneratedTrip): void {
  if (typeof window === 'undefined') return;

  try {
    const normalizedTrip = upgradeLegacyTrip(trip);
    localStorage.setItem(
      `${STORAGE_PREFIX}${normalizedTrip.id}`,
      JSON.stringify(normalizedTrip)
    );

    // Update index list
    const existing = getAllStoredTrips();
    const filtered = existing.filter((t) => t.id !== normalizedTrip.id);
    const updated = [normalizedTrip, ...filtered];
    localStorage.setItem(LIST_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save trip to localStorage:', err);
  }
}

/**
 * Retrieves a saved trip by ID from client storage
 */
export function isIndiaDestinationTrip(trip: GeneratedTrip): boolean {
  const cc = (trip.destinationCountryCode || '').toUpperCase().trim();
  const country = (trip.destinationCountry || '').toLowerCase().trim();
  if (cc && cc !== 'IN') return false;
  if (country && country !== 'india') return false;
  return true;
}

export function getTripFromStorage(id: string): GeneratedTrip | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (raw) {
      const parsed = JSON.parse(raw) as GeneratedTrip;
      if (!isIndiaDestinationTrip(parsed)) {
        localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
        return null;
      }
      const upgraded = upgradeLegacyTrip(parsed);
      if (!parsed.artwork || !parsed.version) {
        localStorage.setItem(
          `${STORAGE_PREFIX}${id}`,
          JSON.stringify(upgraded)
        );
      }
      return upgraded;
    }
  } catch (err) {
    console.warn('Failed to retrieve trip from localStorage:', err);
  }
  return null;
}

/**
 * Retrieves all stored trips
 */
export function getAllStoredTrips(): GeneratedTrip[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GeneratedTrip[];
      let didUpgrade = false;
      const indiaOnly = parsed.filter((t) => {
        if (!isIndiaDestinationTrip(t)) {
          didUpgrade = true;
          return false;
        }
        return true;
      });
      const upgraded = indiaOnly.map((t) => {
        if (!t.artwork || !t.version) didUpgrade = true;
        return upgradeLegacyTrip(t);
      });
      if (didUpgrade) {
        localStorage.setItem(LIST_KEY, JSON.stringify(upgraded));
      }
      return upgraded;
    }
  } catch (err) {
    console.warn('Failed to retrieve trips list from localStorage:', err);
  }
  return [];
}

/**
 * Clears all stored trips and metadata from client storage (used during data wipe / reset)
 */
export function clearAllStoredTrips(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(STORAGE_PREFIX) || key === LIST_KEY)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn('Failed to clear trips from localStorage:', err);
  }
}

/**
 * Deletes a trip by ID from client storage
 */
export function deleteTripFromStorage(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
    const existing = getAllStoredTrips();
    const updated = existing.filter((t) => t.id !== id);
    localStorage.setItem(LIST_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete trip from localStorage:', err);
  }
}

