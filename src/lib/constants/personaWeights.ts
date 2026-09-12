import { ActivityCategory, Persona } from '../types';

export interface PersonaWeights {
  /** w1: Prominence weight (0-1) */
  prominence: number;
  /** w2: Persona tag and category affinity weight */
  personaAffinity: number;
  /** w3: Weather suitability score */
  weatherFit: number;
  /** w4: Slot timing suitability score */
  slotFit: number;
  /** w5: Geographic proximity to day's anchor landmark */
  proximityToDayAnchor: number;
  /** w6: Penalty for repeating a category already seen earlier that day */
  categoryRepetition: number;
  /** w7: Penalty for excessive physical fatigue / high intensity load */
  fatigueCost: number;
}

/**
 * Scoring weights by persona.
 * All weights are tuned to produce normalized score contributions in [0, 100].
 */
export const PERSONA_WEIGHTS: Record<Persona, PersonaWeights> = {
  Backpacker: {
    prominence: 25,
    personaAffinity: 30,
    weatherFit: 15,
    slotFit: 10,
    proximityToDayAnchor: 10,
    categoryRepetition: 5,
    fatigueCost: 5, // High stamina, low penalty for walking
  },
  'Culture Seeker': {
    prominence: 35, // Strong landmark/history focus
    personaAffinity: 25,
    weatherFit: 15,
    slotFit: 10,
    proximityToDayAnchor: 10,
    categoryRepetition: 7,
    fatigueCost: 8,
  },
  'Comfort Traveller': {
    prominence: 30,
    personaAffinity: 20,
    weatherFit: 20, // Sensitive to weather conditions
    slotFit: 15,
    proximityToDayAnchor: 15, // Strongly dislikes long transit between items
    categoryRepetition: 10,
    fatigueCost: 20, // Prefers low friction and relaxed pace
  },
  Family: {
    prominence: 20,
    personaAffinity: 30, // Strongly favours kid/family-friendly items
    weatherFit: 20, // Weather safety is critical for children
    slotFit: 10,
    proximityToDayAnchor: 15, // Short travel segments between activities
    categoryRepetition: 10,
    fatigueCost: 25, // High fatigue penalty (short segments, rest time)
  },
};

/**
 * Base category affinities (0.0 to 1.0) per persona.
 */
export const PERSONA_CATEGORY_AFFINITIES: Record<
  Persona,
  Record<ActivityCategory, number>
> = {
  Backpacker: {
    CULTURE: 0.7,
    NATURE: 0.9,
    FOOD: 0.9,
    MARKET: 0.85,
    LANDMARK: 0.8,
    ENTERTAINMENT: 0.75,
    RELAXATION: 0.6,
  },
  'Culture Seeker': {
    CULTURE: 1.0,
    LANDMARK: 1.0,
    MARKET: 0.8,
    NATURE: 0.6,
    FOOD: 0.7,
    ENTERTAINMENT: 0.6,
    RELAXATION: 0.5,
  },
  'Comfort Traveller': {
    RELAXATION: 0.95,
    FOOD: 0.9,
    LANDMARK: 0.85,
    CULTURE: 0.8,
    NATURE: 0.7,
    ENTERTAINMENT: 0.7,
    MARKET: 0.6,
  },
  Family: {
    ENTERTAINMENT: 0.95,
    NATURE: 0.9,
    RELAXATION: 0.85,
    CULTURE: 0.75,
    LANDMARK: 0.75,
    FOOD: 0.7,
    MARKET: 0.5,
  },
};

/**
 * Tag keywords that trigger affinity boosts per persona.
 */
export const PERSONA_TAG_KEYWORDS: Record<Persona, string[]> = {
  Backpacker: [
    'budget',
    'walkable',
    'street_food',
    'local_food',
    'viewpoint',
    'free',
    'outdoor',
    'scenic',
    'bazaar',
    'sunset',
  ],
  'Culture Seeker': [
    'history',
    'historic',
    'museum',
    'unesco',
    'heritage',
    'palace',
    'fort',
    'temple',
    'architecture',
    'art',
    'monument',
    'handicraft',
  ],
  'Comfort Traveller': [
    'scenic',
    'fine_dining',
    'premium',
    'comfortable',
    'relaxed',
    'garden',
    'viewpoint',
    'palace',
    'cafe',
    'luxury',
  ],
  Family: [
    'family_friendly',
    'kid_friendly',
    'interactive',
    'park',
    'garden',
    'science',
    'zoo',
    'museum',
    'easy',
    'indoor',
    'craft',
  ],
};
