import { DayForecast, Destination } from '../types/engine';
import {
  addDaysToDate,
  getDaysDifference,
  shiftYear,
} from '../engine/timezone';

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

interface OpenMeteoDailyData {
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  wind_speed_10m_max?: number[];
  precipitation_sum?: number[];
}

export class WeatherProvider {
  private cache = new Map<string, WeatherCacheEntry>();

  /**
   * Geocodes a destination city query into a normalized Destination object.
   * Preserves destination IANA timezone and administrative disambiguation context.
   */
  async geocodeCity(
    cityQuery: string,
    context?: { admin1?: string; country?: string; countryCode?: string }
  ): Promise<Destination | null> {
    const cleaned = cityQuery.trim();
    if (!cleaned) return null;

    // If query has comma (e.g. "Manali, Himachal Pradesh"), try full query first
    const queriesToTry = [cleaned];
    if (cleaned.includes(',')) {
      const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts[0] && parts[0] !== cleaned) {
        queriesToTry.push(parts[0]);
      }
    } else if (context?.admin1) {
      queriesToTry.unshift(`${cleaned}, ${context.admin1}`);
    }

    interface RawGeocodingItem {
      id: number;
      name: string;
      country?: string;
      country_code?: string;
      admin1?: string;
      latitude: number;
      longitude: number;
      timezone?: string;
    }

    let allResults: RawGeocodingItem[] = [];

