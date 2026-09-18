"use client";

import { useState } from 'react';
import { Map, ExternalLink, Navigation2, Layers } from 'lucide-react';

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
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    searchQuery
  )}`;

  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    searchQuery
  )}`;

  // Google Maps Embed API Key (optional restricted public key)
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // OpenStreetMap embed URL with bounding box if coordinates are known
  const hasCoords = typeof lat === 'number' && typeof lon === 'number';
  const osmDelta = 0.025;
  const osmEmbedUrl = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${(lon - osmDelta).toFixed(5)}%2C${(lat - osmDelta).toFixed(5)}%2C${(lon + osmDelta).toFixed(5)}%2C${(lat + osmDelta).toFixed(5)}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lon.toFixed(5)}`
    : null;

  const googleEmbedUrl = googleApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${googleApiKey}&q=${encodeURIComponent(
        searchQuery
      )}`
    : null;

  return (
    <div
      className={`w-full ${className} bg-slate-100 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-200/50`}
    >
      {/* Map iframe: Google Maps Embed (if key present & no error) else OSM embed */}
      {googleEmbedUrl && !providerError ? (
        <iframe
          title={`Map of ${searchQuery}`}
          src={googleEmbedUrl}
          className="w-full h-full border-0 absolute inset-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          onError={() => setProviderError(true)}
        />
      ) : osmEmbedUrl ? (
        <iframe
          title={`Map of ${searchQuery}`}
          src={osmEmbedUrl}
          className="w-full h-full border-0 absolute inset-0 filter saturate-[0.95]"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/30 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center shadow-md mb-3 text-[#1d6b8f]">
            <Map className="w-7 h-7" />
          </div>
          <p className="font-bold text-slate-800 text-sm">{destination}</p>
          <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
            Interactive map ready. Select an itinerary item to lock location.
          </p>
        </div>
      )}

      {/* Provider indicator badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur text-[10px] font-bold text-slate-600 shadow-sm border border-slate-200/60">
          <Layers className="w-3 h-3 text-[#1d6b8f]" />
          {googleEmbedUrl && !providerError ? 'Google Maps' : 'OpenStreetMap'}
        </span>
      </div>

      {/* Top right "Open Directions" action */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/95 hover:bg-white text-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200/80 transition-all hover:scale-105 flex items-center gap-1.5 text-xs font-bold"
          title="Open Directions in Google Maps"
        >
          <Navigation2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Directions</span>
        </a>
      </div>

      {/* Bottom selected place info overlay */}
      <div className="z-10 flex flex-col items-center p-4 text-center mt-auto mb-3 pointer-events-none">
        {activeTitle ? (
          <div className="bg-white/95 backdrop-blur px-4 py-2.5 rounded-xl shadow-lg border border-slate-200/60 pointer-events-auto flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="w-8 h-8 rounded-full bg-[#1d6b8f]/10 flex items-center justify-center text-[#1d6b8f] shrink-0">
              <Map className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Selected Place
              </p>
              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-900 font-black hover:text-[#1d6b8f] flex items-center gap-1 group/link"
              >
                <span>{activeTitle}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity text-[#1d6b8f]" />
              </a>
              {hasCoords && (
                <p className="text-[9px] text-slate-400 font-mono">
                  {lat.toFixed(4)}°, {lon.toFixed(4)}°
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-sm border border-slate-200/40">
            <p className="text-xs font-bold text-slate-700">Map View</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Select an itinerary item to view its coordinates
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

