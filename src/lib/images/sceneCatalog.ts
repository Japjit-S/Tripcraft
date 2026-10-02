import {
  ArtworkFocalPoint,
  CuratedCityKey,
  DestinationArtworkDescriptor,
  LocalSceneMotifId,
  LocalScenePaletteId,
  LocalSceneParameters,
  LocalSceneTemplateId,
} from '../types/engine';
import {
  DestinationIdentityInput,
  fnv1aHex,
  NormalizedDestinationIdentity,
  normalizeDestinationIdentity,
  normalizeToken,
} from './canonicalDestination';

export const ART_SCHEMA_VERSION = 1;
export const ART_RESOLVER_VERSION = 'roamwise-art-v1.0.0';
export const DETERMINISTIC_RESOLVED_AT = '2026-01-01T00:00:00.000Z';

export interface EditorialScenePalette {
  id: LocalScenePaletteId;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  sunDisc: string;
  sunHalo: string;
  cloudFill: string;
  farHorizon: string;
  midSilhouette: string;
  primaryArchitecture: string;
  secondaryArchitecture: string;
  windowArch: string;
  highlightTrim: string;
  waterOrTerrace: string;
  waterReflection: string;
  foliagePrimary: string;
  foliageSecondary: string;
  accentCerulean: string;
  routeStroke: string;
}

export const SCENE_PALETTES: Record<LocalScenePaletteId, EditorialScenePalette> = {
  'terracotta-sun': {
    id: 'terracotta-sun',
    skyTop: '#F7A072',
    skyMid: '#F9C784',
    skyBottom: '#FFF1DC',
    sunDisc: '#FFF6D6',
    sunHalo: '#FDB863',
    cloudFill: '#FFF8EE',
    farHorizon: '#E08A64',
    midSilhouette: '#C96846',
    primaryArchitecture: '#B84B31',
    secondaryArchitecture: '#D97352',
    windowArch: '#5E2118',
    highlightTrim: '#FBE3C6',
    waterOrTerrace: '#E99E6B',
    waterReflection: '#FCE4BC',
    foliagePrimary: '#24594C',
    foliageSecondary: '#3E7C67',
    accentCerulean: '#1D6B8F',
    routeStroke: '#8C3522',
  },
  'saffron-amber': {
    id: 'saffron-amber',
    skyTop: '#F39C6B',
    skyMid: '#F7C578',
    skyBottom: '#FFF3DF',
    sunDisc: '#FFF9E2',
    sunHalo: '#F5B041',
    cloudFill: '#FFF9F0',
    farHorizon: '#D9824C',
    midSilhouette: '#B96334',
    primaryArchitecture: '#9C4522',
    secondaryArchitecture: '#CC6F3D',
    windowArch: '#4D1F11',
    highlightTrim: '#FDE8C4',
    waterOrTerrace: '#1D6B8F',
    waterReflection: '#F8D48D',
    foliagePrimary: '#234E46',
    foliageSecondary: '#3B7466',
    accentCerulean: '#1D6B8F',
    routeStroke: '#7B3418',
  },
  'coral-cerulean': {
    id: 'coral-cerulean',
    skyTop: '#F29A76',
    skyMid: '#FAD09C',
    skyBottom: '#FFF5E6',
    sunDisc: '#FFF8E5',
    sunHalo: '#F7B277',
    cloudFill: '#FFF9F2',
    farHorizon: '#D4836A',
    midSilhouette: '#A75E58',
    primaryArchitecture: '#C85D44',
    secondaryArchitecture: '#E58F6B',
    windowArch: '#3D262A',
    highlightTrim: '#FFF0D9',
    waterOrTerrace: '#1D6B8F',
    waterReflection: '#80BBD0',
    foliagePrimary: '#1E5248',
    foliageSecondary: '#35796B',
    accentCerulean: '#1D6B8F',
    routeStroke: '#1D6B8F',
  },
  'ochre-olive': {
    id: 'ochre-olive',
    skyTop: '#EFA86E',
    skyMid: '#F8CF8E',
    skyBottom: '#FFF4E2',
    sunDisc: '#FFF9E6',
    sunHalo: '#F4BA61',
    cloudFill: '#FFF9EF',
    farHorizon: '#C98A55',
    midSilhouette: '#8E6242',
    primaryArchitecture: '#A85834',
    secondaryArchitecture: '#D17E4E',
    windowArch: '#432518',
    highlightTrim: '#FBE8CA',
    waterOrTerrace: '#D99E6A',
    waterReflection: '#F9E1B4',
    foliagePrimary: '#2D5A43',
    foliageSecondary: '#4E805F',
    accentCerulean: '#1D6B8F',
    routeStroke: '#6D3B22',
  },
  'rose-sandstone': {
    id: 'rose-sandstone',
    skyTop: '#EC9578',
    skyMid: '#F6C295',
    skyBottom: '#FFF2E5',
    sunDisc: '#FFF8EA',
    sunHalo: '#F6AE84',
    cloudFill: '#FFF8F3',
    farHorizon: '#CF7E6C',
    midSilhouette: '#A85B52',
    primaryArchitecture: '#9E4640',
    secondaryArchitecture: '#C96D5D',
    windowArch: '#471E20',
    highlightTrim: '#FDE8DC',
    waterOrTerrace: '#266582',
    waterReflection: '#F7C9B0',
    foliagePrimary: '#244E4A',
    foliageSecondary: '#3E736D',
    accentCerulean: '#1D6B8F',
    routeStroke: '#7C3230',
  },
  'apricot-teal': {
    id: 'apricot-teal',
    skyTop: '#F4A261',
    skyMid: '#F8CE8B',
    skyBottom: '#FFF4E0',
    sunDisc: '#FFF9E4',
    sunHalo: '#F6B868',
    cloudFill: '#FFF9F0',
    farHorizon: '#CE8559',
    midSilhouette: '#28667B',
    primaryArchitecture: '#C2593B',
    secondaryArchitecture: '#E08258',
    windowArch: '#233D47',
    highlightTrim: '#FDF0D5',
    waterOrTerrace: '#1D6B8F',
    waterReflection: '#94C9D8',
    foliagePrimary: '#1E5549',
    foliageSecondary: '#39806E',
    accentCerulean: '#1D6B8F',
    routeStroke: '#1D6B8F',
  },
};

