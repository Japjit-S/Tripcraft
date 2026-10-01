import { Cloud, Sun, CloudRain, Wind, CloudLightning, Flame, AlertCircle } from 'lucide-react';

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
  isEstimatedWeather,
  weatherSource,
  weatherConfidence,
  weatherResolution = 'daily',
}: WeatherSummaryProps) {
  const lowerSummary = (summary || '').toLowerCase();
  const normalizedState = (weatherState || '').toUpperCase();

  let Icon = Cloud;
  let iconColor = 'text-slate-500';
  let bgGradient = 'from-slate-50 to-slate-100 border-slate-200';

  if (normalizedState === 'STORM' || lowerSummary.includes('thunderstorm') || lowerSummary.includes('storm')) {
    Icon = CloudLightning;
    iconColor = 'text-purple-600';
    bgGradient = 'from-purple-50 to-indigo-50 border-purple-200';
  } else if (normalizedState === 'EXTREME_HEAT' || lowerSummary.includes('extreme heat')) {
    Icon = Flame;
    iconColor = 'text-rose-600';
    bgGradient = 'from-rose-50 to-orange-50 border-rose-200';
  } else if (normalizedState === 'COLD_WIND' || lowerSummary.includes('windy') || lowerSummary.includes('cold and windy')) {
    Icon = Wind;
    iconColor = 'text-cyan-600';
    bgGradient = 'from-cyan-50 to-blue-50 border-cyan-200';
  } else if (
    normalizedState === 'RAIN' ||
    lowerSummary.includes('rain') ||
    lowerSummary.includes('shower') ||
    lowerSummary.includes('snow')
  ) {
    Icon = CloudRain;
    iconColor = 'text-blue-500';
    bgGradient = 'from-blue-50 to-indigo-50 border-blue-200';
  } else if (
    (normalizedState === 'CLEAR' || lowerSummary.includes('sun') || lowerSummary.includes('clear')) &&
    weatherSource !== 'fallback_estimate'
  ) {
    Icon = Sun;
    iconColor = 'text-amber-500';
    bgGradient = 'from-amber-50 to-orange-50 border-amber-200';
  }

  // Parse temperature range: e.g. "18°C - 28°C" or single "28°C"
  const rangeMatch = summary.match(/(\d+)°C\s*-\s*(\d+)°C/);
  const minTemp = rangeMatch ? rangeMatch[1] : null;
  const maxTemp = rangeMatch ? rangeMatch[2] : (summary.match(/(\d+)°C/)?.[1] ?? '22');

  const mainCondition = summary.split(',')[0].replace(/\s*\(.*\)/, '').trim();

  const isLowConfidence =
    isEstimatedWeather ||
    weatherConfidence === 'low' ||
    weatherSource === 'historical_estimate' ||
    weatherSource === 'fallback_estimate';

  return (
    <div
      className={`flex flex-col justify-between gap-4 p-5 rounded-[2rem] bg-gradient-to-br ${bgGradient} border shadow-[0_4px_20px_rgb(0,0,0,0.03)] h-full transition-all`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl bg-white shadow-xs ${iconColor}`}>
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-3xl font-black text-slate-900 tracking-tight">
                {maxTemp}°<span className="text-lg text-slate-500 font-bold">C</span>
              </p>
              {minTemp && (
                <span className="text-xs font-semibold text-slate-400">
                  / {minTemp}°C
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-slate-700 capitalize mt-0.5 line-clamp-1">
              {mainCondition || 'Forecast'}
            </p>
          </div>
        </div>
      </div>

      {/* Uncertainty & Fidelity Indicators */}
      <div className="pt-3 border-t border-black/5 flex flex-wrap items-center gap-2">
        {isLowConfidence ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100/80 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            {weatherSource === 'fallback_estimate'
              ? 'Unconfirmed Fallback'
              : 'Historical Estimate (16d+)'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Forecast ({weatherConfidence || 'high'})
          </span>
        )}

        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
          {weatherResolution === 'hourly' ? 'Hourly' : 'Daily Resolution'}
        </span>
      </div>
    </div>
  );
}
