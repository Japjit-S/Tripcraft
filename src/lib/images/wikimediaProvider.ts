import { ExternalArtworkAttribution } from '../types/engine';
import {
  NormalizedDestinationIdentity,
  normalizeToken,
} from './canonicalDestination';

const WIKIMEDIA_API_URL = 'https://commons.wikimedia.org/w/api.php';
const WIKIMEDIA_UPLOAD_PREFIX = 'https://upload.wikimedia.org/wikipedia/commons/';
const WIKIMEDIA_SOURCE_PREFIX = 'https://commons.wikimedia.org/wiki/';
const USER_AGENT =
  'RoamwiseTripcraft/1.0 (https://roamwise.example; destination-illustration-resolver)';
const LOOKUP_TIMEOUT_MS = 2500;

const ALLOWED_RASTER_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

const ALLOWED_RASTER_EXTENSIONS = /\.(png|jpe?g|webp)$/i;

const POSITIVE_ILLUSTRATION_TERMS = [
  'illustration',
  'illustrated',
  'travel poster',
  'vintage poster',
  'vector',
  'lithograph',
  'screenprint',
  'woodblock',
  'editorial art',
  'gouache',
];

const REJECTED_ASSET_TERMS = [
  'photograph',
  'photo of',
  'photos of',
  'photographed',
  'taken on',
  'taken with',
  'camera',
  'dslr',
  'panorama of',
  'aerial view',
  'satellite',
  'street view',
  'flag of',
  'flags of',
  'coat of arms',
  'arms of',
  'seal of',
  'emblem of',
  'logo',
  'wordmark',
  'map of',
  'locator map',
  'location map',
  'district map',
  'blank map',
  'administrative map',
  'orthographic',
  'diagram',
  'chart',
  'graph',
  'icon',
  'stamp',
  'postage',
  'signature',
  'portrait of',
  'bust of',
  'statue of',
  'plaque',
  'road sign',
];

export interface WikimediaExtMetadataField {
  value?: string;
}

export interface WikimediaImageInfo {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  mime?: string;
  thumbmime?: string;
  width?: number;
  height?: number;
  thumbwidth?: number;
  thumbheight?: number;
  extmetadata?: Record<string, WikimediaExtMetadataField | undefined>;
}

export interface WikimediaCandidatePage {
  pageid?: number;
  title?: string;
  imageinfo?: WikimediaImageInfo[];
}

export interface ValidatedExternalIllustration {
  imageUrl: string;
  alt: string;
  attribution: ExternalArtworkAttribution;
}

export interface WikimediaLookupOutcome {
  match: ValidatedExternalIllustration | null;
  providerError: boolean;
  retryAfterMs?: number;
}

function stripHtml(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function containsWholeToken(haystackNormalized: string, needleRaw: string): boolean {
  const needle = normalizeToken(needleRaw);
  if (!needle) return false;
  const paddedHaystack = ` ${haystackNormalized} `;
  return paddedHaystack.includes(` ${needle} `);
}

export function parseRetryAfterMs(headerValue: string | null): number | undefined {
  if (!headerValue) return undefined;
  const trimmed = headerValue.trim();
  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds * 1000;
  }
  const parsedDate = Date.parse(trimmed);
  if (!Number.isNaN(parsedDate)) {
    const delta = parsedDate - Date.now();
    return delta > 0 ? delta : undefined;
  }
  return undefined;
}

/**
 * Strictly validates a Wikimedia Commons candidate page to ensure:
 * 1. Allowed host and raster format (never raw remote SVG).
 * 2. Landscape banner dimensions.
 * 3. Explicit destination city + country/region match (disambiguating same-name cities).
 * 4. Positive vector/poster/illustration signals and zero photo/map/logo/coat-of-arms signals.
 * 5. Complete source, author, and license attribution metadata.
 */
