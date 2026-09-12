/**
 * Core engine domain types for Roamwise deterministic itinerary generation.
 * Per ENGINE_BRIEF.md specifications.
 */

export type Persona =
  | 'Backpacker'
  | 'Culture Seeker'
  | 'Comfort Traveller'
  | 'Family';

export type ArrivalMode = 'flight' | 'train' | 'bus';

export type DayWeatherState =
  | 'CLEAR'
  | 'RAIN'
  | 'STORM'
  | 'EXTREME_HEAT'
  | 'COLD_WIND'
  | 'MIXED';

export type Slot = 'MORNING' | 'AFTERNOON' | 'EVENING';

export type ActivityCategory =
  | 'CULTURE'
  | 'NATURE'
  | 'FOOD'
  | 'MARKET'
  | 'LANDMARK'
  | 'ENTERTAINMENT'
  | 'RELAXATION';

export type Intensity = 'LOW' | 'MEDIUM' | 'HIGH';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface TimeWindow {
  open: string; // e.g. "09:00"
  close: string; // e.g. "18:00"
}

export type OpeningHours = Partial<Record<DayOfWeek, TimeWindow[] | 'closed'>>;

export interface CandidateActivity {
  id: string; // stable, source-prefixed e.g. "osm:node/123", "pack:jaipur-hawa-mahal"
  title: string;
  category: ActivityCategory;
  indoor: boolean;
  intensity: Intensity; // walking / physical load
  typicalDurationMin: number;
  slotAffinity: Slot[]; // which slots this suits
  prominence: number; // 0–1, normalised
  coords: { lat: number; lon: number };
  openingHours?: OpeningHours; // parsed, optional
  tags: string[]; // free-form, used by persona scoring
  sourceUrl?: string;
}

export interface ScoreBreakdown {
  prominence: number;
  personaAffinity: number;
  weatherFit: number;
  slotFit: number;
  proximityToDayAnchor: number;
  categoryRepetition: number;
  fatigueCost: number;
  total: number;
}

export interface AuditEntry {
  dayNumber: number;
  stage:
    | 'FEASIBILITY'
    | 'WEATHER_FILTER'
    | 'ARRIVAL_GATE'
    | 'HOURS_FILTER'
    | 'SCORING'
    | 'ALLOCATION'
    | 'DEGRADATION';
  candidateId: string;
  candidateTitle: string;
  verdict: 'KEPT' | 'REMOVED' | 'DEFERRED' | 'SELECTED';
  ruleId: string; // machine id, e.g. "WX_RAIN_OUTDOOR"
  reason: string; // human sentence for the UI
  scoreBreakdown?: ScoreBreakdown; // present on SCORING / SELECTED
}

export interface Destination {
  id: string;
  city: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

export interface FeasibilityRule {
  id: string;
  scope: string; // city, country code, or "*"
  ruleType: 'geopolitical' | 'advisory' | 'seasonal' | 'weather';
  severity: 'info' | 'caution' | 'block';
  message: string;
  sourceUrl?: string;
  reviewedAt?: string;
}

export interface DayForecast {
  date: string; // YYYY-MM-DD
  weatherCode: number; // WMO weather code from Open-Meteo
  maxTemp: number; // °C
  minTemp: number; // °C
  windSpeed: number; // km/h
  precipitationMm?: number;
  estimated?: boolean; // true when fallback archive/seasonal data is used
}

export interface EngineInput {
  destination: Destination;
  startDate: string; // YYYY-MM-DD
  days: number; // 1 to 7
  persona: 'Backpacker' | 'Culture Seeker' | 'Comfort Traveller' | 'Family';
  originCity?: string;
  arrivalMode?: 'flight' | 'train' | 'bus';
  arrivalAt?: string; // e.g. "14:30" or "02:30 PM"
  weatherForecast: DayForecast[];
  candidates: CandidateActivity[];
  feasibilityRules?: FeasibilityRule[];
}

export interface EngineItineraryItem {
  id: string;
  candidateId: string;
  title: string;
  category: ActivityCategory | string;
  indoor: boolean;
  slot: Slot;
  reason: string;
  intensity: Intensity;
  typicalDurationMin: number;
  coords: { lat: number; lon: number };
  scoreBreakdown?: ScoreBreakdown;
  isFlex?: boolean;
  flexReason?: string;
}

export interface EngineTripDay {
  id: string;
  dayNumber: number;
  date: string;
  weatherState: DayWeatherState;
  weatherSummary: string;
  isEstimatedWeather?: boolean;
  morning: EngineItineraryItem[];
  afternoon: EngineItineraryItem[];
  evening: EngineItineraryItem[];
}

export interface EngineOutput {
  success: boolean;
  itineraryDays: EngineTripDay[];
  auditLog: AuditEntry[];
  warnings: string[];
  feasibilityStatus: 'PASSED' | 'CAUTION' | 'BLOCKED';
  blockReason?: string;
}

export interface ActivityProvider {
  getCandidates(dest: Destination): Promise<CandidateActivity[]>;
}
