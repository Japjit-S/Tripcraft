import { AuditEntry, Trip } from './types';
import {
  ART_SCHEMA_VERSION,
  resolveLocalDestinationArtwork,
} from './images/sceneCatalog';

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
    trip.artwork.fallbackScene
  ) {
    return trip;
  }

  const resolvedArtwork = resolveLocalDestinationArtwork({
    id: trip.destinationId,
    city: trip.destination,
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
      trip.bannerUrl || resolvedArtwork.imageUrl || resolvedArtwork.assetPath,
    artwork: resolvedArtwork,
  };
}

/**
 * Saves a generated trip and its audit log to client storage
 */
export function saveTripToStorage(trip: GeneratedTrip): void {
  if (typeof window === 'undefined') return;

  try {
    const normalizedTrip = ensureTripArtwork(trip);
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
export function getTripFromStorage(id: string): GeneratedTrip | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (raw) {
      const parsed = JSON.parse(raw) as GeneratedTrip;
      const upgraded = ensureTripArtwork(parsed);
      if (!parsed.artwork) {
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
      const upgraded = parsed.map((t) => {
        if (!t.artwork) didUpgrade = true;
        return ensureTripArtwork(t);
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