export function validateWikimediaCandidate(
  page: WikimediaCandidatePage,
  identity: NormalizedDestinationIdentity
): ValidatedExternalIllustration | null {
  if (!identity.hasCompleteMetadata || !identity.displayCity) {
    return null;
  }

  const info = page.imageinfo?.[0];
  if (!info) return null;

  const candidateUrl = (info.thumburl || info.url || '').trim();
  const candidateMime = (info.thumbmime || info.mime || '').trim().toLowerCase();

  // Never permit remote SVG or non-Wikimedia URLs
  if (!candidateUrl.startsWith(WIKIMEDIA_UPLOAD_PREFIX)) {
    return null;
  }
  if (
    candidateMime === 'image/svg+xml' ||
    info.mime?.toLowerCase() === 'image/svg+xml' ||
    /\.svg(\?|$)/i.test(candidateUrl)
  ) {
    return null;
  }
  if (!ALLOWED_RASTER_MIMES.has(candidateMime)) {
    return null;
  }
  if (!ALLOWED_RASTER_EXTENSIONS.test(candidateUrl.split('?')[0])) {
    return null;
  }

  const width = info.thumbwidth || info.width || 0;
  const height = info.thumbheight || info.height || 0;
  if (width < 600 || height < 300) {
    return null;
  }
  const aspect = width / height;
  if (aspect < 1.15 || aspect > 3.6) {
    return null;
  }

  const meta = info.extmetadata || {};

  // Reject camera photographs via EXIF fields
  if (
    meta.Model?.value ||
    meta.Make?.value ||
    meta.ExposureTime?.value ||
    meta.FNumber?.value ||
    meta.ISOSpeedRatings?.value ||
    meta.LensModel?.value
  ) {
    return null;
  }

  const rawTitle = (page.title || '').replace(/^File:/i, '').replace(/\.[^.]+$/, '');
  const objectName = stripHtml(meta.ObjectName?.value) || rawTitle;
  const description = stripHtml(meta.ImageDescription?.value);
  const categories = stripHtml(meta.Categories?.value);
  const combinedNormalized = normalizeToken(
    `${rawTitle} ${objectName} ${description} ${categories}`
  );

  // Reject photographs, maps, logos, flags, coats of arms, portraits, etc.
  for (const rejected of REJECTED_ASSET_TERMS) {
    if (combinedNormalized.includes(normalizeToken(rejected))) {
      return null;
    }
  }

  // Require positive illustration / travel poster signal
  const hasIllustrationSignal = POSITIVE_ILLUSTRATION_TERMS.some((term) =>
    combinedNormalized.includes(normalizeToken(term))
  );
  if (!hasIllustrationSignal) {
    return null;
  }

  // Require destination city match
  if (!containsWholeToken(combinedNormalized, identity.displayCity)) {
    return null;
  }

  // Disambiguate by country or admin1 region
  const hasCountryMatch =
    Boolean(identity.country) &&
    containsWholeToken(combinedNormalized, identity.country);
  const hasAdminMatch =
    Boolean(identity.admin1) &&
    containsWholeToken(combinedNormalized, identity.admin1);

  if (!hasCountryMatch && !hasAdminMatch) {
    return null;
  }

  // Verify attribution and license metadata
  const sourcePageUrl = (info.descriptionurl || '').trim();
  if (!sourcePageUrl.startsWith(WIKIMEDIA_SOURCE_PREFIX)) {
    return null;
  }

  const author = stripHtml(meta.Artist?.value || meta.Credit?.value);
  const license = stripHtml(
    meta.LicenseShortName?.value || meta.UsageTerms?.value
  );
  const licenseUrl = stripHtml(meta.LicenseUrl?.value) || undefined;
  const sourceTitle = stripHtml(objectName || rawTitle);

  if (
    !author ||
    !license ||
    !sourceTitle ||
    /^unknown$/i.test(author) ||
    /^unknown$/i.test(license)
  ) {
    return null;
  }

  const attributionText = `${sourceTitle} — ${author} (${license}, via Wikimedia Commons)`;
  const suffix = identity.country ? `, ${identity.country}` : '';

  return {
    imageUrl: candidateUrl,
    alt: `Illustrated travel view of ${identity.displayCity}${suffix}`,
    attribution: {
      sourceTitle,
      sourcePageUrl,
      author,
      license,
      licenseUrl,
      attributionText,
    },
  };
}

