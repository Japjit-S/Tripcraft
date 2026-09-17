import {
  ActivityCategory,
  CandidateActivity,
  DayOfWeek,
  Intensity,
  OpeningHours,
  Slot,
} from '../types/engine';

export interface RawOsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface TagRule {
  category: ActivityCategory;
  indoor: boolean;
  intensity: Intensity;
  typicalDurationMin: number;
  slotAffinity: Slot[];
}

/**
 * Single declarative mapping table converting OSM primary tags to engine attributes.
 */
export const TAG_MAPPING_TABLE: Record<string, TagRule> = {
  // Tourism
  'tourism=museum': {
    category: 'CULTURE',
    indoor: true,
    intensity: 'LOW',
    typicalDurationMin: 120,
    slotAffinity: ['MORNING', 'AFTERNOON'],
  },
  'tourism=gallery': {
    category: 'CULTURE',
    indoor: true,
    intensity: 'LOW',
    typicalDurationMin: 90,
    slotAffinity: ['MORNING', 'AFTERNOON'],
  },
  'tourism=attraction': {
    category: 'LANDMARK',
    indoor: false,
    intensity: 'MEDIUM',
    typicalDurationMin: 90,
    slotAffinity: ['MORNING', 'AFTERNOON'],
  },
  'tourism=viewpoint': {
    category: 'NATURE',
    indoor: false,
    intensity: 'LOW',
    typicalDurationMin: 45,
    slotAffinity: ['AFTERNOON', 'EVENING'],
  },
  'tourism=theme_park': {
    category: 'ENTERTAINMENT',
    indoor: false,
    intensity: 'HIGH',
    typicalDurationMin: 240,
    slotAffinity: ['MORNING', 'AFTERNOON'],
  },

  // Historic
  'historic=fort': {
    category: 'LANDMARK',
    indoor: false,
    intensity: 'HIGH',
    typicalDurationMin: 180,
    slotAffinity: ['MORNING', 'AFTERNOON'],
  },
  'historic=castle': {
    category: 'LANDMARK',
    indoor: false,
    intensity: 'HIGH',
    typicalDurationMin: 150,
    slotAffinity: ['MORNING', 'AFTERNOON'],
  },
  'historic=palace': {
    category: 'LANDMARK',
    indoor: true,
    intensity: 'MEDIUM',
    typicalDurationMin: 120,
    slotAffinity: ['MORNING', 'AFTERNOON'],
  },
  'historic=monument': {
    category: 'LANDMARK',
    indoor: false,
    intensity: 'LOW',
    typicalDurationMin: 45,
    slotAffinity: ['MORNING', 'AFTERNOON', 'EVENING'],
  },
  'historic=archaeological_site': {
    category: 'CULTURE',
    indoor: false,
    intensity: 'MEDIUM',
    typicalDurationMin: 120,
    slotAffinity: ['MORNING', 'AFTERNOON'],
  },

  // Leisure
  'leisure=park': {
    category: 'NATURE',
    indoor: false,
    intensity: 'LOW',
    typicalDurationMin: 75,
    slotAffinity: ['MORNING', 'EVENING'],
  },
  'leisure=garden': {
    category: 'NATURE',
    indoor: false,
    intensity: 'LOW',
    typicalDurationMin: 60,
    slotAffinity: ['MORNING', 'AFTERNOON', 'EVENING'],
  },

  // Amenity
  'amenity=marketplace': {
    category: 'MARKET',
    indoor: false,
    intensity: 'MEDIUM',
    typicalDurationMin: 90,
    slotAffinity: ['AFTERNOON', 'EVENING'],
  },
  'amenity=place_of_worship': {
    category: 'CULTURE',
    indoor: true,
    intensity: 'LOW',
    typicalDurationMin: 60,
    slotAffinity: ['MORNING', 'AFTERNOON'],
  },
};

/**
 * Parses simple OSM opening_hours string into structured OpeningHours
 */