interface CuratedCityCatalogEntry {
  key: CuratedCityKey;
  displayName: string;
  assetPath: string;
  landmarkName: string;
  alt: string;
  focalPoint: ArtworkFocalPoint;
  fallbackScene: LocalSceneParameters;
}

export const CURATED_CITY_ARTWORK: Record<CuratedCityKey, CuratedCityCatalogEntry> = {
  jaipur: {
    key: 'jaipur',
    displayName: 'Jaipur',
    assetPath: '/artwork/landmark-jaipur-hawa-mahal.png',
    landmarkName: 'Hawa Mahal',
    alt: 'Illustrated view of Hawa Mahal in Jaipur',
    focalPoint: { x: 0.72, y: 0.48 },
    fallbackScene: {
      templateId: 'historic-old-town',
      paletteId: 'terracotta-sun',
      skyVariant: 0,
      skylineVariant: 0,
      terrainVariant: 0,
      motifVariant: 'plane-route',
      seedHash: 'c01a1001',
    },
  },
  delhi: {
    key: 'delhi',
    displayName: 'Delhi',
    assetPath: '/artwork/landmark-delhi-red-fort.png',
    landmarkName: 'Red Fort',
    alt: 'Illustrated view of Red Fort in Delhi',
    focalPoint: { x: 0.72, y: 0.46 },
    fallbackScene: {
      templateId: 'historic-old-town',
      paletteId: 'saffron-amber',
      skyVariant: 1,
      skylineVariant: 1,
      terrainVariant: 1,
      motifVariant: 'plane-route',
      seedHash: 'c01a1002',
    },
  },
  agra: {
    key: 'agra',
    displayName: 'Agra',
    assetPath: '/artwork/landmark-agra-taj-mahal.png',
    landmarkName: 'Taj Mahal',
    alt: 'Illustrated view of the Taj Mahal in Agra',
    focalPoint: { x: 0.70, y: 0.45 },
    fallbackScene: {
      templateId: 'historic-old-town',
      paletteId: 'rose-sandstone',
      skyVariant: 2,
      skylineVariant: 2,
      terrainVariant: 2,
      motifVariant: 'birds-compass',
      seedHash: 'c01a1003',
    },
  },
  varanasi: {
    key: 'varanasi',
    displayName: 'Varanasi',
    assetPath: '/artwork/landmark-varanasi-ghats.png',
    landmarkName: 'Ganges River Ghats',
    alt: 'Illustrated view of riverfront ghats in Varanasi',
    focalPoint: { x: 0.72, y: 0.50 },
    fallbackScene: {
      templateId: 'coastal-harbor',
      paletteId: 'saffron-amber',
      skyVariant: 0,
      skylineVariant: 1,
      terrainVariant: 2,
      motifVariant: 'sail-route',
      seedHash: 'c01a1004',
    },
  },
  udaipur: {
    key: 'udaipur',
    displayName: 'Udaipur',
    assetPath: '/artwork/landmark-udaipur-lake-palace.png',
    landmarkName: 'Lake Palace',
    alt: 'Illustrated view of Lake Palace in Udaipur',
    focalPoint: { x: 0.70, y: 0.48 },
    fallbackScene: {
      templateId: 'historic-old-town',
      paletteId: 'coral-cerulean',
      skyVariant: 1,
      skylineVariant: 0,
      terrainVariant: 1,
      motifVariant: 'balloon-route',
      seedHash: 'c01a1005',
    },
  },
  goa: {
    key: 'goa',
    displayName: 'Goa',
    assetPath: '/artwork/landmark-goa-panaji-coast.png',
    landmarkName: 'Panaji Coast',
    alt: 'Illustrated coastal view of Panaji in Goa',
    focalPoint: { x: 0.72, y: 0.48 },
    fallbackScene: {
      templateId: 'tropical-island',
      paletteId: 'apricot-teal',
      skyVariant: 2,
      skylineVariant: 2,
      terrainVariant: 0,
      motifVariant: 'sail-route',
      seedHash: 'c01a1006',
    },
  },
  mumbai: {
    key: 'mumbai',
    displayName: 'Mumbai',
    assetPath: '/artwork/landmark-mumbai-gateway.png',
    landmarkName: 'Gateway of India',
    alt: 'Illustrated view of Gateway of India in Mumbai',
    focalPoint: { x: 0.70, y: 0.48 },
    fallbackScene: {
      templateId: 'coastal-harbor',
      paletteId: 'apricot-teal',
      skyVariant: 0,
      skylineVariant: 2,
      terrainVariant: 1,
      motifVariant: 'sail-route',
      seedHash: 'c01a1007',
    },
  },
  kolkata: {
    key: 'kolkata',
    displayName: 'Kolkata',
    assetPath: '/artwork/landmark-kolkata-howrah.png',
    landmarkName: 'Howrah Bridge',
    alt: 'Illustrated view of Howrah Bridge in Kolkata',
    focalPoint: { x: 0.70, y: 0.48 },
    fallbackScene: {
      templateId: 'coastal-harbor',
      paletteId: 'ochre-olive',
      skyVariant: 1,
      skylineVariant: 1,
      terrainVariant: 0,
      motifVariant: 'sail-route',
      seedHash: 'c01a1008',
    },
  },
  amritsar: {
    key: 'amritsar',
    displayName: 'Amritsar',
    assetPath: '/artwork/landmark-amritsar-golden-temple.png',
    landmarkName: 'Golden Temple',
    alt: 'Illustrated view of Harmandir Sahib Golden Temple in Amritsar',
    focalPoint: { x: 0.70, y: 0.48 },
    fallbackScene: {
      templateId: 'historic-old-town',
      paletteId: 'saffron-amber',
      skyVariant: 2,
      skylineVariant: 0,
      terrainVariant: 1,
      motifVariant: 'birds-compass',
      seedHash: 'c01a1009',
    },
  },
  hampi: {
    key: 'hampi',
    displayName: 'Hampi',
    assetPath: '/artwork/landmark-hampi-ruins.png',
    landmarkName: 'Hampi Ruins',
    alt: 'Illustrated view of stone temple ruins in Hampi',
    focalPoint: { x: 0.70, y: 0.48 },
    fallbackScene: {
      templateId: 'historic-old-town',
      paletteId: 'terracotta-sun',
      skyVariant: 0,
      skylineVariant: 1,
      terrainVariant: 2,
      motifVariant: 'birds-compass',
      seedHash: 'c01a1010',
    },
  },
  mysuru: {
    key: 'mysuru',
    displayName: 'Mysuru',
    assetPath: '/artwork/landmark-mysuru-palace.png',
    landmarkName: 'Mysore Palace',
    alt: 'Illustrated view of Mysore Palace in Mysuru',
    focalPoint: { x: 0.70, y: 0.48 },
    fallbackScene: {
      templateId: 'historic-old-town',
      paletteId: 'rose-sandstone',
      skyVariant: 1,
      skylineVariant: 2,
      terrainVariant: 1,
      motifVariant: 'plane-route',
      seedHash: 'c01a1011',
    },
  },
};

