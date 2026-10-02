import Image from 'next/image';
import { Cloud } from 'lucide-react';

interface WeatherSummaryProps {
  summary: string;
  weatherState?: string;
  isEstimatedWeather?: boolean;
  weatherSource?: 'forecast' | 'historical_estimate' | 'fallback_estimate';
  weatherConfidence?: 'high' | 'medium' | 'low';
  weatherResolution?: 'daily' | 'hourly';
}

export default function WeatherSummary({
  summary,
  weatherState,
  weatherSource,
}: WeatherSummaryProps) {
  const lowerSummary = (summary || '').toLowerCase();
  const normalizedState = (weatherState || '').toUpperCase();

  let bgGradient = 'from-slate-50 to-slate-100 border-[var(--color-tc-sage)]';
  let primaryImage: string | null = null;
  let secondaryImage: string | null = null;
  let accentClass = '';

  if (normalizedState === 'MIXED' || (lowerSummary.includes('rain') && lowerSummary.includes('sun'))) {
    primaryImage = '/artwork/weather-rain-cloud.png';
    secondaryImage = '/artwork/weather-clear-sun.png';
    bgGradient = 'from-blue-50 to-indigo-50 border-[var(--color-tc-teal)]/30';
  } else if (normalizedState === 'STORM' || lowerSummary.includes('thunderstorm') || lowerSummary.includes('storm')) {
    primaryImage = '/artwork/weather-thunderstorm.png';
    bgGradient = 'from-purple-50 to-indigo-50 border-purple-200';
  } else if (normalizedState === 'EXTREME_HEAT' || lowerSummary.includes('extreme heat')) {
    primaryImage = '/artwork/weather-clear-sun.png';
    accentClass = 'brightness-90 sepia-[.3] hue-rotate-[-15deg] saturate-150 drop-shadow-[0_4px_12px_rgba(239,68,68,0.4)]';
    bgGradient = 'from-rose-50 to-orange-50 border-rose-200';
  } else if (normalizedState === 'COLD_WIND' || lowerSummary.includes('windy') || lowerSummary.includes('cold and windy')) {
    primaryImage = '/artwork/weather-cold-wind.png';
    bgGradient = 'from-cyan-50 to-blue-50 border-cyan-200';
  } else if (
    normalizedState === 'RAIN' ||
    lowerSummary.includes('rain') ||
    lowerSummary.includes('shower') ||
    lowerSummary.includes('snow')
  ) {
    primaryImage = '/artwork/weather-rain-cloud.png';
    bgGradient = 'from-blue-50 to-indigo-50 border-[var(--color-tc-teal)]/30';
  } else if (
    (normalizedState === 'CLEAR' || lowerSummary.includes('sun') || lowerSummary.includes('clear')) &&
    weatherSource !== 'fallback_estimate'
  ) {
    primaryImage = '/artwork/weather-clear-sun.png';
    bgGradient = 'from-amber-50 to-orange-50 border-[var(--color-tc-saffron)]';
  } else {
    // Fallback behavior
    primaryImage = '/artwork/weather-clear-sun.png';
    accentClass = 'grayscale opacity-60';
  }

  // Parse temperature range: e.g. "18°C - 28°C" or single "28°C"
  const rangeMatch = summary.match(/(\d+)[°A-Za-z]+C\s*-\s*(\d+)[°A-Za-z]+C/);
  const minTemp = rangeMatch ? rangeMatch[1] : null;
  const maxTemp = rangeMatch ? rangeMatch[2] : (summary.match(/(\d+)[°A-Za-z]+C/)?.[1] ?? '22');

  const mainCondition = summary.split(',')[0].replace(/\s*\([^)]*\)/, '').trim();

  return (
    <div
      className={"flex flex-row items-center justify-between px-4 sm:px-5 py-3.5 rounded-3xl bg-gradient-to-br " + bgGradient + " border-2 border-[var(--color-tc-sage)] shadow-[4px_4px_0px_rgba(23,60,57,0.05)] h-full transition-all gap-2 sm:gap-3"}
    >
      <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <p className="text-3xl font-bold font-serif text-[var(--color-tc-ink)] tracking-tight">
            {maxTemp}°<span className="text-xl text-[var(--color-tc-ink)]/70 font-bold">C</span>
          </p>
          {minTemp && (
            <span className="text-sm font-semibold text-[var(--color-tc-ink)]/60">
              / {minTemp}°C
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm font-bold text-[var(--color-tc-ink)]/80 capitalize leading-snug break-words">
          {mainCondition || 'Forecast'}
        </p>
      </div>

      <div className="relative flex items-center justify-center shrink-0 w-20 h-20 sm:w-24 sm:h-20">
        {secondaryImage && (
          <Image 
            src={secondaryImage} 
            alt="Secondary weather condition" 
            width={48} 
            height={48} 
            className="absolute top-[-4px] right-[-4px] opacity-90 object-contain drop-shadow-sm"
          />
        )}
        {primaryImage ? (
          <Image 
            src={primaryImage} 
            alt={mainCondition || 'Forecast'} 
            width={88} 
            height={88} 
            className={"relative z-10 object-contain max-h-[88px] drop-shadow-md " + accentClass}
          />
        ) : (
          <Cloud className="w-10 h-10 text-[var(--color-tc-ink)]/40" />
        )}
      </div>
    </div>
  );
}
