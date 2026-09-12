import { Cloud, Sun, CloudRain, Wind, Droplets } from 'lucide-react';

interface WeatherSummaryProps {
  summary: string;
}

export default function WeatherSummary({ summary }: WeatherSummaryProps) {
  // Simple heuristic to pick an icon based on mock summary text
  const lowerSummary = summary.toLowerCase();
  
  let Icon = Cloud;
  let iconColor = "text-slate-500";
  let bgGradient = "from-slate-50 to-slate-100 border-slate-200";

  if (lowerSummary.includes('sun') || lowerSummary.includes('clear')) {
    Icon = Sun;
    iconColor = "text-amber-500";
    bgGradient = "from-amber-50 to-orange-50 border-amber-200";
  } else if (lowerSummary.includes('rain') || lowerSummary.includes('shower')) {
    Icon = CloudRain;
    iconColor = "text-blue-500";
    bgGradient = "from-blue-50 to-indigo-50 border-blue-200";
  }

  // Extract temperature if present, e.g., "Clear and sunny, 28°C"
  const tempMatch = summary.match(/(\d+)°C/);
  const temp = tempMatch ? tempMatch[1] : "24";

  return (
    <div className={`flex flex-col justify-center gap-5 p-6 rounded-[2rem] bg-gradient-to-br ${bgGradient} shadow-[0_4px_20px_rgb(0,0,0,0.03)] h-full`}>
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-full bg-white shadow-sm ${iconColor}`}>
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <p className="text-4xl font-black text-slate-900 tracking-tight">
            {temp}°<span className="text-xl text-slate-500 font-bold">C</span>
          </p>
          <p className="text-sm font-semibold text-slate-700 capitalize">{summary.split(',')[0]}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6 pt-4 border-t border-black/5">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white rounded-full shadow-sm">
            <Droplets className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Humidity</p>
            <p className="text-sm font-bold text-slate-800">45%</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white rounded-full shadow-sm">
            <Wind className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wind</p>
            <p className="text-sm font-bold text-slate-800">12 km/h</p>
          </div>
        </div>
      </div>
    </div>
  );
}
