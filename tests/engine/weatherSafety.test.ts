import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateItinerary } from '../../src/lib/engine';
import { classifyDay } from '../../src/lib/engine/classifyDay';
import { applyHardFiltersForDay } from '../../src/lib/engine/hardFilters';
import {
  addDaysToDate,
  formatDestinationDate,
  getDaysDifference,
  isValidIanaTimezone,
  shiftYear,
} from '../../src/lib/engine/timezone';
import { WeatherProvider } from '../../src/lib/providers/weatherProvider';
import { CandidateActivity, DayForecast, Destination } from '../../src/lib/types/engine';
import { WEATHER_RULE_IDS } from '../../src/lib/constants/weatherThresholds';
import { mockDestination, mockCandidates } from './fixtures';

describe('Weather, Uncertainty & Destination-Local Safety Core (Stage 3)', () => {
  // ==========================================
  // 1. Timezone Integrity, DST and Date Arithmetic
  // ==========================================
  it('Validates IANA timezones and handles invalid/malformed identifiers gracefully', () => {
    assert.equal(isValidIanaTimezone('Asia/Kolkata'), true);
    assert.equal(isValidIanaTimezone('America/New_York'), true);
    assert.equal(isValidIanaTimezone('Europe/Paris'), true);
    assert.equal(isValidIanaTimezone('Pacific/Auckland'), true);
    assert.equal(isValidIanaTimezone('UTC'), true);

    assert.equal(isValidIanaTimezone(''), false);
    assert.equal(isValidIanaTimezone('Mars/Olympus'), false);
    assert.equal(isValidIanaTimezone('Invalid/Timezone'), false);
    assert.equal(isValidIanaTimezone(undefined), false);
  });

  it('addDaysToDate performs deterministic calendar addition immune to DST transitions', () => {
    // Standard addition
    assert.equal(addDaysToDate('2026-10-02', 1), '2026-10-03');
    assert.equal(addDaysToDate('2026-10-02', 5), '2026-10-07');

    // Month boundary roll-over (non-leap year February)
    assert.equal(addDaysToDate('2026-02-28', 1), '2026-03-01');

    // Leap year February roll-over
    assert.equal(addDaysToDate('2028-02-28', 1), '2028-02-29');
    assert.equal(addDaysToDate('2028-02-28', 2), '2028-03-01');

    // Year boundary roll-over
    assert.equal(addDaysToDate('2026-12-31', 1), '2027-01-01');
  });

  it('shiftYear handles calendar year offsets and leap day Feb 29 safely', () => {
    assert.equal(shiftYear('2026-10-02', -1), '2025-10-02');
    assert.equal(shiftYear('2026-01-01', -1), '2025-01-01');

    // 2028 is a leap year; shifting 2028-02-29 by -1 must safely produce 2027-02-28
    assert.equal(shiftYear('2028-02-29', -1), '2027-02-28');
  });

  it('formatDestinationDate formats dates without browser local timezone drift', () => {
    const testDate = '2026-10-02';

    // Regardless of destination timezone (Tokyo UTC+9, London UTC+0, Los Angeles UTC-7),
    // Oct 2 must format as Oct 2 and never shift back to Oct 1
    const tokyoFormatted = formatDestinationDate(testDate, { month: 'short', day: 'numeric', year: 'numeric' }, 'Asia/Tokyo');
    assert.match(tokyoFormatted, /Oct 2, 2026/);

    const laFormatted = formatDestinationDate(testDate, { month: 'short', day: 'numeric', year: 'numeric' }, 'America/Los_Angeles');
    assert.match(laFormatted, /Oct 2, 2026/);

    const utcFormatted = formatDestinationDate(testDate, { month: 'short', day: 'numeric', year: 'numeric' }, 'UTC');
    assert.match(utcFormatted, /Oct 2, 2026/);

    // Weekday check
    const weekdayFormatted = formatDestinationDate(testDate, { weekday: 'long', month: 'short', day: 'numeric' }, 'Asia/Kolkata');
    assert.match(weekdayFormatted, /Friday, Oct 2/);
  });

  it('getDaysDifference evaluates whole days relative to destination-local today', () => {
    const refDate = new Date('2026-10-02T12:00:00Z');
    assert.equal(getDaysDifference('2026-10-02', 'UTC', refDate), 0);
    assert.equal(getDaysDifference('2026-10-05', 'UTC', refDate), 3);
    assert.equal(getDaysDifference('2026-10-18', 'UTC', refDate), 16);
    assert.equal(getDaysDifference('2026-10-25', 'UTC', refDate), 23);
    assert.equal(getDaysDifference('2026-09-30', 'UTC', refDate), -2);
  });

  // ==========================================
  // 2. Weather Classification, Uncertainty & Temporal Resolution
  // ==========================================
  it('classifyDay honestly labels daily temporal resolution and avoids false hourly precision claims', () => {
    const dailyForecast: DayForecast = {
      date: '2026-10-02',
      weatherCode: 0,
      maxTemp: 28,
      minTemp: 18,
      windSpeed: 10,
      precipitationMm: 0,
      temporalResolution: 'daily',
      source: 'forecast',
      confidence: 'high',
    };

    const classification = classifyDay(1, dailyForecast);
    assert.equal(classification.state, 'CLEAR');
    assert.equal(classification.temporalResolution, 'daily');
    assert.equal(classification.confidence, 'high');

    const resolutionAudit = classification.auditEntries.find(
      (a) => a.ruleId === WEATHER_RULE_IDS.WX_TEMPORAL_RESOLUTION_DAILY
    );
    assert.ok(resolutionAudit, 'Expected WX_TEMPORAL_RESOLUTION_DAILY audit entry');
    assert.match(resolutionAudit.reason, /Weather temporal resolution is daily/);
  });

  it('classifyDay tags historical estimates with low confidence and WX_ESTIMATED_NOTICE', () => {
    const historicalForecast: DayForecast = {
      date: '2026-11-20',
      weatherCode: 1,
      maxTemp: 24,
      minTemp: 14,
      windSpeed: 12,
      precipitationMm: 0,
      estimated: true,
      source: 'historical_estimate',
      confidence: 'low',
    };

    const classification = classifyDay(1, historicalForecast);
    assert.equal(classification.isEstimated, true);
    assert.equal(classification.source, 'historical_estimate');
    assert.equal(classification.confidence, 'low');
    assert.match(classification.summary, /Historical climate estimate/);

    const estimateAudit = classification.auditEntries.find(
      (a) => a.ruleId === WEATHER_RULE_IDS.WX_ESTIMATED_NOTICE
    );
    assert.ok(estimateAudit, 'Expected WX_ESTIMATED_NOTICE audit entry');
  });

  it('Fallback estimate strictly avoids false certainty and does NOT assume clear skies', () => {
    const fallbackForecast: DayForecast = {
      date: '2026-10-02',
      weatherCode: 0, // Even if raw code is 0 in fallback
      maxTemp: 22,
      minTemp: 14,
      windSpeed: 15,
      precipitationMm: 1.0,
      estimated: true,
      source: 'fallback_estimate',
      confidence: 'low',
    };

    const classification = classifyDay(1, fallbackForecast);
    // Crucial requirement: unknown fallback weather must NOT classify as confirmed CLEAR!
    assert.notEqual(classification.state, 'CLEAR');
    assert.equal(classification.state, 'MIXED');
    assert.equal(classification.confidence, 'low');
    assert.match(classification.summary, /Unconfirmed fallback/);

    const fallbackAudit = classification.auditEntries.find(
      (a) => a.ruleId === WEATHER_RULE_IDS.WX_LOW_CONFIDENCE_WARNING
    );
    assert.ok(fallbackAudit, 'Expected WX_LOW_CONFIDENCE_WARNING audit entry');
  });

  // ==========================================
  // 3. Meteorological Exposure & Safety Hard Filters
  // ==========================================
  it('Classifies severe storms from WMO codes, heavy precipitation (>=25mm), and gale winds (>=60km/h)', () => {
    // 1. WMO Storm code 95
    const codeStorm = classifyDay(1, {
      date: '2026-10-02',
      weatherCode: 95,
      maxTemp: 24,
      minTemp: 18,
      windSpeed: 20,
    });
    assert.equal(codeStorm.state, 'STORM');

    // 2. Heavy precipitation >= 25mm even if WMO code is mixed
    const precipStorm = classifyDay(1, {
      date: '2026-10-02',
      weatherCode: 3,
      maxTemp: 22,
      minTemp: 16,
      windSpeed: 25,
      precipitationMm: 35.0,
    });
    assert.equal(precipStorm.state, 'STORM');

    // 3. Gale wind >= 60 km/h
    const galeStorm = classifyDay(1, {
      date: '2026-10-02',
      weatherCode: 2,
      maxTemp: 20,
      minTemp: 15,
      windSpeed: 65,
    });
    assert.equal(galeStorm.state, 'STORM');
  });

  it('applyHardFiltersForDay eliminates outdoor activities during STORM and COLD_WIND', () => {
    const outdoorActivity: CandidateActivity = {
      id: 'osm:outdoor-garden',
      title: 'Botanical Open Garden',
      category: 'NATURE',
      indoor: false,
      intensity: 'HIGH',
      typicalDurationMin: 90,
      slotAffinity: ['MORNING', 'AFTERNOON'],
      prominence: 0.8,
      coords: { lat: 26.9, lon: 75.8 },
      tags: ['garden', 'nature'],
    };

    const indoorMuseum: CandidateActivity = {
      id: 'osm:indoor-museum',
      title: 'City Heritage Museum',
      category: 'CULTURE',
      indoor: true,
      intensity: 'LOW',
      typicalDurationMin: 90,
      slotAffinity: ['MORNING', 'AFTERNOON'],
      prominence: 0.9,
      coords: { lat: 26.91, lon: 75.81 },
      tags: ['museum', 'indoor', 'art'],
    };

    // Storm Filter
    const stormResult = applyHardFiltersForDay({
      dayNumber: 1,
      dateStr: '2026-10-02',
      weatherState: 'STORM',
      candidates: [outdoorActivity, indoorMuseum],
    });
    assert.equal(stormResult.survivors.length, 1);
    assert.equal(stormResult.survivors[0].id, indoorMuseum.id);
    assert.ok(stormResult.auditEntries.some((a) => a.ruleId === WEATHER_RULE_IDS.WX_STORM_OUTDOOR));

    // Cold & High Wind Filter
    const coldWindResult = applyHardFiltersForDay({
      dayNumber: 1,
      dateStr: '2026-10-02',
      weatherState: 'COLD_WIND',
      candidates: [outdoorActivity, indoorMuseum],
    });
    assert.equal(coldWindResult.survivors.length, 1);
    assert.equal(coldWindResult.survivors[0].id, indoorMuseum.id);
    assert.ok(coldWindResult.auditEntries.some((a) => a.ruleId === WEATHER_RULE_IDS.WX_COLD_WIND_INDOOR));
  });

  it('Extreme heat cancels multi-slot outdoor high-intensity excursions spanning peak heat', () => {
    const longOutdoorTrek: CandidateActivity = {
      id: 'pack:long-hike',
      title: 'Nahargarh Ridge Trail',
      category: 'NATURE',
      indoor: false,
      intensity: 'HIGH',
      typicalDurationMin: 270, // 4.5 hours
      slotAffinity: ['MORNING', 'AFTERNOON'],
      prominence: 0.85,
      coords: { lat: 26.93, lon: 75.82 },
      tags: ['trek', 'nature'],
    };

    const heatResult = applyHardFiltersForDay({
      dayNumber: 1,
      dateStr: '2026-10-02',
      weatherState: 'EXTREME_HEAT',
      candidates: [longOutdoorTrek],
    });

    assert.equal(heatResult.survivors.length, 0);
    const heatAudit = heatResult.auditEntries.find(
      (a) => a.ruleId === WEATHER_RULE_IDS.MULTI_SLOT_HEAT_SAFETY_BLOCK
    );
    assert.ok(heatAudit, 'Expected MULTI_SLOT_HEAT_SAFETY_BLOCK entry');
  });

  // ==========================================
  // 4. Multi-Day Excursion Weather Hazard Safety
  // ==========================================
  it('Multi-day outdoor expedition linking is cancelled when Day 2 weather turns hazardous (STORM)', () => {
    const multiDayTrekCandidate: CandidateActivity = {
      id: 'pack:himalayan-ascent',
      title: 'Rohtang Mountain Traverse',
      category: 'NATURE',
      indoor: false,
      intensity: 'HIGH',
      typicalDurationMin: 420,
      slotAffinity: ['MORNING', 'AFTERNOON'],
      prominence: 0.95,
      coords: { lat: 32.24, lon: 77.18 },
      tags: ['trek', 'expedition', 'mountain'],
    };

    const indoorPalace: CandidateActivity = {
      id: 'osm:naggar-castle',
      title: 'Naggar Historic Castle',
      category: 'LANDMARK',
      indoor: true,
      intensity: 'LOW',
      typicalDurationMin: 120,
      slotAffinity: ['MORNING', 'AFTERNOON'],
      prominence: 0.88,
      coords: { lat: 32.14, lon: 77.16 },
      tags: ['castle', 'historic', 'indoor'],
    };

    // Day 1: Clear. Day 2: Severe Storm!
    const destination: Destination = {
      id: 'dest:manali',
      city: 'Manali',
      country: 'India',
      latitude: 32.24,
      longitude: 77.18,
      timezone: 'Asia/Kolkata',
    };

    const weatherForecast: DayForecast[] = [
      {
        date: '2026-10-02',
        weatherCode: 0,
        maxTemp: 20,
        minTemp: 10,
        windSpeed: 10,
        precipitationMm: 0,
        temporalResolution: 'daily',
        source: 'forecast',
        confidence: 'high',
      },
      {
        date: '2026-10-03',
        weatherCode: 95, // Thunderstorm!
        maxTemp: 12,
        minTemp: 6,
        windSpeed: 45,
        precipitationMm: 30,
        temporalResolution: 'daily',
        source: 'forecast',
        confidence: 'high',
      },
    ];

    const output = generateItinerary({
      destination,
      startDate: '2026-10-02',
      days: 2,
      persona: 'Backpacker',
      weatherForecast,
      candidates: [multiDayTrekCandidate, indoorPalace, ...mockCandidates],
    });

    assert.equal(output.success, true);

    // Multi-day expedition linking MUST NOT have scheduled the outdoor trek across Day 1 and 2!
    const day2Timeline = output.itineraryDays[1].timeline || [];
    const trekOnDay2 = day2Timeline.find((i) => i.candidateId === multiDayTrekCandidate.id);

    // Day 2 was a storm; neither day should have linked a hazardous multi-day expedition into the storm!
    assert.equal(trekOnDay2, undefined, 'Outdoor trek must NOT be scheduled on Day 2 during a storm');

    const hazardAudit = output.auditLog.find(
      (a) => a.ruleId === WEATHER_RULE_IDS.MULTI_DAY_WEATHER_HAZARD
    );
    assert.ok(hazardAudit, 'Expected MULTI_DAY_WEATHER_HAZARD audit entry');
    assert.match(hazardAudit.reason, /creates hazardous conditions for outdoor continuation/);
  });

  // ==========================================
  // 5. Trips Straddling the 16-Day Forecast Horizon
  // ==========================================
  it('Handles trips straddling the 16-day horizon per day: distinguishes forecast from historical estimate', () => {
    const straddlingForecast: DayForecast[] = [
      {
        date: '2026-10-15', // Day 1: 14 days out (live forecast)
        weatherCode: 0,
        maxTemp: 28,
        minTemp: 18,
        windSpeed: 10,
        temporalResolution: 'daily',
        source: 'forecast',
        confidence: 'high',
        estimated: false,
      },
      {
        date: '2026-10-16', // Day 2: 15 days out (live forecast)
        weatherCode: 1,
        maxTemp: 27,
        minTemp: 17,
        windSpeed: 12,
        temporalResolution: 'daily',
        source: 'forecast',
        confidence: 'medium',
        estimated: false,
      },
      {
        date: '2026-10-17', // Day 3: 16 days out (live forecast)
        weatherCode: 2,
        maxTemp: 26,
        minTemp: 16,
        windSpeed: 14,
        temporalResolution: 'daily',
        source: 'forecast',
        confidence: 'medium',
        estimated: false,
      },
      {
        date: '2026-10-18', // Day 4: 17 days out (exceeds 16-day horizon -> historical estimate!)
        weatherCode: 0,
        maxTemp: 26,
        minTemp: 15,
        windSpeed: 10,
        temporalResolution: 'daily',
        source: 'historical_estimate',
        confidence: 'low',
        estimated: true,
      },
    ];

    const output = generateItinerary({
      destination: {
        ...mockDestination,
        timezone: 'Asia/Kolkata',
      },
      startDate: '2026-10-15',
      days: 4,
      persona: 'Culture Seeker',
      weatherForecast: straddlingForecast,
      candidates: mockCandidates,
    });

    assert.equal(output.success, true);
    assert.equal(output.itineraryDays.length, 4);

    // Days 1, 2, 3 must be tagged as forecast (non-estimated)
    assert.equal(output.itineraryDays[0].isEstimatedWeather, false);
    assert.equal(output.itineraryDays[0].weatherSource, 'forecast');
    assert.equal(output.itineraryDays[0].weatherConfidence, 'high');

    assert.equal(output.itineraryDays[1].isEstimatedWeather, false);
    assert.equal(output.itineraryDays[1].weatherSource, 'forecast');

    assert.equal(output.itineraryDays[2].isEstimatedWeather, false);
    assert.equal(output.itineraryDays[2].weatherSource, 'forecast');

    // Day 4 must be tagged as historical estimate
    assert.equal(output.itineraryDays[3].isEstimatedWeather, true);
    assert.equal(output.itineraryDays[3].weatherSource, 'historical_estimate');
    assert.equal(output.itineraryDays[3].weatherConfidence, 'low');
    assert.match(output.itineraryDays[3].weatherSummary, /Historical climate estimate/);

    // Audit log must contain WX_ESTIMATED_NOTICE for Day 4 specifically
    const day4Audit = output.auditLog.find(
      (a) => a.dayNumber === 4 && a.ruleId === WEATHER_RULE_IDS.WX_ESTIMATED_NOTICE
    );
    assert.ok(day4Audit, 'Expected WX_ESTIMATED_NOTICE on Day 4');

    // Days 1-3 must NOT have WX_ESTIMATED_NOTICE
    const day1Audit = output.auditLog.find(
      (a) => a.dayNumber === 1 && a.ruleId === WEATHER_RULE_IDS.WX_ESTIMATED_NOTICE
    );
    assert.equal(day1Audit, undefined, 'Day 1 must not have WX_ESTIMATED_NOTICE');
  });

  // ==========================================
  // 6. WeatherProvider IANA Timezone Resolution & Resilience
  // ==========================================
  it('WeatherProvider geocoding extracts and retains destination IANA timezone', async () => {
    const provider = new WeatherProvider();
    const dest = await provider.geocodeCity('Tokyo', { country: 'Japan' });
    assert.ok(dest);
    assert.equal(dest.city, 'Tokyo');
    assert.equal(dest.timezone, 'Asia/Tokyo');
  });
});
