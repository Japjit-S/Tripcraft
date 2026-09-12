import { WEATHER_RULE_IDS } from '../constants/weatherThresholds';
import {
  AuditEntry,
  CandidateActivity,
  DayOfWeek,
  DayWeatherState,
  Destination,
  FeasibilityRule,
  Slot,
} from '../types/engine';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function getDayOfWeek(dateStr: string): DayOfWeek {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return DAYS_OF_WEEK[d.getUTCDay()];
}

export function parseArrivalTimeMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export interface FeasibilityCheckResult {
  isBlocked: boolean;
  blockReason?: string;
  warnings: string[];
  auditEntries: AuditEntry[];
}

export function evaluateFeasibility(
  destination: Destination,
  rules: FeasibilityRule[] = []
): FeasibilityCheckResult {
  const warnings: string[] = [];
  const auditEntries: AuditEntry[] = [];
  let isBlocked = false;
  let blockReason: string | undefined;

  for (const rule of rules) {
    const scopeMatch =
      rule.scope === '*' ||
      rule.scope.toLowerCase() === destination.city.toLowerCase() ||
      (destination.countryCode &&
        rule.scope.toUpperCase() === destination.countryCode.toUpperCase()) ||
      rule.scope.toLowerCase() === destination.country.toLowerCase();

    if (!scopeMatch) continue;

    if (rule.severity === 'block') {
      isBlocked = true;
      blockReason = rule.message;
      auditEntries.push({
        dayNumber: 0,
        stage: 'FEASIBILITY',
        candidateId: rule.id,
        candidateTitle: `Feasibility: ${rule.scope}`,
        verdict: 'REMOVED',
        ruleId: 'FEASIBILITY_BLOCK',
        reason: rule.message,
      });
      break;
    }

    if (rule.severity === 'caution') {
      warnings.push(`Caution: ${rule.message}`);
      auditEntries.push({
        dayNumber: 0,
        stage: 'FEASIBILITY',
        candidateId: rule.id,
        candidateTitle: `Feasibility: ${rule.scope}`,
        verdict: 'KEPT',
        ruleId: 'FEASIBILITY_CAUTION',
        reason: rule.message,
      });
    }
  }

  return { isBlocked, blockReason, warnings, auditEntries };
}

export interface HardFilterDayResult {
  survivors: CandidateActivity[];
  blockedSlots: Slot[];
  auditEntries: AuditEntry[];
}

/**
 * Stage 2: Pure binary hard filters per day (weather gates, arrival gate, opening hours)
 */
export function applyHardFiltersForDay(params: {
  dayNumber: number;
  dateStr: string;
  weatherState: DayWeatherState;
  candidates: CandidateActivity[];
  arrivalAt?: string;
}): HardFilterDayResult {
  const { dayNumber, dateStr, weatherState, candidates, arrivalAt } = params;
  const auditEntries: AuditEntry[] = [];
  const blockedSlots: Slot[] = [];

  // 1. Arrival Gate (Day 1 only)
  if (dayNumber === 1 && arrivalAt) {
    const arrivalMinutes = parseArrivalTimeMinutes(arrivalAt);
    if (arrivalMinutes !== null) {
      if (arrivalMinutes >= 11 * 60 + 30) {
        blockedSlots.push('MORNING');
        auditEntries.push({
          dayNumber: 1,
          stage: 'ARRIVAL_GATE',
          candidateId: 'slot-morning',
          candidateTitle: 'Morning Slot',
          verdict: 'REMOVED',
          ruleId: 'ARRIVAL_LATE_MORNING',
          reason: `Arrival scheduled at ${arrivalAt}; morning slot collapsed for transit and check-in.`,
        });
      }
      if (arrivalMinutes >= 17 * 60) {
        blockedSlots.push('AFTERNOON');
        auditEntries.push({
          dayNumber: 1,
          stage: 'ARRIVAL_GATE',
          candidateId: 'slot-afternoon',
          candidateTitle: 'Afternoon Slot',
          verdict: 'REMOVED',
          ruleId: 'ARRIVAL_LATE_AFTERNOON',
          reason: `Arrival scheduled at ${arrivalAt}; afternoon slot collapsed for transit and check-in.`,
        });
      }
    }
  }

  const dayOfWeek = getDayOfWeek(dateStr);
  const survivors: CandidateActivity[] = [];

  for (const candidate of candidates) {
    // 2. Opening Hours Filter
    if (candidate.openingHours) {
      const daySchedule = candidate.openingHours[dayOfWeek];
      if (daySchedule === 'closed') {
        auditEntries.push({
          dayNumber,
          stage: 'HOURS_FILTER',
          candidateId: candidate.id,
          candidateTitle: candidate.title,
          verdict: 'REMOVED',
          ruleId: 'HOURS_CLOSED_DAY',
          reason: `Closed on ${dayOfWeek}s per schedule.`,
        });
        continue;
      }
    }

    // 3. Weather Gates
    if (weatherState === 'RAIN' || weatherState === 'STORM') {
      const isWaterOrRooftop = candidate.tags.some(
        (t) =>
          t.includes('water') ||
          t.includes('boat') ||
          t.includes('rooftop') ||
          t.includes('walking_tour')
      );
      if (!candidate.indoor || isWaterOrRooftop) {
        auditEntries.push({
          dayNumber,
          stage: 'WEATHER_FILTER',
          candidateId: candidate.id,
          candidateTitle: candidate.title,
          verdict: 'REMOVED',
          ruleId:
            weatherState === 'STORM'
              ? WEATHER_RULE_IDS.WX_STORM_OUTDOOR
              : WEATHER_RULE_IDS.WX_RAIN_OUTDOOR,
          reason: `Outdoor activity removed due to forecast ${weatherState.toLowerCase()} conditions.`,
        });
        continue;
      }
    }

    if (weatherState === 'EXTREME_HEAT' && !candidate.indoor) {
      if (candidate.intensity === 'HIGH') {
        // High intensity outdoor items cannot run in midday heat
        candidate.slotAffinity = candidate.slotAffinity.filter(
          (s) => s !== 'AFTERNOON'
        );
        if (candidate.slotAffinity.length === 0) {
          auditEntries.push({
            dayNumber,
            stage: 'WEATHER_FILTER',
            candidateId: candidate.id,
            candidateTitle: candidate.title,
            verdict: 'REMOVED',
            ruleId: WEATHER_RULE_IDS.WX_HEAT_MIDDAY_INTENSE,
            reason:
              'High-intensity outdoor activity unsafe during extreme heat conditions.',
          });
          continue;
        }
      }
    }

    survivors.push(candidate);
  }

  return { survivors, blockedSlots, auditEntries };
}
