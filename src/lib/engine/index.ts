import {
  AuditEntry,
  EngineInput,
  EngineOutput,
} from '../types/engine';
import { allocateItinerarySlots, DayAllocationInput } from './allocation';
import { classifyDay } from './classifyDay';
import {
  applyHardFiltersForDay,
  evaluateFeasibility,
} from './hardFilters';
import { addDaysToDate } from './timezone';

/**
 * Pure, deterministic itinerary generation engine.
 * Performs ZERO I/O (no fetch, no async, no Date.now(), no Math.random()).
 *
 * Given the exact same EngineInput, it produces byte-identical EngineOutput.
 */
export function generateItinerary(input: EngineInput): EngineOutput {
  // ==========================================
  // Validation Gates (Useful typed errors, no crashes)
  // ==========================================
  if (!input.destination || !input.destination.city?.trim()) {
    return {
      success: false,
      itineraryDays: [],
      auditLog: [],
      warnings: [],
      feasibilityStatus: 'BLOCKED',
      blockReason: 'Invalid destination: destination city is required.',
    };
  }

  if (
    typeof input.days !== 'number' ||
    !Number.isInteger(input.days) ||
    input.days < 1 ||
    input.days > 7
  ) {
    return {
      success: false,
      itineraryDays: [],
      auditLog: [],
      warnings: [],
      feasibilityStatus: 'BLOCKED',
      blockReason: `Invalid trip duration: trip must be between 1 and 7 days (received ${input.days}).`,
    };
  }

  if (!input.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) {
    return {
      success: false,
      itineraryDays: [],
      auditLog: [],
      warnings: [],
      feasibilityStatus: 'BLOCKED',
      blockReason: 'Invalid start date: date must follow YYYY-MM-DD format.',
    };
  }

  if (!Array.isArray(input.weatherForecast) || input.weatherForecast.length === 0) {
    return {
      success: false,
      itineraryDays: [],
      auditLog: [],
      warnings: [],
      feasibilityStatus: 'BLOCKED',
      blockReason: 'Malformed weather payload: weatherForecast must be a non-empty array.',
    };
  }

  if (input.weatherForecast.length < input.days) {
    return {
      success: false,
      itineraryDays: [],
      auditLog: [],
      warnings: [],
      feasibilityStatus: 'BLOCKED',
      blockReason: `Insufficient weather forecast data: received ${input.weatherForecast.length} days for a ${input.days}-day trip.`,
    };
  }

  if (!Array.isArray(input.candidates)) {
    return {
      success: false,
      itineraryDays: [],
      auditLog: [],
      warnings: [],
      feasibilityStatus: 'BLOCKED',
      blockReason: 'Malformed candidate activity pool: candidates array is required.',
    };
  }

  const allAuditLog: AuditEntry[] = [];
  const allWarnings: string[] = [];

  // ==========================================
  // Stage 1 & 2: Feasibility Rules Check
  // ==========================================
  const feasibility = evaluateFeasibility(
    input.destination,
    input.feasibilityRules ?? []
  );

  allAuditLog.push(...feasibility.auditEntries);
  allWarnings.push(...feasibility.warnings);

  if (feasibility.isBlocked) {
    return {
      success: false,
      itineraryDays: [],
      auditLog: allAuditLog,
      warnings: allWarnings,
      feasibilityStatus: 'BLOCKED',
      blockReason: feasibility.blockReason,
    };
  }

  // ==========================================
  // Stages 1 & 2: Process Each Day
  // ==========================================
  const daysAllocationInput: DayAllocationInput[] = [];

  for (let i = 0; i < input.days; i++) {
    const dayNumber = i + 1;
    const dateStr = addDaysToDate(input.startDate, i);
    const dayForecast = input.weatherForecast[i];

    // Stage 1: Classify Day Weather
    const classification = classifyDay(dayNumber, dayForecast);
    allAuditLog.push(...classification.auditEntries);

    // Stage 2: Hard Filters
    const filterResult = applyHardFiltersForDay({
      dayNumber,
      dateStr,
      weatherState: classification.state,
      candidates: input.candidates,
      arrivalAt: input.arrivalAt,
    });

    allAuditLog.push(...filterResult.auditEntries);

    daysAllocationInput.push({
      dayNumber,
      dateStr,
      weatherState: classification.state,
      weatherSummary: classification.summary,
      isEstimatedWeather: classification.isEstimated,
      weatherSource: classification.source,
      weatherConfidence: classification.confidence,
      weatherResolution: classification.temporalResolution,
      blockedSlots: filterResult.blockedSlots,
      survivors: filterResult.survivors,
      arrivalAt: dayNumber === 1 ? input.arrivalAt : undefined,
    });
  }

  // ==========================================
  // Stages 3, 4, 5: Slot Allocation & Degradation
  // ==========================================
  const allocationResult = allocateItinerarySlots(
    daysAllocationInput,
    input.persona
  );

  allAuditLog.push(...allocationResult.auditEntries);

  return {
    version: 2,
    success: true,
    itineraryDays: allocationResult.itineraryDays,
    auditLog: allAuditLog,
    warnings: allWarnings,
    feasibilityStatus: allWarnings.length > 0 ? 'CAUTION' : 'PASSED',
  };
}
