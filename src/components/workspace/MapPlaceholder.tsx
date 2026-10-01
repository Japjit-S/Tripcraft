"use client";

import { useState } from 'react';
import { Map, ExternalLink, Navigation, Compass } from 'lucide-react';

interface MapItem {
  title: string;
  coords?: { lat: number; lon: number };
}

interface MapPlaceholderProps {
  selectedItemTitle?: string;
  selectedItem?: MapItem;
  destination: string;
  destinationCoords?: { lat: number; lon: number };
  className?: string;
}

export default function MapPlaceholder({
  selectedItemTitle,
  selectedItem,
  destination,
  destinationCoords,
  className = 'h-[300px]',
}: MapPlaceholderProps) {
  const [providerError, setProviderError] = useState(false);

  // Determine active item title and coordinates
  const activeTitle = selectedItem?.title || selectedItemTitle;
  const lat = selectedItem?.coords?.lat ?? destinationCoords?.lat;
  const lon = selectedItem?.coords?.lon ?? destinationCoords?.lon;

  const searchQuery = activeTitle
    ? `${activeTitle}, ${destination}`
    : destination;

  // Directions URL per ROADMAP.md (works without API key)
  const directionsQuery = lat !== undefined && lon !== undefined
    ? `${lat},${lon}`
    : searchQuery;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    directionsQuery
  )}`;

  const mapsSearchUrl = lat !== undefined && lon !== undefined
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;

  // Classic Google Maps Embed - precisely pins GPS coords or location query
  const embedQuery = lat !== undefined && lon !== undefined && activeTitle
    ? `${lat},${lon} (${activeTitle})`
    : lat !== undefined && lon !== undefined
    ? `${lat},${lon}`
    : searchQuery;

  const zoomLevel = activeTitle ? 15 : 13;
  const googleEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    embedQuery
  )}&t=m&z=${zoomLevel}&output=embed&iwloc=near`;

  return (
    <div
      className={`w-full ${className} bg-slate-100 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-200/80`}
    >
      {/* Map iframe with asymmetric crop to remove clunky iframe header while preserving bottom map navigation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
        <div 
          className="absolute pointer-events-auto"
          style={{ top: '-60px', right: '-60px', bottom: '0px', left: '0px' }}
        >
          {googleEmbedUrl && !providerError ? (
            <iframe
              key={embedQuery}
              title={`Map of ${searchQuery}`}
              src={googleEmbedUrl}
              className="w-full h-full border-0 absolute inset-0 transition-opacity duration-300"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onError={() => setProviderError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/30 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center shadow-md mb-3 text-[#1d6b8f]">
                <Map className="w-7 h-7" />
              </div>
              <p className="font-bold text-slate-800 text-sm">{destination}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Interactive map ready. Hover over an activity to pin GPS coordinates.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top Custom Styled Action Buttons */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/90 backdrop-blur-md hover:bg-white text-slate-800 px-3 py-2 rounded-xl shadow-md border border-slate-200/80 transition-all hover:scale-105 flex items-center justify-center gap-1.5 text-xs font-bold"
          title="Get Directions in Google Maps"
        >
          <Navigation className="w-3.5 h-3.5 text-orange-600" />
          <span className="hidden sm:inline">Directions</span>
        </a>
        <a
          href={mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/90 backdrop-blur-md hover:bg-white text-slate-800 px-3 py-2 rounded-xl shadow-md border border-slate-200/80 transition-all hover:scale-105 flex items-center justify-center gap-1.5 text-xs font-bold"
          title="Open in Google Maps"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#1d6b8f]" />
          <span>Full Map</span>
        </a>
      </div>

      {/* Bottom Floating Pin HUD */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md text-white py-2 px-3.5 rounded-xl shadow-lg border border-white/10 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2 truncate pr-2">
            <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span className="truncate font-semibold">
              {activeTitle ? activeTitle : `${destination} Overview`}
            </span>
          </div>
          {lat !== undefined && lon !== undefined && (
            <span className="text-[10px] font-mono text-slate-300 shrink-0 hidden sm:inline">
              {lat.toFixed(4)}, {lon.toFixed(4)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
