/**
 * Destination-local timezone and date handling utilities.
 * Ensures zero browser-local timezone drift for trip dates, calendar displays,
 * and forecast horizon calculations.
 */

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

/**
 * Validates whether a timezone identifier is a supported IANA timezone.
 */
export function isValidIanaTimezone(tz?: string): boolean {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Parses YYYY-MM-DD into numeric year, month, day components.
 */
export function parseDateParts(dateStr: string): DateParts {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10),
    day: parseInt(dayStr, 10),
  };
}

/**
 * Pure calendar day addition for YYYY-MM-DD strings.
 * Immune to DST transitions and browser local timezone shifts.
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const { year, month, day } = parseDateParts(dateStr);
  const utcDate = new Date(Date.UTC(year, month - 1, day + days));
  return utcDate.toISOString().slice(0, 10);
}

/**
 * Shifts year for historical climate archive comparison.
 * Handles leap years safely (e.g. Feb 29 shifts to Feb 28 on non-leap years).
 */
export function shiftYear(dateStr: string, yearDelta: number): string {
  const { year, month, day } = parseDateParts(dateStr);
  const targetYear = year + yearDelta;
  if (month === 2 && day === 29) {
    const isLeap =
      (targetYear % 4 === 0 && targetYear % 100 !== 0) || targetYear % 400 === 0;
    if (!isLeap) {
      return `${targetYear}-02-28`;
    }
  }
  return `${targetYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Returns today's calendar date (YYYY-MM-DD) in the specified destination IANA timezone.
 * Falls back to UTC if timezone is invalid or undefined.
 */
export function getTodayInTimezone(
  timezone?: string,
  referenceDate: Date = new Date()
): string {
  const validTz = isValidIanaTimezone(timezone) ? timezone : 'UTC';
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: validTz }).format(referenceDate);
  } catch {
    return referenceDate.toISOString().slice(0, 10);
  }
}

/**
 * Calculates whole calendar days from "today" in the destination's timezone to targetDateStr.
 * Positive = future, 0 = today, negative = past.
 */
export function getDaysDifference(
  targetDateStr: string,
  timezone?: string,
  referenceDate: Date = new Date()
): number {
  const todayStr = getTodayInTimezone(timezone, referenceDate);
  const { year: ty, month: tm, day: td } = parseDateParts(todayStr);
  const { year: gy, month: gm, day: gd } = parseDateParts(targetDateStr);

  const todayUtc = Date.UTC(ty, tm - 1, td);
  const targetUtc = Date.UTC(gy, gm - 1, gd);

  return Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

/**
 * Formats a YYYY-MM-DD date in the destination's timezone or UTC without browser timezone shift.
 */
export function formatDestinationDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
  timezone?: string
): string {
  const { year, month, day } = parseDateParts(dateStr);
  const midDayUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const validTz = isValidIanaTimezone(timezone) ? timezone : 'UTC';
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: validTz }).format(midDayUtc);
}