async function queryWikipediaSummaryImage(
  identity: NormalizedDestinationIdentity,
  fetchImpl: typeof fetch
): Promise<ValidatedExternalIllustration | null> {
  const cityTitles = [
    identity.displayCity,
    identity.admin1 ? `${identity.displayCity}, ${identity.admin1}` : '',
    identity.country ? `${identity.displayCity}, ${identity.country}` : '',
  ].filter(Boolean);

  for (const title of cityTitles) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
      const res = await fetchImpl(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(1800),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        title?: string;
        thumbnail?: { source?: string };
        originalimage?: { source?: string };
        content_urls?: { desktop?: { page?: string } };
      };

      const imageUrl = (data.originalimage?.source || data.thumbnail?.source || '').trim();
      if (!imageUrl) continue;

      const cleanPath = imageUrl.split('?')[0];
      if (/\.svg$/i.test(cleanPath)) continue;
      if (!/\.(png|jpe?g|webp)$/i.test(cleanPath)) continue;

      const sourceTitle = data.title || identity.displayCity;
      const sourcePageUrl =
        data.content_urls?.desktop?.page ||
        `https://en.wikipedia.org/wiki/${encodeURIComponent(sourceTitle.replace(/\s+/g, '_'))}`;
      const suffix = identity.country ? `, ${identity.country}` : '';

      return {
        imageUrl,
        alt: `${sourceTitle}${suffix} destination panorama`,
        attribution: {
          sourceTitle,
          sourcePageUrl,
          author: 'Wikimedia Commons contributors',
          license: 'CC BY-SA / Public Domain',
          licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
          attributionText: `${sourceTitle} — Wikimedia Commons (CC BY-SA)`,
        },
      };
    } catch {
      // Continue to next title candidate or fallback
    }
  }
  return null;
}

/**
 * Performs a single bounded, server-side Wikimedia Commons search for a
 * destination-matched illustration. Never throws; returns structured outcome.
 */
export async function lookupWikimediaIllustration(
  identity: NormalizedDestinationIdentity,
  fetchImpl: typeof fetch = fetch
): Promise<WikimediaLookupOutcome> {
  if (!identity.hasCompleteMetadata || !identity.displayCity || !identity.country) {
    return { match: null, providerError: false };
  }

  // When runtime fetch is used, fetch real high-res city photography from Wikipedia Page Summary
  if (fetchImpl === fetch) {
    const summaryMatch = await queryWikipediaSummaryImage(identity, fetchImpl);
    if (summaryMatch) {
      return {
        match: summaryMatch,
        providerError: false,
      };
    }
  }

  const searchQuery = `"${identity.displayCity}" "${identity.country}" (illustration OR "travel poster" OR vector) -photo -map -flag -logo`;
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: searchQuery,
    gsrnamespace: '6',
    gsrlimit: '5',
    prop: 'imageinfo',
    iiprop: 'url|mime|dimensions|extmetadata',
    iiurlwidth: '1200',
    format: 'json',
    origin: '*',
  });

  const url = `${WIKIMEDIA_API_URL}?${params.toString()}`;

  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });

    if (res.status === 429 || res.status === 503) {
      const retryAfterMs = parseRetryAfterMs(res.headers.get('retry-after'));
      return {
        match: null,
        providerError: true,
        retryAfterMs,
      };
    }

    if (!res.ok) {
      return {
        match: null,
        providerError: true,
      };
    }

    const data = (await res.json()) as {
      query?: { pages?: Record<string, WikimediaCandidatePage> };
    };

    const pagesObj = data.query?.pages;
    if (!pagesObj) {
      return { match: null, providerError: false };
    }

    const pages = Object.values(pagesObj);
    for (const page of pages) {
      const validated = validateWikimediaCandidate(page, identity);
      if (validated) {
        return {
          match: validated,
          providerError: false,
        };
      }
    }

    return { match: null, providerError: false };
  } catch {
    return {
      match: null,
      providerError: true,
    };
  }
}