export function parseOsmOpeningHours(rawHours?: string): OpeningHours | undefined {
  if (!rawHours) return undefined;

  const daysOfWeek: DayOfWeek[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const cleaned = rawHours.trim();
  const result: OpeningHours = {};

  // Pattern: "Mo-Su 09:00-17:00" or "09:00-18:00"
  const timeMatch = cleaned.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (timeMatch) {
    const timeWindow = [{ open: timeMatch[1], close: timeMatch[2] }];
    for (const day of daysOfWeek) {
      result[day] = timeWindow;
    }
    return result;
  }

  if (cleaned.toLowerCase() === '24/7') {
    const timeWindow = [{ open: '00:00', close: '23:59' }];
    for (const day of daysOfWeek) {
      result[day] = timeWindow;
    }
    return result;
  }

  return undefined;
}

/**
 * Matches raw OSM element tags against the declarative table
 */
export function matchOsmRule(tags: Record<string, string>): TagRule {
  const candidateKeys = [
    `tourism=${tags.tourism}`,
    `historic=${tags.historic}`,
    `leisure=${tags.leisure}`,
    `amenity=${tags.amenity}`,
  ];

  for (const key of candidateKeys) {
    if (TAG_MAPPING_TABLE[key]) {
      return TAG_MAPPING_TABLE[key];
    }
  }

  // Safe fallback
  return {
    category: 'LANDMARK',
    indoor: tags.indoor === 'yes',
    intensity: 'MEDIUM',
    typicalDurationMin: 90,
    slotAffinity: ['MORNING', 'AFTERNOON'],
  };
}

/**
 * Normalizes a raw OSM element into a clean CandidateActivity
 */
export function normalizeOsmElement(
  elem: RawOsmElement,
  wikipediaSitelinkCount = 0
): CandidateActivity | null {
  const tags = elem.tags;
  if (!tags) return null;

  const title = tags['name:en'] || tags['int_name'] || tags.name;
  if (!title || title.trim().length === 0) return null;

  const coords =
    elem.lat !== undefined && elem.lon !== undefined
      ? { lat: elem.lat, lon: elem.lon }
      : elem.center
      ? { lat: elem.center.lat, lon: elem.center.lon }
      : null;

  if (!coords) return null;

  const rule = matchOsmRule(tags);
  const isIndoor = tags.indoor === 'yes' ? true : tags.indoor === 'no' ? false : rule.indoor;

  // Prominence derived from Wikipedia sitelinks with UNESCO bonus
  const isHeritage =
    tags.heritage === 'yes' ||
    tags.unesco === 'yes' ||
    Boolean(tags['heritage:operator']);
  const heritageBonus = isHeritage ? 0.2 : 0;
  const sitelinkScore = Math.min(1.0, Math.log10(wikipediaSitelinkCount + 1) / 1.8);
  const rawProminence = Math.min(1.0, sitelinkScore + heritageBonus);

  const collectedTags: string[] = [];
  if (tags.tourism) collectedTags.push(tags.tourism.toLowerCase());
  if (tags.historic) collectedTags.push(tags.historic.toLowerCase());
  if (tags.leisure) collectedTags.push(tags.leisure.toLowerCase());
  if (tags.amenity) collectedTags.push(tags.amenity.toLowerCase());
  if (isHeritage) collectedTags.push('unesco', 'heritage');
  if (isIndoor) collectedTags.push('indoor');
  else collectedTags.push('outdoor');

  return {
    id: `osm:${elem.type}/${elem.id}`,
    title: title.trim(),
    category: rule.category,
    indoor: isIndoor,
    intensity: rule.intensity,
    typicalDurationMin: rule.typicalDurationMin,
    slotAffinity: rule.slotAffinity,
    prominence: Number(rawProminence.toFixed(2)),
    coords,
    openingHours: parseOsmOpeningHours(tags.opening_hours),
    tags: collectedTags,
    sourceUrl: tags.wikipedia
      ? `https://en.wikipedia.org/wiki/${encodeURIComponent(tags.wikipedia.replace(/^.*:/, ''))}`
      : tags.wikidata
      ? `https://www.wikidata.org/wiki/${tags.wikidata}`
      : undefined,
  };
}
