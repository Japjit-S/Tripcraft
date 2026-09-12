import {
  CandidateActivity,
  DayForecast,
  Destination,
  FeasibilityRule,
} from '../../src/lib/types/engine';

export const mockDestination: Destination = {
  id: 'dest-jaipur',
  city: 'Jaipur',
  country: 'India',
  countryCode: 'IN',
  latitude: 26.9124,
  longitude: 75.7873,
};

export const mockCandidates: CandidateActivity[] = [
  {
    id: 'pack:jaipur-hawa-mahal',
    title: 'Hawa Mahal',
    category: 'LANDMARK',
    indoor: false,
    intensity: 'LOW',
    typicalDurationMin: 60,
    slotAffinity: ['MORNING', 'AFTERNOON'],
    prominence: 0.95,
    coords: { lat: 26.9239, lon: 75.8267 },
    tags: ['palace', 'historic', 'architecture', 'unesco', 'monument', 'walkable'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Hawa_Mahal',
  },
  {
    id: 'pack:jaipur-amber-fort',
    title: 'Amber Fort',
    category: 'LANDMARK',
    indoor: false,
    intensity: 'HIGH',
    typicalDurationMin: 180,
    slotAffinity: ['MORNING', 'AFTERNOON'],
    prominence: 0.92,
    coords: { lat: 26.9855, lon: 75.8513 },
    tags: ['fort', 'historic', 'unesco', 'scenic', 'heritage'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Amer_Fort',
  },
  {
    id: 'pack:jaipur-city-palace',
    title: 'City Palace',
    category: 'CULTURE',
    indoor: true,
    intensity: 'MEDIUM',
    typicalDurationMin: 120,
    slotAffinity: ['MORNING', 'AFTERNOON'],
    prominence: 0.88,
    coords: { lat: 26.9258, lon: 75.8236 },
    tags: ['museum', 'palace', 'royal', 'heritage', 'culture'],
  },
  {
    id: 'pack:jaipur-albert-hall',
    title: 'Albert Hall Museum',
    category: 'CULTURE',
    indoor: true,
    intensity: 'LOW',
    typicalDurationMin: 90,
    slotAffinity: ['MORNING', 'AFTERNOON'],
    prominence: 0.84,
    coords: { lat: 26.9116, lon: 75.8195 },
    tags: ['museum', 'art', 'history', 'craft', 'indoor', 'kid_friendly', 'family_friendly'],
  },
  {
    id: 'pack:jaipur-walking-tour',
    title: 'Old City Walking Tour',
    category: 'CULTURE',
    indoor: false,
    intensity: 'HIGH',
    typicalDurationMin: 150,
    slotAffinity: ['MORNING'],
    prominence: 0.72,
    coords: { lat: 26.922, lon: 75.825 },
    tags: ['walking_tour', 'outdoor', 'walkable', 'historic', 'budget'],
  },
  {
    id: 'pack:jaipur-science-park',
    title: 'Regional Science Park',
    category: 'ENTERTAINMENT',
    indoor: true,
    intensity: 'LOW',
    typicalDurationMin: 90,
    slotAffinity: ['MORNING', 'AFTERNOON'],
    prominence: 0.65,
    coords: { lat: 26.905, lon: 75.805 },
    tags: ['kid_friendly', 'family_friendly', 'interactive', 'science', 'indoor'],
  },
  {
    id: 'pack:jaipur-anokhi-museum',
    title: 'Anokhi Museum of Hand Printing',
    category: 'CULTURE',
    indoor: true,
    intensity: 'LOW',
    typicalDurationMin: 60,
    slotAffinity: ['MORNING', 'AFTERNOON'],
    prominence: 0.7,
    coords: { lat: 26.992, lon: 75.853 },
    tags: ['museum', 'craft', 'textiles', 'indoor', 'heritage'],
  },
  {
    id: 'pack:jaipur-bapu-bazaar',
    title: 'Bapu Bazaar',
    category: 'MARKET',
    indoor: false,
    intensity: 'MEDIUM',
    typicalDurationMin: 90,
    slotAffinity: ['AFTERNOON', 'EVENING'],
    prominence: 0.78,
    coords: { lat: 26.919, lon: 75.821 },
    tags: ['market', 'bazaar', 'shopping', 'street_food', 'budget', 'evening'],
  },
  {
    id: 'pack:jaipur-chokhi-dhani',
    title: 'Chokhi Dhani Ethnic Resort & Dining',
    category: 'FOOD',
    indoor: false,
    intensity: 'LOW',
    typicalDurationMin: 180,
    slotAffinity: ['EVENING'],
    prominence: 0.81,
    coords: { lat: 26.766, lon: 75.836 },
    tags: ['dinner', 'culture', 'night', 'street_food', 'sunset', 'entertainment', 'family_friendly'],
  },
  {
    id: 'pack:jaipur-jal-mahal',
    title: 'Jal Mahal Viewpoint',
    category: 'NATURE',
    indoor: false,
    intensity: 'LOW',
    typicalDurationMin: 45,
    slotAffinity: ['EVENING'],
    prominence: 0.85,
    coords: { lat: 26.9534, lon: 75.8462 },
    tags: ['scenic', 'sunset', 'viewpoint', 'lake', 'evening'],
  },
];

export const clearForecast3Days: DayForecast[] = [
  {
    date: '2026-10-15',
    weatherCode: 0, // Clear sky
    maxTemp: 28,
    minTemp: 18,
    windSpeed: 10,
    precipitationMm: 0,
  },
  {
    date: '2026-10-16',
    weatherCode: 1, // Mainly clear
    maxTemp: 29,
    minTemp: 19,
    windSpeed: 12,
    precipitationMm: 0,
  },
  {
    date: '2026-10-17',
    weatherCode: 0,
    maxTemp: 27,
    minTemp: 17,
    windSpeed: 9,
    precipitationMm: 0,
  },
];

export const rainyForecast3Days: DayForecast[] = [
  {
    date: '2026-10-15',
    weatherCode: 61, // Rain
    maxTemp: 20,
    minTemp: 15,
    windSpeed: 18,
    precipitationMm: 8.5,
  },
  {
    date: '2026-10-16',
    weatherCode: 63, // Moderate Rain
    maxTemp: 19,
    minTemp: 14,
    windSpeed: 20,
    precipitationMm: 12.0,
  },
  {
    date: '2026-10-17',
    weatherCode: 65, // Heavy Rain
    maxTemp: 18,
    minTemp: 13,
    windSpeed: 22,
    precipitationMm: 15.0,
  },
];

export const extremeHeatForecast3Days: DayForecast[] = [
  {
    date: '2026-05-15',
    weatherCode: 0,
    maxTemp: 43,
    minTemp: 31,
    windSpeed: 14,
    precipitationMm: 0,
  },
  {
    date: '2026-05-16',
    weatherCode: 0,
    maxTemp: 44,
    minTemp: 32,
    windSpeed: 16,
    precipitationMm: 0,
  },
  {
    date: '2026-05-17',
    weatherCode: 0,
    maxTemp: 42,
    minTemp: 30,
    windSpeed: 15,
    precipitationMm: 0,
  },
];

export const blockFeasibilityRule: FeasibilityRule = {
  id: 'rule-block-security',
  scope: 'Jaipur',
  ruleType: 'geopolitical',
  severity: 'block',
  message: 'Travel blocked to destination under active travel warning.',
};

export const cautionFeasibilityRule: FeasibilityRule = {
  id: 'rule-caution-heat',
  scope: 'Jaipur',
  ruleType: 'seasonal',
  severity: 'caution',
  message: 'Extreme temperature advisory in effect.',
};
