"use client";

import { useState } from 'react';
import { Map, ExternalLink } from 'lucide-react';

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

  // Determine active item title and valid coordinates
  const activeTitle = selectedItem?.title || selectedItemTitle;
  const rawLat = selectedItem?.coords?.lat ?? destinationCoords?.lat;
  const rawLon = selectedItem?.coords?.lon ?? destinationCoords?.lon;

  const isValidCoords =
    rawLat !== undefined &&
    rawLon !== undefined &&
    !Number.isNaN(rawLat) &&
    !Number.isNaN(rawLon) &&
    rawLat >= -90 &&
    rawLat <= 90 &&
    rawLon >= -180 &&
    rawLon <= 180;

  const lat = isValidCoords ? rawLat : undefined;
  const lon = isValidCoords ? rawLon : undefined;

  const searchQuery = activeTitle
    ? `${activeTitle}, ${destination}`
    : destination;

  const mapsSearchUrl = lat !== undefined && lon !== undefined
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;

  // Classic Google Maps Embed
  // t=k forces Satellite view by default.
  // The map natively provides a switch to Roadmap in the bottom left.
  const embedQuery = lat !== undefined && lon !== undefined && activeTitle
    ? `${lat},${lon}`
    : lat !== undefined && lon !== undefined
    ? `${lat},${lon}`
    : searchQuery;

  const zoomLevel = activeTitle ? 16 : 13;
  const googleEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    embedQuery
  )}&t=k&z=${zoomLevel}&output=embed&iwloc=near`;

  return (
    <div
      className={`w-full ${className} bg-[var(--color-tc-parchment)] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group border-2 border-[var(--color-tc-sage)] shadow-[4px_4px_0px_rgba(23,60,57,0.05)] border border-[var(--color-tc-sage)]/80`}
    >
      {/* Map iframe with precise asymmetric crop */}
      {/* top: -70px hides the Place Card (top-left) */}
      {/* right: -70px (via width + left) hides the Zoom controls (bottom-right) */}
      {/* bottom: 0px and left: 0px PRESERVES the Satellite toggle (bottom-left) */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div 
          className="absolute"
          style={{ top: '-70px', left: '0px', bottom: '0px', width: 'calc(100% + 70px)' }}
        >
          {googleEmbedUrl && !providerError ? (
            <iframe
              key={`${embedQuery}`}
              title={`Map of ${searchQuery}`}
              src={googleEmbedUrl}
              className="w-full h-full border-0 absolute inset-0 transition-opacity duration-300"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onError={() => setProviderError(true)}
            />
          ) : (
            <div className="absolute inset-0  from-slate-100 via-slate-50 to-blue-50/30 flex flex-col items-center justify-center p-6 text-center" style={{ top: '70px', width: 'calc(100% - 70px)' }}>
              <div className="w-14 h-14 bg-[var(--color-tc-cream)]/90 backdrop-blur rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_rgba(23,60,57,0.15)] mb-3 text-[var(--color-tc-teal)]">
                <Map className="w-7 h-7" />
              </div>
              <p className="font-bold text-[var(--color-tc-ink)] text-sm">{destination}</p>
              <p className="text-xs text-[var(--color-tc-ink)]/50 mt-1 max-w-[200px]">
                Map ready. Hover over an activity to pin GPS coordinates.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top Custom Styled Action Buttons */}
      <div className="absolute top-4 right-4 z-10">
        <a
          href={mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[var(--color-tc-cream)]/95 backdrop-blur-xl hover:bg-[var(--color-tc-teal)]/10 text-[var(--color-tc-ink)] px-4 py-2.5 rounded-full shadow-lg shadow-black/10 border border-[var(--color-tc-sage)]/80 transition-all hover:scale-105 flex items-center justify-center gap-2 text-xs font-bold"
          title="Open in Google Maps"
        >
          <ExternalLink className="w-4 h-4 text-[var(--color-tc-teal)]" />
          <span>Open in Maps</span>
        </a>
      </div>

      </div>
  );
}
