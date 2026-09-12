import { Map, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface MapPlaceholderProps {
  selectedItemTitle?: string;
  destination: string;
  className?: string;
}

export default function MapPlaceholder({ selectedItemTitle, destination, className = "h-[300px]" }: MapPlaceholderProps) {
  // We use a static mock image for Jaipur when the destination is Jaipur.
  const isJaipur = destination.toLowerCase().includes('jaipur');

  return (
    <div className={`w-full ${className} bg-slate-100 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group shadow-[0_4px_20px_rgb(0,0,0,0.02)]`}>
      {isJaipur ? (
        <Image 
          src="/jaipur-map.jpg"
          alt={`Map of ${destination}`}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-400 via-transparent to-transparent bg-[length:20px_20px]"></div>
      )}
      
      {/* Dark overlay when something is selected so the marker pops */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${selectedItemTitle ? 'bg-slate-900/40' : 'bg-slate-900/10'}`}></div>

      <div className="z-10 flex flex-col items-center p-4 text-center mt-auto mb-6">
        {selectedItemTitle ? (
          <>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg mb-2 text-blue-600">
              <Map className="w-5 h-5" />
            </div>
            <div className="bg-white/95 backdrop-blur px-4 py-2 rounded-lg shadow-lg border border-white/20">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Selected Place</p>
              <p className="text-sm text-slate-900 font-bold">{selectedItemTitle}</p>
            </div>
          </>
        ) : (
          <div className="bg-white/95 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-white/20">
            <p className="text-sm font-medium text-slate-900">Map View</p>
            <p className="text-xs text-slate-500 mt-0.5">Select an itinerary item to view its location</p>
          </div>
        )}
      </div>

      <div className="absolute top-3 right-3 z-10">
        <button className="bg-white/90 hover:bg-white text-slate-700 p-2 rounded-lg shadow-sm border border-slate-200 transition-colors flex items-center gap-2 text-xs font-medium">
          <ExternalLink className="w-3.5 h-3.5" />
          Open Directions
        </button>
      </div>
    </div>
  );
}