    for (const q of queriesToTry) {
      const url = `${GEOCODING_API_URL}?name=${encodeURIComponent(q)}&count=10&language=en&format=json`;
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;
        const data = (await res.json()) as { results?: RawGeocodingItem[] };
        if (data.results && data.results.length > 0) {
          allResults = data.results;
          break;
        }
      } catch {
        // continue to next query candidate
      }
    }

    if (allResults.length === 0) {
      return null;
    }

    let matched = allResults[0];

    if (context?.admin1) {
      const targetAdmin = context.admin1.toLowerCase().trim();
      const adminMatch = allResults.find(
        (r) => r.admin1 && r.admin1.toLowerCase().trim() === targetAdmin
      );
      if (adminMatch) matched = adminMatch;
    } else if (context?.countryCode) {
      const targetCode = context.countryCode.toUpperCase().trim();
      const codeMatch = allResults.find(
        (r) => r.country_code && r.country_code.toUpperCase().trim() === targetCode
      );
      if (codeMatch) matched = codeMatch;
    } else if (context?.country) {
      const targetCountry = context.country.toLowerCase().trim();
      const countryMatch = allResults.find(
        (r) => r.country && r.country.toLowerCase().trim() === targetCountry
      );
      if (countryMatch) matched = countryMatch;
    }

    return {
      id: `openmeteo:${matched.id}`,
      city: matched.name,
      country: matched.country || '',
      countryCode: matched.country_code || '',
      admin1: matched.admin1 || '',
      latitude: matched.latitude,
      longitude: matched.longitude,
      timezone: matched.timezone || 'UTC',
    };
  }

  /**
   * Searches for matching cities matching the query with debouncing/capping.
   * Includes destination IANA timezone.
   * Restricts results to India ('IN') by default per Tripcraft destination product rule.
   */
  async searchCities(query: string, count = 6, countryCode: string | null = 'IN'): Promise<Destination[]> {
    const cleaned = query.trim();
    if (cleaned.length < 2) return [];

    const url = `${GEOCODING_API_URL}?name=${encodeURIComponent(cleaned)}&count=20&language=en&format=json`;
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
      timezone?: string;
    }

    const data = (await res.json()) as { results?: RawGeocodingItem[] };
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    let filtered = data.results;
    if (countryCode) {
      const target = countryCode.toUpperCase().trim();
      filtered = data.results.filter(
        (r) => r.country_code && r.country_code.toUpperCase().trim() === target
      );
    }

    return filtered.slice(0, count).map((r) => ({
      id: `openmeteo:${r.id}`,
      city: r.name,
      country: r.country || '',
      countryCode: r.country_code || '',
      admin1: r.admin1 || '',
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone || 'UTC',
    }));
  }

  /**
   * Fetches weather forecast data for a destination and trip duration.
   * Stage 3 Implementation:
   * - Evaluates the 16-day forecast horizon PER DAY rather than failing the trip or treating as uniform.
   * - Days <= 16 days from destination-local today receive real forecast (high/medium confidence).
   * - Days > 16 days receive destination historical climate estimates (low confidence).
   * - If archive is unreachable, applies conservative, qualified low-confidence fallback (no fake clear sky).
   */
  async fetchForecast(params: {
    latitude: number;
    longitude: number;
    startDate: string;
    days: number;
    timezone?: string;
  }): Promise<DayForecast[]> {
    const { latitude, longitude, startDate, days, timezone } = params;
    const tzKey = timezone || 'auto';
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}:${tzKey}:${startDate}:${days}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // 1. Identify per-day horizon status
    const dayDates: string[] = [];
    const dayIsForecast: boolean[] = [];

    for (let i = 0; i < days; i++) {
      const dateStr = addDaysToDate(startDate, i);
      dayDates.push(dateStr);
      const diff = getDaysDifference(dateStr, timezone);
      dayIsForecast.push(diff >= 0 && diff <= MAX_FORECAST_HORIZON_DAYS);
    }

    // 2. Partition into contiguous execution segments
    interface DaySegment {
      isForecast: boolean;
      startIndex: number;
      count: number;
      startDate: string;
      endDate: string;
    }

    const segments: DaySegment[] = [];
    let currentSegment: DaySegment | null = null;

    for (let i = 0; i < days; i++) {
      const isFc = dayIsForecast[i];
      if (!currentSegment || currentSegment.isForecast !== isFc) {
        currentSegment = {
          isForecast: isFc,
          startIndex: i,
          count: 1,
          startDate: dayDates[i],
          endDate: dayDates[i],
        };
        segments.push(currentSegment);
      } else {
        currentSegment.count++;
        currentSegment.endDate = dayDates[i];
      }
    }

    // 3. Resolve each segment independently
    const finalForecasts: DayForecast[] = new Array(days);

    for (const seg of segments) {
      if (seg.isForecast) {
        let segData: DayForecast[] | null = null;
        try {
          segData = await this.fetchLiveForecastSegment({
            latitude,
            longitude,
            startDate: seg.startDate,
            endDate: seg.endDate,
            count: seg.count,
            timezone,
          });
        } catch {
          // If live forecast fails, fall back to historical archive for this segment
          try {
            segData = await this.fetchArchiveSegment({
              latitude,
              longitude,
              startDate: seg.startDate,
              endDate: seg.endDate,
              count: seg.count,
              timezone,
            });
          } catch {
            segData = this.generateQualifiedFallbackForecast(
              dayDates.slice(seg.startIndex, seg.startIndex + seg.count)
            );
          }
        }

        for (let j = 0; j < seg.count; j++) {
          finalForecasts[seg.startIndex + j] = segData[j];
        }
      } else {
        // Beyond forecast horizon -> historical climate archive
        let segData: DayForecast[] | null = null;
        try {
          segData = await this.fetchArchiveSegment({
            latitude,
            longitude,
            startDate: seg.startDate,
            endDate: seg.endDate,
            count: seg.count,
            timezone,
          });
        } catch {
          segData = this.generateQualifiedFallbackForecast(
            dayDates.slice(seg.startIndex, seg.startIndex + seg.count)
          );
        }

        for (let j = 0; j < seg.count; j++) {
          finalForecasts[seg.startIndex + j] = segData[j];
        }
      }
    }

    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      data: finalForecasts,
    });

    return finalForecasts;
  }

  /**
   * Fetches live daily forecast for a slice within the 16-day horizon.
   */
  private async fetchLiveForecastSegment(params: {
    latitude: number;
    longitude: number;
    startDate: string;
    endDate: string;
    count: number;
    timezone?: string;
  }): Promise<DayForecast[]> {
    const { latitude, longitude, startDate, endDate, count, timezone } = params;
    const tzParam = timezone ? encodeURIComponent(timezone) : 'auto';
    const url = `${FORECAST_API_URL}?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum&timezone=${tzParam}&start_date=${startDate}&end_date=${endDate}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Live forecast request failed with HTTP ${res.status}`);
    const data = await res.json();
    return this.parseOpenMeteoDaily(data.daily, startDate, count, {
      estimated: false,
      source: 'forecast',
      timezone,
    });
  }

  /**
   * Queries historical archive for exact calendar dates 1 year prior.
   */
  private async fetchArchiveSegment(params: {
    latitude: number;
    longitude: number;
    startDate: string;
    endDate: string;
    count: number;
    timezone?: string;
  }): Promise<DayForecast[]> {
    const { latitude, longitude, startDate, endDate, count, timezone } = params;
    const prevYearStart = shiftYear(startDate, -1);
    const prevYearEnd = shiftYear(endDate, -1);
    const tzParam = timezone ? encodeURIComponent(timezone) : 'auto';

    const url = `${ARCHIVE_API_URL}?latitude=${latitude}&longitude=${longitude}&start_date=${prevYearStart}&end_date=${prevYearEnd}&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum&timezone=${tzParam}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Archive request failed with HTTP ${res.status}`);
    const data = await res.json();
    return this.parseOpenMeteoDaily(data.daily, startDate, count, {
      estimated: true,
      source: 'historical_estimate',
      timezone,
    });
  }

  /**
   * Parses Open-Meteo daily response array into normalized DayForecast[].
   * Maps indices directly to target dates to guarantee exact alignment.
   */
  private parseOpenMeteoDaily(
    daily: OpenMeteoDailyData | null | undefined,
    targetStartDate: string,
    count: number,
    options: {
      estimated: boolean;
      source: 'forecast' | 'historical_estimate';
      timezone?: string;
    }
  ): DayForecast[] {
    if (!daily || !Array.isArray(daily.time)) {
      return this.generateQualifiedFallbackForecast(
        Array.from({ length: count }, (_, i) => addDaysToDate(targetStartDate, i))
      );
    }

    const results: DayForecast[] = [];

    for (let idx = 0; idx < count; idx++) {
      const dateStr = addDaysToDate(targetStartDate, idx);
      const diff = getDaysDifference(dateStr, options.timezone);

      // Distinguish near-term vs medium-term forecast confidence
      const confidence: 'high' | 'medium' | 'low' = options.estimated
        ? 'low'
        : diff <= 7
        ? 'high'
        : 'medium';

      results.push({
        date: dateStr,
        weatherCode: daily.weather_code?.[idx] ?? 3,
        maxTemp: Number((daily.temperature_2m_max?.[idx] ?? 22).toFixed(1)),
        minTemp: Number((daily.temperature_2m_min?.[idx] ?? 14).toFixed(1)),
        windSpeed: Number((daily.wind_speed_10m_max?.[idx] ?? 12).toFixed(1)),
        precipitationMm: Number((daily.precipitation_sum?.[idx] ?? 0).toFixed(1)),
        estimated: options.estimated,
        temporalResolution: 'daily',
        source: options.source,
        confidence,
      });
    }

    return results;
  }

  /**
   * Safe, qualified low-confidence fallback baseline when both forecast
   * and historical archive feeds are unavailable.
   * Strictly avoids false certainty (does NOT classify unknown weather as confirmed clear/sunny).
   */
  private generateQualifiedFallbackForecast(dates: string[]): DayForecast[] {
    return dates.map((dateStr) => ({
      date: dateStr,
      weatherCode: 3, // Overcast / unconfirmed
      maxTemp: 22,
      minTemp: 14,
      windSpeed: 15,
      precipitationMm: 1.0,
      estimated: true,
      temporalResolution: 'daily',
      source: 'fallback_estimate',
      confidence: 'low',
    }));
  }
}