const SCENE_TEMPLATES: readonly LocalSceneTemplateId[] = [
  'historic-old-town',
  'coastal-harbor',
  'metropolitan-skyline',
  'alpine-valley',
  'tropical-island',
  'desert-oasis',
] as const;

const PALETTE_KEYS: readonly LocalScenePaletteId[] = [
  'terracotta-sun',
  'saffron-amber',
  'coral-cerulean',
  'ochre-olive',
  'rose-sandstone',
  'apricot-teal',
] as const;

const MOTIF_KEYS: readonly LocalSceneMotifId[] = [
  'plane-route',
  'balloon-route',
  'birds-compass',
  'sail-route',
] as const;

function pickTemplateForIdentity(
  identity: NormalizedDestinationIdentity
): LocalSceneTemplateId {
  const tokenBlob = normalizeToken(
    `${identity.displayCity} ${identity.admin1} ${identity.country}`
  );

  if (
    /\b(island|bali|phuket|maldives|hawaii|fiji|tahiti|caribbean|seychelles|mauritius|zanzibar|okinawa)\b/.test(
      tokenBlob
    )
  ) {
    return 'tropical-island';
  }
  if (
    /\b(alps|zermatt|interlaken|innsbruck|chamonix|banff|queenstown|shimla|manali|leh|ladakh|kathmandu|thimphu|cusco|denver|geneva|zurich)\b/.test(
      tokenBlob
    )
  ) {
    return 'alpine-valley';
  }
  if (
    /\b(dubai|doha|abu dhabi|cairo|marrakech|fez|petra|muscat|riyadh|jodhpur|jaisalmer|bikaner|luxor|amman)\b/.test(
      tokenBlob
    )
  ) {
    return 'desert-oasis';
  }
  if (
    /\b(lisbon|porto|barcelona|nice|naples|amalfi|venice|split|dubrovnik|sydney|auckland|vancouver|san francisco|rio|cape town|mumbai|chennai|kochi|pondicherry|istanbul|athens|santorini)\b/.test(
      tokenBlob
    )
  ) {
    return 'coastal-harbor';
  }
  if (
    /\b(rome|florence|prague|vienna|budapest|krakow|edinburgh|oxford|bruges|ghent|seville|granada|kyoto|nara|mysore|hampi|madurai)\b/.test(
      tokenBlob
    )
  ) {
    return 'historic-old-town';
  }
  if (
    /\b(tokyo|osaka|seoul|singapore|hong kong|shanghai|taipei|new york|chicago|toronto|london|berlin|frankfurt|bangkok|kuala lumpur|bengaluru|bangalore|hyderabad)\b/.test(
      tokenBlob
    )
  ) {
    return 'metropolitan-skyline';
  }

  return SCENE_TEMPLATES[identity.seedNumber % SCENE_TEMPLATES.length];
}

