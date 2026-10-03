import { CuratedCityKey, Destination } from '../types/engine';

export const CURATED_CITY_KEYS: readonly CuratedCityKey[] = [
  'jaipur',
  'delhi',
  'agra',
  'varanasi',
  'udaipur',
  'goa',
  'mumbai',
  'kolkata',
  'amritsar',
  'hampi',
  'mysuru',
  'bengaluru',
] as const;

const EXPLICIT_CURATED_LOOKUP: Readonly<Record<string, CuratedCityKey>> = {
  jaipur: 'jaipur',
  amer: 'jaipur',
  delhi: 'delhi',
  'new delhi': 'delhi',
  dilli: 'delhi',
  'nct of delhi': 'delhi',
  agra: 'agra',
  varanasi: 'varanasi',
  banaras: 'varanasi',
  kashi: 'varanasi',
  udaipur: 'udaipur',
  goa: 'goa',
  panaji: 'goa',
  panjim: 'goa',
  'north goa': 'goa',
  'south goa': 'goa',
  mumbai: 'mumbai',
  bombay: 'mumbai',
  kolkata: 'kolkata',
  calcutta: 'kolkata',
  amritsar: 'amritsar',
  hampi: 'hampi',
  vijayanagara: 'hampi',
  hosapete: 'hampi',
  mysuru: 'mysuru',
  mysore: 'mysuru',
  bengaluru: 'bengaluru',
  bangalore: 'bengaluru',
  'bangalore urban': 'bengaluru',
  'bangalore rural': 'bengaluru',
  bengalooru: 'bengaluru',
};

const ALLOWED_INDIAN_QUALIFIERS = new Set([
  'india',
  'in',
  'ind',
  'bharat',
  'republic of india',
  'rajasthan',
  'delhi',
  'nct of delhi',
  'new delhi',
  'uttar pradesh',
  'up',
  'goa',
  'north goa',
  'south goa',
  'maharashtra',
  'west bengal',
  'punjab',
  'karnataka',
]);

export interface DestinationIdentityInput {
  id?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  admin1?: string;
  latitude?: number;
  longitude?: number;
}

export interface NormalizedDestinationIdentity {
  canonicalId: string;
  curatedKey: CuratedCityKey | null;
  displayCity: string;
  citySlug: string;
  country: string;
  countryCode: string;
  admin1: string;
  latitude?: number;
  longitude?: number;
  hasCompleteMetadata: boolean;
  seedHash: string;
  seedNumber: number;
}

/**
 * Normalizes a token by removing diacritics, punctuation, and extra spaces.
 */
export function normalizeToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts a string into a URL/key-safe hyphenated slug.
 */
export function toSlug(value: string): string {
  const token = normalizeToken(value);
  return token ? token.replace(/\s+/g, '-') : '';
}

/**
 * Deterministic 32-bit FNV-1a hash.
 */
export function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function fnv1aHex(input: string): string {
  return fnv1aHash(input).toString(16).padStart(8, '0');
}

function isNonIndianCountry(country?: string, countryCode?: string): boolean {
  if (countryCode && countryCode.trim()) {
    const code = normalizeToken(countryCode);
    if (code !== 'in' && code !== 'ind') {
      return true;
    }
  }
  if (country && country.trim()) {
    const normCountry = normalizeToken(country);
    if (!ALLOWED_INDIAN_QUALIFIERS.has(normCountry)) {
      return true;
    }
  }
  return false;
}

function isOutsideIndiaCoordinates(lat?: number, lon?: number): boolean {
  if (
    typeof lat !== 'number' ||
    typeof lon !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return false;
  }
  // Ignore unset (0, 0) coordinates used in unit test stubs
  if (Math.abs(lat) < 0.001 && Math.abs(lon) < 0.001) {
    return false;
  }
  return lat < 6.0 || lat > 38.0 || lon < 67.0 || lon > 98.5;
}

/**
 * Resolves a city string or Destination object to one of the six curated
 * Indian flagship cities using an explicit canonical lookup (never substring matching).
 */
