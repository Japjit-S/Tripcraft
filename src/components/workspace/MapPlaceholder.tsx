"use client";

import { useState } from 'react';
import { Map, ExternalLink, Layers } from 'lucide-react';

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

  // Classic Google Maps Embed (does not require API key, no massive place card, retains satellite toggle)
  const googleEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    searchQuery
  )}&t=h&z=14&output=embed&iwloc=near`;

  return (
    <div
      className={`w-full ${className} bg-slate-100 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-200/50`}
    >
      {/* Map iframe with asymmetric negative margins to crop top-left and bottom-right native buttons, preserving bottom-left satellite */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2rem]">
        <div 
          className="absolute pointer-events-auto"
          style={{ top: '-70px', right: '-70px', bottom: '0px', left: '0px' }}
        >
          {googleEmbedUrl && !providerError ? (
            <iframe
              title={`Map of ${searchQuery}`}
              src={googleEmbedUrl}
              className="w-full h-full border-0 absolute inset-0"
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
            Interactive map ready. Select an itinerary item to lock location.
          </p>
        </div>
      )}
        </div>
      </div>

      {/* Top Custom Styled Action Button */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <a
          href={mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/95 backdrop-blur hover:bg-white text-slate-800 px-4 py-2.5 rounded-xl shadow-[0_4px_12px_rgb(0,0,0,0.1)] border border-slate-200/80 transition-all hover:scale-105 flex items-center justify-center gap-2 text-[13px] font-bold"
          title="Open in Google Maps"
        >
          <ExternalLink className="w-4 h-4 text-[#1d6b8f]" />
          <span>Open in Maps</span>
        </a>
      </div>
    </div>
  );
}

