import { AuditEntry, Trip } from './types';

export interface GeneratedTrip extends Trip {
  auditLog?: AuditEntry[];
  warnings?: string[];
  feasibilityStatus?: 'PASSED' | 'CAUTION' | 'BLOCKED';
}

const STORAGE_PREFIX = 'tripcraft_trip_';
const LIST_KEY = 'tripcraft_trips_list';

/**
 * Saves a generated trip and its audit log to client storage
 */
export function saveTripToStorage(trip: GeneratedTrip): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${trip.id}`, JSON.stringify(trip));

    // Update index list
    const existing = getAllStoredTrips();
    const filtered = existing.filter((t) => t.id !== trip.id);
    const updated = [trip, ...filtered];
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
      return JSON.parse(raw) as GeneratedTrip;
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
      return JSON.parse(raw) as GeneratedTrip[];
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