/**
 * Deterministically builds local vector scene parameters from normalized destination identity.
 * Never varies by weather, date, or time of day.
 */
export function buildLocalSceneParameters(
  identity: NormalizedDestinationIdentity
): LocalSceneParameters {
  if (identity.curatedKey && CURATED_CITY_ARTWORK[identity.curatedKey]) {
    return { ...CURATED_CITY_ARTWORK[identity.curatedKey].fallbackScene };
  }

  const n = identity.seedNumber;
  const templateId = pickTemplateForIdentity(identity);
  const paletteId = PALETTE_KEYS[(n >>> 3) % PALETTE_KEYS.length];
  const skyVariant = ((n >>> 7) % 3) as 0 | 1 | 2;
  const skylineVariant = ((n >>> 11) % 3) as 0 | 1 | 2;
  const terrainVariant = ((n >>> 15) % 3) as 0 | 1 | 2;

  let motifVariant = MOTIF_KEYS[(n >>> 19) % MOTIF_KEYS.length];
  if (
    (templateId === 'alpine-valley' || templateId === 'desert-oasis') &&
    motifVariant === 'sail-route'
  ) {
    motifVariant = 'plane-route';
  }

  return {
    templateId,
    paletteId,
    skyVariant,
    skylineVariant,
    terrainVariant,
    motifVariant,
    seedHash: identity.seedHash,
  };
}