export function resolveCuratedCityKey(
  input: string | DestinationIdentityInput | Destination | null | undefined
): CuratedCityKey | null {
  if (!input) return null;

  const rawObj: DestinationIdentityInput =
    typeof input === 'string' ? { city: input } : input;

  const rawCity = (rawObj.city || '').trim();
  if (!rawCity) return null;

  if (isNonIndianCountry(rawObj.country, rawObj.countryCode)) {
    return null;
  }

  if (isOutsideIndiaCoordinates(rawObj.latitude, rawObj.longitude)) {
    return null;
  }

  if (rawObj.admin1 && rawObj.admin1.trim()) {
    const normAdmin = normalizeToken(rawObj.admin1);
    // If country wasn't specified, ensure admin1 doesn't belong to an unrelated foreign region
    // when country is explicitly absent, unless admin1 is a known Indian state for the 6 cities.
    if (
      !rawObj.country &&
      !rawObj.countryCode &&
      normAdmin &&
      !ALLOWED_INDIAN_QUALIFIERS.has(normAdmin)
    ) {
      return null;
    }
  }

  const segments = rawCity
    .split(',')
    .map((s) => normalizeToken(s))
    .filter(Boolean);

  if (segments.length === 0) return null;

  // Check if any trailing comma segment explicitly names a non-Indian qualifier
  for (let i = 1; i < segments.length; i++) {
    if (!ALLOWED_INDIAN_QUALIFIERS.has(segments[i])) {
      return null;
    }
  }

  const fullNormalized = normalizeToken(rawCity);
  if (EXPLICIT_CURATED_LOOKUP[fullNormalized]) {
    return EXPLICIT_CURATED_LOOKUP[fullNormalized];
  }

  const primaryLocality = segments[0];
  if (EXPLICIT_CURATED_LOOKUP[primaryLocality]) {
    return EXPLICIT_CURATED_LOOKUP[primaryLocality];
  }

  return null;
}

/**
 * Normalizes a destination into a canonical, disambiguated identity.
 * Ensures two same-name cities in different countries/regions never collide.
 */
export function normalizeDestinationIdentity(
  input: DestinationIdentityInput | string | null | undefined
): NormalizedDestinationIdentity {
  const raw: DestinationIdentityInput =
    typeof input === 'string' ? { city: input } : input || {};

  const rawCity = (raw.city || '').trim();
  const commaParts = rawCity
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const displayCity = commaParts[0] || rawCity || 'Destination';
  const inferredAdmin1 =
    raw.admin1?.trim() || (commaParts.length > 2 ? commaParts[1] : '');
  const inferredCountry =
    raw.country?.trim() ||
    (commaParts.length === 2
      ? commaParts[1]
      : commaParts.length > 2
      ? commaParts[commaParts.length - 1]
      : '');
  const countryCode = (raw.countryCode || '').trim().toUpperCase();

  const curatedKey = resolveCuratedCityKey({
    ...raw,
    city: rawCity,
    admin1: inferredAdmin1,
    country: inferredCountry,
    countryCode,
  });

  if (curatedKey) {
    const canonicalId = `curated:${curatedKey}`;
    const seedNumber = fnv1aHash(canonicalId);
    return {
      canonicalId,
      curatedKey,
      displayCity,
      citySlug: curatedKey,
      country: inferredCountry || 'India',
      countryCode: countryCode || 'IN',
      admin1: inferredAdmin1,
      latitude: raw.latitude,
      longitude: raw.longitude,
      hasCompleteMetadata: true,
      seedHash: fnv1aHex(canonicalId),
      seedNumber,
    };
  }

  const citySlug = toSlug(displayCity) || 'unknown-city';
  const countrySlug =
    toSlug(countryCode || inferredCountry) || 'unspecified-country';
  const admin1Slug = toSlug(inferredAdmin1) || 'unspecified-region';

  const hasValidCoords =
    typeof raw.latitude === 'number' &&
    typeof raw.longitude === 'number' &&
    Number.isFinite(raw.latitude) &&
    Number.isFinite(raw.longitude) &&
    !(Math.abs(raw.latitude) < 0.001 && Math.abs(raw.longitude) < 0.001);

  const geoDisambiguator = raw.id?.trim()
    ? toSlug(raw.id)
    : hasValidCoords
    ? `${raw.latitude!.toFixed(2)}_${raw.longitude!.toFixed(2)}`
    : 'no-coords';

  const hasCompleteMetadata = Boolean(
    rawCity &&
      citySlug !== 'unknown-city' &&
      (countrySlug !== 'unspecified-country' || hasValidCoords || raw.id)
  );

  const canonicalId = `tier2:${countrySlug}:${admin1Slug}:${citySlug}:${geoDisambiguator}`;
  const seedNumber = fnv1aHash(canonicalId);

  return {
    canonicalId,
    curatedKey: null,
    displayCity,
    citySlug,
    country: inferredCountry,
    countryCode,
    admin1: inferredAdmin1,
    latitude: hasValidCoords ? raw.latitude : undefined,
    longitude: hasValidCoords ? raw.longitude : undefined,
    hasCompleteMetadata,
    seedHash: fnv1aHex(canonicalId),
    seedNumber,
  };
}
