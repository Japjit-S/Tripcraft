import { DayForecast, Destination } from '../types/engine';

const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_API_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_API_URL = 'https://archive-api.open-meteo.com/v1/archive';

const USER_AGENT = 'Tripcraft/1.0 (travel-planner-app)';
const MAX_FORECAST_HORIZON_DAYS = 16;
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

interface WeatherCacheEntry {
  timestamp: number;
  data: DayForecast[];
}

/**
 * Shifts an ISO date (YYYY-MM-DD) by a given number of years.
 */
function shiftYear(dateStr: string, yearDelta: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const shiftedYear = year + yearDelta;
  return `${shiftedYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Calculates end date string from start date and number of days.
 */
function calculateEndDate(startDateStr: string, days: number): string {
  const [year, month, day] = startDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + (days - 1));
  return date.toISOString().slice(0, 10);
}

/**
 * Calculates day difference between target date and current UTC date.
 */
function getDaysFromToday(targetDateStr: string): number {
  const [year, month, day] = targetDateStr.split('-').map(Number);
  const target = Date.UTC(year, month - 1, day);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

export class WeatherProvider {
  private cache = new Map<string, WeatherCacheEntry>();

  /**
   * Geocodes a destination city query into a normalized Destination object.
   */
  async geocodeCity(cityQuery: string): Promise<Destination | null> {
    const cleaned = cityQuery.trim();
    if (!cleaned) return null;

    const url = `${GEOCODING_API_URL}?name=${encodeURIComponent(cleaned)}&count=5&language=en&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo geocoding failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      return null;
    }

    const first = data.results[0];
    return {
      id: `openmeteo:${first.id}`,
      city: first.name,
      country: first.country || '',
      countryCode: first.country_code || '',
      admin1: first.admin1 || '',
      latitude: first.latitude,
      longitude: first.longitude,
    };
  }

  /**
   * Searches for matching cities matching the query with debouncing/capping.
   */
  async searchCities(query: string, count = 6): Promise<Destination[]> {
    const cleaned = query.trim();
    if (cleaned.length < 2) return [];

    const url = `${GEOCODING_API_URL}?name=${encodeURIComponent(cleaned)}&count=${Math.min(count, 10)}&language=en&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo geocoding search failed with HTTP ${res.status}`);
    }

    interface RawGeocodingItem {
      id: number;
      name: string;
      country?: string;
      country_code?: string;
      admin1?: string;
      latitude: number;
      longitude: number;
    }

    const data = (await res.json()) as { results?: RawGeocodingItem[] };
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((r) => ({
      id: `openmeteo:${r.id}`,
      city: r.name,
      country: r.country || '',
      countryCode: r.country_code || '',
      admin1: r.admin1 || '',
      latitude: r.latitude,
      longitude: r.longitude,
    }));
  }

  /**
   * Fetches weather forecast data for a destination and trip duration.
   * Gracefully handles the 16-day forecast horizon hole by falling back
   * to Open-Meteo's historical climate archive with estimated: true.
   */
  async fetchForecast(params: {
    latitude: number;
    longitude: number;
    startDate: string;
    days: number;
  }): Promise<DayForecast[]> {
    const { latitude, longitude, startDate, days } = params;
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}:${startDate}:${days}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const daysFromNow = getDaysFromToday(startDate);
    const endDate = calculateEndDate(startDate, days);
    let forecasts: DayForecast[] = [];

    // Check if start date exceeds Open-Meteo 16-day forecast horizon
    const isBeyondHorizon = daysFromNow > MAX_FORECAST_HORIZON_DAYS || daysFromNow < 0;

    if (isBeyondHorizon) {
      // Historical climate archive fallback
      forecasts = await this.fetchArchiveEstimate({
        latitude,
        longitude,
        startDate,
        endDate,
        days,
      });
    } else {
      try {
        const url = `${FORECAST_API_URL}?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum&timezone=auto&start_date=${startDate}&end_date=${endDate}`;
        const res = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT },
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        forecasts = this.parseOpenMeteoDaily(data.daily, startDate, false);
      } catch {
        // Fallback to archive estimate on error
        forecasts = await this.fetchArchiveEstimate({
          latitude,
          longitude,
          startDate,
          endDate,
          days,
        });
      }
    }

    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      data: forecasts,
    });

    return forecasts;
  }

  /**
   * Queries historical archive for exact calendar dates 1 year prior.
   */
  private async fetchArchiveEstimate(params: {
    latitude: number;
    longitude: number;
    startDate: string;
    endDate: string;
    days: number;
  }): Promise<DayForecast[]> {
    const { latitude, longitude, startDate, endDate } = params;
    const prevYearStart = shiftYear(startDate, -1);
    const prevYearEnd = shiftYear(endDate, -1);

    const url = `${ARCHIVE_API_URL}?latitude=${latitude}&longitude=${longitude}&start_date=${prevYearStart}&end_date=${prevYearEnd}&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum&timezone=auto`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return this.parseOpenMeteoDaily(data.daily, startDate, true);
    } catch {
      // Safe fallback seasonal estimate if network archive fails
      return this.generateDefaultSeasonalForecast(startDate, params.days);
    }
  }

  /**
   * Parses Open-Meteo daily response array into normalized DayForecast[]
   */
  private parseOpenMeteoDaily(
    daily: any,
    targetStartDate: string,
    estimated: boolean
  ): DayForecast[] {
    if (!daily || !Array.isArray(daily.time)) {
      return [];
    }

    const [year, month, day] = targetStartDate.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day));

    return daily.time.map((_: string, idx: number) => {
      const targetDate = new Date(baseDate.getTime() + idx * 86400000);
      const dateStr = targetDate.toISOString().slice(0, 10);

      return {
        date: dateStr,
        weatherCode: daily.weather_code?.[idx] ?? 0,
        maxTemp: Number((daily.temperature_2m_max?.[idx] ?? 28).toFixed(1)),
        minTemp: Number((daily.temperature_2m_min?.[idx] ?? 18).toFixed(1)),
        windSpeed: Number((daily.wind_speed_10m_max?.[idx] ?? 12).toFixed(1)),
        precipitationMm: Number((daily.precipitation_sum?.[idx] ?? 0).toFixed(1)),
        estimated,
      };
    });
  }

  /**
   * Safe fallback seasonal baseline
   */
  private generateDefaultSeasonalForecast(startDate: string, days: number): DayForecast[] {
    const [year, month, day] = startDate.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day));
    const results: DayForecast[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(baseDate.getTime() + i * 86400000);
      results.push({
        date: d.toISOString().slice(0, 10),
        weatherCode: 0,
        maxTemp: 28,
        minTemp: 18,
        windSpeed: 10,
        precipitationMm: 0,
        estimated: true,
      });
    }

    return results;
  }
}
