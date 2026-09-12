import { DayWeatherState } from '../types/engine';

/**
 * Open-Meteo WMO Weather Interpretation Codes (WW)
 * Reference: https://open-meteo.com/en/docs
 */
export const WMO_RAIN_CODES = new Set<number>([
  51, 53, 55, // Drizzle: Light, moderate, and dense intensity
  56, 57,     // Freezing Drizzle: Light and dense
  61, 63, 65, // Rain: Slight, moderate and heavy intensity
  66, 67,     // Freezing Rain: Light and heavy
  80, 81, 82, // Rain showers: Slight, moderate, and violent
]);

export const WMO_STORM_CODES = new Set<number>([
  95,         // Thunderstorm: Slight or moderate
  96, 99,     // Thunderstorm with slight and heavy hail
]);

export const WMO_SNOW_CODES = new Set<number>([
  71, 73, 75, // Snow fall: Slight, moderate, heavy
  77,         // Snow grains
  85, 86,     // Snow showers: Slight and heavy
]);

export const WMO_CLEAR_CODES = new Set<number>([
  0,          // Clear sky
  1,          // Mainly clear
]);

export const WMO_MIXED_CODES = new Set<number>([
  2,          // Partly cloudy
  3,          // Overcast
  45, 48,     // Fog and depositing rime fog
]);

/**
 * Temperature and meteorological limits
 */
export const WEATHER_THRESHOLDS = {
  /** Maximum temperature in Celsius to trigger EXTREME_HEAT */
  EXTREME_HEAT_MAX_TEMP_C: 38,
  /** Maximum temperature in Celsius under which high wind triggers COLD_WIND */
  COLD_MAX_TEMP_C: 10,
  /** Wind speed in km/h to classify as cold wind or adverse conditions */
  HIGH_WIND_SPEED_KMH: 35,
  /** Maximum reliable forecast horizon from Open-Meteo in days */
  MAX_FORECAST_HORIZON_DAYS: 16,
} as const;

/**
 * Audit and machine rule identifiers for weather filtering
 */
export const WEATHER_RULE_IDS = {
  WX_RAIN_OUTDOOR: 'WX_RAIN_OUTDOOR',
  WX_STORM_OUTDOOR: 'WX_STORM_OUTDOOR',
  WX_HEAT_MIDDAY_INTENSE: 'WX_HEAT_MIDDAY_INTENSE',
  WX_COLD_WIND_INDOOR: 'WX_COLD_WIND_INDOOR',
  WX_ESTIMATED_NOTICE: 'WX_ESTIMATED_NOTICE',
} as const;
