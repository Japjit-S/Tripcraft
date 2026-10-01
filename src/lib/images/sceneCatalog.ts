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
    assetPath: '/banners/jaipur.svg',
    landmarkName: 'Hawa Mahal & Amber Fort',
    alt: 'Illustrated view of Hawa Mahal and Amber Fort hill silhouette in Jaipur',
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
    assetPath: '/banners/delhi.svg',
    landmarkName: 'India Gate & Red Fort',
    alt: 'Illustrated view of India Gate arch and Red Fort sandstone domes in Delhi',
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
    assetPath: '/banners/agra.svg',
    landmarkName: 'Taj Mahal',
    alt: 'Illustrated view of the Taj Mahal marble domes and Yamuna riverbank in Agra',
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
    assetPath: '/banners/varanasi.svg',
    landmarkName: 'Dashashwamedh Ghat & Riverfront Spires',
    alt: 'Illustrated view of Varanasi stepped ghats, temple spires, and boats along the Ganges',
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
    assetPath: '/banners/udaipur.svg',
    landmarkName: 'City Palace & Lake Pichola',
    alt: 'Illustrated view of Udaipur City Palace, Lake Pichola pavilions, and Aravalli hills',
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
    assetPath: '/banners/goa.svg',
    landmarkName: 'Basilica of Bom Jesus, Fontainhas & Aguada Lighthouse',
    alt: 'Illustrated coastal view of Goa with Fontainhas villas, lighthouse, and palm-lined Arabian Sea',
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

/**
 * Synchronously resolves a complete local DestinationArtworkDescriptor
 * with zero network calls. Used for curated flagship cities, offline/fallback
 * paths, and legacy stored trips lacking persisted artwork metadata.
 */
export function resolveLocalDestinationArtwork(
  input: DestinationIdentityInput | string | null | undefined,
  resolvedAt: string = DETERMINISTIC_RESOLVED_AT
): DestinationArtworkDescriptor {
  const identity = normalizeDestinationIdentity(input);

  if (identity.curatedKey) {
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
      fallbackScene: { ...curated.fallbackScene },
      alt: curated.alt,
      landmarkVerified: true,
      landmarkName: curated.landmarkName,
      focalPoint: { ...curated.focalPoint },
      resolvedAt,
      contentHash,
    };
  }

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
