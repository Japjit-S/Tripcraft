import {
  PERSONA_CATEGORY_AFFINITIES,
  PERSONA_TAG_KEYWORDS,
  PERSONA_WEIGHTS,
} from '../constants/personaWeights';
import {
  ActivityCategory,
  CandidateActivity,
  DayWeatherState,
  Persona,
  ScoreBreakdown,
  Slot,
} from '../types/engine';
import { calculateDistanceKm } from './clustering';

export interface ScoreCandidateParams {
  candidate: CandidateActivity;
  persona: Persona;
  weatherState: DayWeatherState;
  slot: Slot;
  anchorCoords?: { lat: number; lon: number };
  categoriesSelectedInDay: ActivityCategory[];
  intensityLoadSoFar: number; // sum of intensity values (LOW=1, MED=2, HIGH=3)
}

export interface ScoredCandidate {
  candidate: CandidateActivity;
  score: number;
  breakdown: ScoreBreakdown;
}

export function scoreCandidate(params: ScoreCandidateParams): ScoredCandidate {
  const {
    candidate,
    persona,
    weatherState,
    slot,
    anchorCoords,
    categoriesSelectedInDay,
    intensityLoadSoFar,
  } = params;

  const weights = PERSONA_WEIGHTS[persona];

  // 1. Prominence (0 to 1)
  const normProminence = Math.max(0, Math.min(1, candidate.prominence));

  // 2. Persona Affinity (0 to 1)
  const catAffinity =
    PERSONA_CATEGORY_AFFINITIES[persona][candidate.category] ?? 0.5;
  const targetKeywords = PERSONA_TAG_KEYWORDS[persona];
  const tagMatches = candidate.tags.filter((t) =>
    targetKeywords.some((k) => t.toLowerCase().includes(k))
  ).length;
  const normTagAffinity = Math.min(1, tagMatches * 0.35);
  const normPersonaAffinity = 0.6 * catAffinity + 0.4 * normTagAffinity;

  // 3. Weather Fit (0 to 1)
  let normWeatherFit = 0.8;
  if (weatherState === 'RAIN' || weatherState === 'STORM') {
    normWeatherFit = candidate.indoor ? 1.0 : 0.0;
  } else if (weatherState === 'CLEAR') {
    normWeatherFit = candidate.indoor ? 0.8 : 1.0;
  } else if (weatherState === 'EXTREME_HEAT') {
    if (candidate.indoor) normWeatherFit = 1.0;
    else if (candidate.intensity === 'LOW') normWeatherFit = 0.65;
    else if (candidate.intensity === 'MEDIUM') normWeatherFit = 0.35;
    else normWeatherFit = 0.1;
  } else if (weatherState === 'COLD_WIND') {
    normWeatherFit = candidate.indoor ? 1.0 : 0.45;
  }

  // 4. Slot Fit (0 to 1)
  let normSlotFit = candidate.slotAffinity.includes(slot) ? 1.0 : 0.3;
  if (slot === 'EVENING') {
    const isNightSuited =
      candidate.category === 'FOOD' ||
      candidate.category === 'MARKET' ||
      candidate.category === 'ENTERTAINMENT' ||
      candidate.tags.some(
        (t) =>
          t.includes('sunset') ||
          t.includes('night') ||
          t.includes('dinner') ||
          t.includes('viewpoint')
      );
    normSlotFit = isNightSuited ? 1.0 : candidate.slotAffinity.includes('EVENING') ? 0.7 : 0.2;
  }

  // 5. Proximity to Day Anchor (0 to 1)
  let normProximity = 1.0;
  if (anchorCoords) {
    const distanceKm = calculateDistanceKm(candidate.coords, anchorCoords);
    normProximity = Math.max(0, 1 - distanceKm / 15);
  }

  // 6. Category Repetition Penalty (0 to 1)
  const repeats = categoriesSelectedInDay.filter(
    (c) => c === candidate.category
  ).length;
  const normCategoryRepeat = Math.min(1.0, repeats * 0.5);

  // 7. Fatigue Cost Penalty (0 to 1)
  const itemIntensityVal =
    candidate.intensity === 'HIGH' ? 3 : candidate.intensity === 'MEDIUM' ? 2 : 1;
  const totalLoad = intensityLoadSoFar + itemIntensityVal;
  const normFatigue = Math.min(1.0, totalLoad / 6);

  // Weighted Sum
  const termProminence = weights.prominence * normProminence;
  const termPersona = weights.personaAffinity * normPersonaAffinity;
  const termWeather = weights.weatherFit * normWeatherFit;
  const termSlot = weights.slotFit * normSlotFit;
  const termProximity = weights.proximityToDayAnchor * normProximity;
  const termCategoryRepetition = weights.categoryRepetition * normCategoryRepeat;
  const termFatigue = weights.fatigueCost * normFatigue;

  const total =
    termProminence +
    termPersona +
    termWeather +
    termSlot +
    termProximity -
    termCategoryRepetition -
    termFatigue;

  const breakdown: ScoreBreakdown = {
    prominence: Number(termProminence.toFixed(1)),
    personaAffinity: Number(termPersona.toFixed(1)),
    weatherFit: Number(termWeather.toFixed(1)),
    slotFit: Number(termSlot.toFixed(1)),
    proximityToDayAnchor: Number(termProximity.toFixed(1)),
    categoryRepetition: Number(termCategoryRepetition.toFixed(1)),
    fatigueCost: Number(termFatigue.toFixed(1)),
    total: Number(total.toFixed(1)),
  };

  return {
    candidate,
    score: breakdown.total,
    breakdown,
  };
}

/**
 * Sorts scored candidates with stable tie-breaking on candidate id
 */
export function sortScoredCandidates(
  candidates: ScoredCandidate[]
): ScoredCandidate[] {
  return [...candidates].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Stable tie-breaker on ID
    return a.candidate.id.localeCompare(b.candidate.id);
  });
}