/**
 * Generates accessible alt text for a destination illustration.
 * Only names a specific landmark when verified.
 */
export function buildAccessibleAltText(
  identity: NormalizedDestinationIdentity,
  verifiedLandmarkName?: string
): string {
  if (verifiedLandmarkName) {
    return `Illustrated view of ${verifiedLandmarkName} in ${identity.displayCity}`;
  }
  if (!identity.displayCity || identity.displayCity === 'Destination') {
    return 'Illustrated editorial travel landscape';
  }
  const suffix =
    identity.country &&
    normalizeToken(identity.country) !== normalizeToken(identity.displayCity)
      ? `, ${identity.country}`
      : '';
  return `Illustrated cityscape of ${identity.displayCity}${suffix}`;
}

export interface RegionalArtworkEntry {
  assetPath: string;
  regionName: string;
  alt: string;
  focalPoint: ArtworkFocalPoint;
}

export const REGIONAL_ARTWORK: Record<string, RegionalArtworkEntry> = {
  'north-himalaya': {
    assetPath: '/artwork/region-north-himalaya.png',
    regionName: 'North Himalaya',
    alt: 'Illustrated landscape of Himalayan peaks and alpine slopes',
    focalPoint: { x: 0.7, y: 0.5 },
  },
  'ne-eastern-hills': {
    assetPath: '/artwork/region-ne-eastern-hills.png',
    regionName: 'Northeast Eastern Hills',
    alt: 'Illustrated landscape of northeastern cloud-wrapped hills and forests',
    focalPoint: { x: 0.7, y: 0.5 },
  },
  'ne-river-tea': {
    assetPath: '/artwork/region-ne-river-tea.png',
    regionName: 'Northeast River & Tea',
    alt: 'Illustrated landscape of Brahmaputra river valley and tea gardens',
    focalPoint: { x: 0.7, y: 0.5 },
  },
  'gangetic-plains': {
    assetPath: '/artwork/region-gangetic-plains.png',
    regionName: 'Gangetic Plains',
    alt: 'Illustrated landscape of the Gangetic plains and historic riverfront',
    focalPoint: { x: 0.7, y: 0.5 },
  },
  'west-arid-desert': {
    assetPath: '/artwork/region-west-arid-desert.png',
    regionName: 'West Arid Desert',
    alt: 'Illustrated desert landscape of western arid hills and forts',
    focalPoint: { x: 0.7, y: 0.5 },
  },
  'central-plateau-forest': {
    assetPath: '/artwork/region-central-plateau-forest.png',
    regionName: 'Central Plateau & Forest',
    alt: 'Illustrated landscape of central plateau highlands and forests',
    focalPoint: { x: 0.7, y: 0.5 },
  },
  'east-delta-coast': {
    assetPath: '/artwork/region-east-delta-coast.png',
    regionName: 'East Delta & Coast',
    alt: 'Illustrated coastal landscape of the eastern delta and temples',
    focalPoint: { x: 0.7, y: 0.5 },
  },
  'konkan-west-coast': {
    assetPath: '/artwork/region-konkan-west-coast.png',
    regionName: 'Konkan & West Coast',
    alt: 'Illustrated coastal view of Konkan cliffs and palms',
    focalPoint: { x: 0.7, y: 0.5 },
  },
  'deccan-temple-plateau': {
    assetPath: '/artwork/region-deccan-temple-plateau.png',
    regionName: 'Deccan Temple Plateau',
    alt: 'Illustrated landscape of Deccan plateau and stone temple architecture',
    focalPoint: { x: 0.7, y: 0.5 },
  },
  'western-ghats-backwaters': {
    assetPath: '/artwork/region-western-ghats-backwaters.png',
    regionName: 'Western Ghats & Backwaters',
    alt: 'Illustrated tropical landscape of Western Ghats and backwaters',
    focalPoint: { x: 0.7, y: 0.5 },
  },
  'indian-islands': {
    assetPath: '/artwork/region-indian-islands.png',
    regionName: 'Indian Islands',
    alt: 'Illustrated tropical island shore and coral waters',
    focalPoint: { x: 0.7, y: 0.5 },
  },
};

