import {
  WEATHER_THRESHOLDS,
  WMO_CLEAR_CODES,
  WMO_RAIN_CODES,
  WMO_SNOW_CODES,
  WMO_STORM_CODES,
  WEATHER_RULE_IDS,
} from '../constants/weatherThresholds';
import { AuditEntry, DayForecast, DayWeatherState } from '../types/engine';

export interface DayClassification {
  state: DayWeatherState;
  summary: string;
  isEstimated: boolean;
  source: 'forecast' | 'historical_estimate' | 'fallback_estimate';
  confidence: 'high' | 'medium' | 'low';
  temporalResolution: 'daily' | 'hourly';
  auditEntries: AuditEntry[];
}

/**
 * Pure classifier: maps meteorological forecast data to an engine weather state.
 * Evaluates temporal resolution, honest historical confidence, and severe meteorological thresholds.
 */
export function classifyDay(
  dayNumber: number,
  forecast: DayForecast
): DayClassification {
  const auditEntries: AuditEntry[] = [];
  const isEstimated = Boolean(forecast.estimated);
  const source = forecast.source || (isEstimated ? 'historical_estimate' : 'forecast');
  const confidence = forecast.confidence || (isEstimated ? 'low' : 'high');
  const temporalResolution = forecast.temporalResolution || 'daily';

  // Audit temporal resolution limitation honestly
  if (temporalResolution === 'daily') {
    auditEntries.push({
      dayNumber,
      stage: 'WEATHER_FILTER',
      candidateId: `forecast-res-${dayNumber}`,
      candidateTitle: `Weather Resolution Day ${dayNumber}`,
      verdict: 'KEPT',
      ruleId: WEATHER_RULE_IDS.WX_TEMPORAL_RESOLUTION_DAILY,
      reason:
        'Weather temporal resolution is daily; time-of-day variations approximated. Full slot-window safety constraints applied.',
    });
  }

  // Audit estimation and fallback confidence
  if (source === 'fallback_estimate') {
    auditEntries.push({
      dayNumber,
      stage: 'WEATHER_FILTER',
      candidateId: `forecast-day-${dayNumber}`,
      candidateTitle: `Weather Day ${dayNumber}`,
      verdict: 'KEPT',
      ruleId: WEATHER_RULE_IDS.WX_LOW_CONFIDENCE_WARNING,
      reason:
        'Meteorological provider feeds unavailable; qualified low-confidence baseline applied. Unknown weather is NOT assumed clear.',
    });
  } else if (isEstimated || source === 'historical_estimate') {
    auditEntries.push({
      dayNumber,
      stage: 'WEATHER_FILTER',
      candidateId: `forecast-day-${dayNumber}`,
      candidateTitle: `Weather Day ${dayNumber}`,
      verdict: 'KEPT',
      ruleId: WEATHER_RULE_IDS.WX_ESTIMATED_NOTICE,
      reason:
        'Date exceeds standard 16-day forecast horizon; using destination historical climate estimate (low confidence).',
    });
  }

  let state: DayWeatherState = 'MIXED';
  let conditionText = 'Mixed weather';

  // Severe storms / heavy precipitation / gale winds
  if (
    WMO_STORM_CODES.has(forecast.weatherCode) ||
    (forecast.precipitationMm !== undefined && forecast.precipitationMm >= 25.0) ||
    (forecast.windSpeed !== undefined && forecast.windSpeed >= 60.0)
  ) {
    state = 'STORM';
    conditionText = 'Thunderstorms or severe rain forecast';
  } else if (
    forecast.maxTemp >= WEATHER_THRESHOLDS.EXTREME_HEAT_MAX_TEMP_C
  ) {
    state = 'EXTREME_HEAT';
    conditionText = `Extreme heat up to ${Math.round(forecast.maxTemp)}°C`;
  } else if (
    WMO_RAIN_CODES.has(forecast.weatherCode) ||
    WMO_SNOW_CODES.has(forecast.weatherCode) ||
    (forecast.precipitationMm !== undefined && forecast.precipitationMm >= 2.5)
  ) {
    state = 'RAIN';
    conditionText = WMO_SNOW_CODES.has(forecast.weatherCode)
      ? 'Snow showers forecast'
      : 'Rain showers forecast';
  } else if (
    forecast.maxTemp <= WEATHER_THRESHOLDS.COLD_MAX_TEMP_C &&
    forecast.windSpeed >= WEATHER_THRESHOLDS.HIGH_WIND_SPEED_KMH
  ) {
    state = 'COLD_WIND';
    conditionText = `Cold and windy (${Math.round(forecast.windSpeed)} km/h)`;
  } else if (
    WMO_CLEAR_CODES.has(forecast.weatherCode) &&
    source !== 'fallback_estimate'
  ) {
    // Unknown fallback must NOT classify unknown weather as confirmed clear/sunny
    state = 'CLEAR';
    conditionText = 'Clear and sunny';
  }

  let summaryQualifier = '';
  if (source === 'historical_estimate') {
    summaryQualifier = ' (Historical climate estimate)';
  } else if (source === 'fallback_estimate') {
    summaryQualifier = ' (Unconfirmed fallback)';
  }

  const summary = `${conditionText}, ${Math.round(forecast.minTemp)}°C - ${Math.round(
    forecast.maxTemp
  )}°C${summaryQualifier}`;

  return {
    state,
    summary,
    isEstimated,
    source,
    confidence,
    temporalResolution,
    auditEntries,
  };
}
