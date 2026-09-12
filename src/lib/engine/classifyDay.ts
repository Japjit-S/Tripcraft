import {
  WEATHER_THRESHOLDS,
  WMO_CLEAR_CODES,
  WMO_RAIN_CODES,
  WMO_STORM_CODES,
  WEATHER_RULE_IDS,
} from '../constants/weatherThresholds';
import { AuditEntry, DayForecast, DayWeatherState } from '../types/engine';

export interface DayClassification {
  state: DayWeatherState;
  summary: string;
  isEstimated: boolean;
  auditEntries: AuditEntry[];
}

/**
 * Pure classifier: maps meteorological forecast data to an engine weather state.
 * Handles the 16-day forecast horizon hole with explicit estimation tagging.
 */
export function classifyDay(
  dayNumber: number,
  forecast: DayForecast
): DayClassification {
  const auditEntries: AuditEntry[] = [];
  const isEstimated = Boolean(forecast.estimated);

  if (isEstimated) {
    auditEntries.push({
      dayNumber,
      stage: 'WEATHER_FILTER',
      candidateId: `forecast-day-${dayNumber}`,
      candidateTitle: `Weather Day ${dayNumber}`,
      verdict: 'KEPT',
      ruleId: WEATHER_RULE_IDS.WX_ESTIMATED_NOTICE,
      reason:
        'Date exceeds standard 16-day forecast horizon; using seasonal historical estimate.',
    });
  }

  let state: DayWeatherState = 'MIXED';
  let conditionText = 'Mixed weather';

  if (WMO_STORM_CODES.has(forecast.weatherCode)) {
    state = 'STORM';
    conditionText = 'Thunderstorms forecast';
  } else if (
    forecast.maxTemp >= WEATHER_THRESHOLDS.EXTREME_HEAT_MAX_TEMP_C
  ) {
    state = 'EXTREME_HEAT';
    conditionText = `Extreme heat up to ${Math.round(forecast.maxTemp)}°C`;
  } else if (
    WMO_RAIN_CODES.has(forecast.weatherCode) ||
    (forecast.precipitationMm !== undefined && forecast.precipitationMm >= 2.5)
  ) {
    state = 'RAIN';
    conditionText = 'Rain showers forecast';
  } else if (
    forecast.maxTemp <= WEATHER_THRESHOLDS.COLD_MAX_TEMP_C &&
    forecast.windSpeed >= WEATHER_THRESHOLDS.HIGH_WIND_SPEED_KMH
  ) {
    state = 'COLD_WIND';
    conditionText = `Cold and windy (${Math.round(forecast.windSpeed)} km/h)`;
  } else if (WMO_CLEAR_CODES.has(forecast.weatherCode)) {
    state = 'CLEAR';
    conditionText = 'Clear and sunny';
  }

  const summary = `${conditionText}, ${Math.round(forecast.minTemp)}°C - ${Math.round(forecast.maxTemp)}°C${
    isEstimated ? ' (Seasonal estimate)' : ''
  }`;

  return {
    state,
    summary,
    isEstimated,
    auditEntries,
  };
}