export const INDIA_FALLBACK_ARTWORK = {
  assetPath: '/artwork/destination-india-fallback.png',
  alt: 'Illustrated editorial travel landscape of India',
  focalPoint: { x: 0.7, y: 0.5 },
};

/**
 * Resolves trusted administrative region (admin1) metadata to one of the 11 regional masters.
 */
export function resolveRegionArtworkKey(admin1?: string | null): string | null {
  if (!admin1) return null;
  const norm = normalizeToken(admin1);
  if (!norm) return null;

  // North Himalaya: Jammu & Kashmir, Ladakh, Himachal Pradesh, Uttarakhand
  if (
    /^(jammu and kashmir|jammu & kashmir|jammu kashmir|j and k|j & k|jk|ladakh|himachal pradesh|himachal|hp|uttarakhand|uttaranchal|uk)$/.test(norm)
  ) {
    return 'north-himalaya';
  }

  // Northeast Eastern Hills: Arunachal Pradesh, Sikkim, Meghalaya, Nagaland
  if (/^(arunachal pradesh|arunachal|sikkim|meghalaya|nagaland)$/.test(norm)) {
    return 'ne-eastern-hills';
  }

  // Northeast River & Tea: Assam, Manipur, Mizoram, Tripura
  if (/^(assam|manipur|mizoram|tripura)$/.test(norm)) {
    return 'ne-river-tea';
  }

  // Gangetic Plains: Punjab, Haryana, Delhi, Uttar Pradesh, Bihar, Chandigarh
  if (
    /^(punjab|haryana|delhi|nct of delhi|national capital territory of delhi|new delhi|uttar pradesh|up|bihar|chandigarh)$/.test(norm)
  ) {
    return 'gangetic-plains';
  }

  // West Arid Desert: Rajasthan, Gujarat, Daman and Diu, Dadra and Nagar Haveli
  if (
    /^(rajasthan|gujarat|daman and diu|dadra and nagar haveli|dadra and nagar haveli and daman and diu)$/.test(norm)
  ) {
    return 'west-arid-desert';
  }

  // Central Plateau & Forest: Madhya Pradesh, Chhattisgarh, Jharkhand
  if (/^(madhya pradesh|mp|chhattisgarh|jharkhand)$/.test(norm)) {
    return 'central-plateau-forest';
  }

  // East Delta & Coast: West Bengal, Odisha
  if (/^(west bengal|wb|odisha|orissa)$/.test(norm)) {
    return 'east-delta-coast';
  }

  // Konkan & West Coast: Maharashtra, Goa
  if (/^(maharashtra|mh|goa)$/.test(norm)) {
    return 'konkan-west-coast';
  }

  // Western Ghats & Backwaters: Kerala
  if (/^(kerala|kl)$/.test(norm)) {
    return 'western-ghats-backwaters';
  }

  // Deccan Temple Plateau: Telangana, Andhra Pradesh, Tamil Nadu, Karnataka, Puducherry
  if (
    /^(telangana|ts|andhra pradesh|ap|tamil nadu|tn|karnataka|ka|puducherry|pondicherry)$/.test(norm)
  ) {
    return 'deccan-temple-plateau';
  }

  // Indian Islands: Andaman & Nicobar Islands, Lakshadweep
  if (
    /^(andaman and nicobar islands|andaman and nicobar|andaman & nicobar|andaman|nicobar|lakshadweep)$/.test(norm)
  ) {
    return 'indian-islands';
  }

  return null;
}

/**
 * Synchronously resolves a complete local DestinationArtworkDescriptor
 * with zero network calls.
 *
 * 3-tier India-only resolution hierarchy:
 * 1. Exact, confidently matched landmark image (11 landmark exceptions)
 * 2. Region image from trusted state/region metadata (11 regional masters)
 * 3. Neutral India-wide fallback (/artwork/destination-india-fallback.png)
 *
 * For foreign destinations in test stubs, falls back to local vector scene.
 */
export function resolveLocalDestinationArtwork(
  input: DestinationIdentityInput | string | null | undefined,
  resolvedAt: string = DETERMINISTIC_RESOLVED_AT
): DestinationArtworkDescriptor {
  const identity = normalizeDestinationIdentity(input);

  // If destination is explicitly outside India, return deterministic local vector scene
  const isExplicitlyForeign = Boolean(
    identity.countryCode &&
      identity.countryCode !== 'IN' &&
      normalizeToken(identity.country) !== 'india'
  );

  if (isExplicitlyForeign) {
    const fallbackScene = buildLocalSceneParameters(identity);
    const alt = buildAccessibleAltText(identity);
    const contentHash = fnv1aHex(
      `${ART_RESOLVER_VERSION}:${identity.canonicalId}:${fallbackScene.templateId}:${fallbackScene.paletteId}:${fallbackScene.seedHash}`
    );
    return {
      schemaVersion: ART_SCHEMA_VERSION,
      artVersion: ART_RESOLVER_VERSION,
      destinationId: identity.canonicalId,
      artworkId: `art:scene:${identity.seedHash}`,
      kind: 'generated_local_scene',
      fallbackScene,
      alt,
      landmarkVerified: false,
      focalPoint: { x: 0.72, y: 0.48 },
      resolvedAt,
      contentHash,
    };
  }

  // Tier 1: Exact Landmark Exception
  if (identity.curatedKey && CURATED_CITY_ARTWORK[identity.curatedKey]) {
    const curated = CURATED_CITY_ARTWORK[identity.curatedKey];
    const contentHash = fnv1aHex(
      `${ART_RESOLVER_VERSION}:${identity.canonicalId}:${curated.assetPath}`
    );
    return {
      schemaVersion: ART_SCHEMA_VERSION,
      artVersion: ART_RESOLVER_VERSION,
      destinationId: identity.canonicalId,
      artworkId: `art:curated:${curated.key}`,
      kind: 'curated_local',
      curatedCityKey: curated.key,
      assetPath: curated.assetPath,
      imageUrl: curated.assetPath,
      fallbackScene: { ...curated.fallbackScene },
      alt: curated.alt,
      landmarkVerified: true,
      landmarkName: curated.landmarkName,
      focalPoint: { ...curated.focalPoint },
      resolvedAt,
      contentHash,
    };
  }

  // Tier 2: Trusted Regional Master
  const regionKey = resolveRegionArtworkKey(identity.admin1);
  if (regionKey && REGIONAL_ARTWORK[regionKey]) {
    const region = REGIONAL_ARTWORK[regionKey];
    const fallbackScene = buildLocalSceneParameters(identity);
    const contentHash = fnv1aHex(
      `${ART_RESOLVER_VERSION}:${identity.canonicalId}:${region.assetPath}`
    );
    return {
      schemaVersion: ART_SCHEMA_VERSION,
      artVersion: ART_RESOLVER_VERSION,
      destinationId: identity.canonicalId,
      artworkId: `art:region:${regionKey}`,
      kind: 'curated_local',
      assetPath: region.assetPath,
      imageUrl: region.assetPath,
      fallbackScene,
      alt: buildAccessibleAltText(identity) || region.alt,
      landmarkVerified: false,
      focalPoint: { ...region.focalPoint },
      resolvedAt,
      contentHash,
    };
  }

  // Tier 3: India Neutral Fallback
  const fallback = INDIA_FALLBACK_ARTWORK;
  const fallbackScene = buildLocalSceneParameters(identity);
  const contentHash = fnv1aHex(
    `${ART_RESOLVER_VERSION}:${identity.canonicalId}:${fallback.assetPath}`
  );
  return {
    schemaVersion: ART_SCHEMA_VERSION,
    artVersion: ART_RESOLVER_VERSION,
    destinationId: identity.canonicalId,
    artworkId: 'art:fallback:india',
    kind: 'curated_local',
    assetPath: fallback.assetPath,
    imageUrl: fallback.assetPath,
    fallbackScene,
    alt: buildAccessibleAltText(identity) || fallback.alt,
    landmarkVerified: false,
    focalPoint: { ...fallback.focalPoint },
    resolvedAt,
    contentHash,
  };
}
