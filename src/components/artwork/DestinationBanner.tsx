"use client";

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { DestinationArtworkDescriptor } from '@/lib/types/engine';
import { resolveLocalDestinationArtwork } from '@/lib/images/sceneCatalog';
import { CuratedCityScene } from './CuratedCityScene';
import { LocalVectorScene } from './LocalVectorScene';

export type BannerSurface = 'workspace' | 'dashboard' | 'card';

export interface DestinationBannerProps {
  artwork?: DestinationArtworkDescriptor | null;
  destination: string;
  destinationId?: string;
  country?: string;
  countryCode?: string;
  admin1?: string;
  coords?: { lat: number; lon: number };
  surface: BannerSurface;
  className?: string;
  showAttribution?: boolean;
}

const ALLOWED_EXTERNAL_PREFIXES = [
  'https://upload.wikimedia.org/wikipedia/commons/',
  'https://thumb.wikimedia.org/wikipedia/commons/',
  'https://images.unsplash.com/',
];

function isAllowedExternalIllustrationUrl(url?: string): url is string {
  if (!url) return false;
  if (!ALLOWED_EXTERNAL_PREFIXES.some((p) => url.startsWith(p))) return false;
  const cleanPath = url.split('?')[0];
  if (/\.svg$/i.test(cleanPath)) return false;
  return /\.(png|jpe?g|webp)$/i.test(cleanPath) || url.includes('unsplash.com');
}

/**
 * Shared presentational destination banner and illustration renderer.
 * Renders the same resolved destination artwork across the workspace hero,
 * dashboard featured card, and saved trips grid with surface-specific crops
 * and overlays. Always renders bundled vector art immediately underneath any
 * optional external illustration and stops retrying on error.
 */
export function DestinationBanner({
  artwork,
  destination,
  destinationId,
  country,
  countryCode,
  admin1,
  coords,
  surface,
  className = '',
  showAttribution,
}: DestinationBannerProps) {
  const descriptor = useMemo<DestinationArtworkDescriptor>(() => {
    if (artwork && artwork.fallbackScene && artwork.destinationId) {
      return artwork;
    }
    return resolveLocalDestinationArtwork({
      id: destinationId,
      city: destination,
      country,
      countryCode,
      admin1,
      latitude: coords?.lat,
      longitude: coords?.lon,
    });
  }, [
    artwork,
    destination,
    destinationId,
    country,
    countryCode,
    admin1,
    coords?.lat,
    coords?.lon,
  ]);

  const externalUrl =
    descriptor.kind === 'external_illustration' &&
    isAllowedExternalIllustrationUrl(descriptor.imageUrl)
      ? descriptor.imageUrl
      : null;

  const externalKey = externalUrl
    ? `${descriptor.artworkId}:${externalUrl}`
    : null;

  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);

  const hasExternalFailed = externalKey !== null && failedKey === externalKey;
  const isExternalVisible =
    externalKey !== null && loadedKey === externalKey && !hasExternalFailed;

  const cropMode = surface === 'card' ? 'thumbnail' : 'panoramic';
  const focalX = Math.round((descriptor.focalPoint?.x ?? 0.72) * 100);
  const focalY = Math.round((descriptor.focalPoint?.y ?? 0.48) * 100);

  const shouldShowCredit =
    (showAttribution ?? surface !== 'card') &&
    isExternalVisible &&
    Boolean(descriptor.attribution);

  const sizes =
    surface === 'workspace'
      ? '(max-width: 768px) 75vw, (max-width: 1280px) 60vw, 640px'
      : surface === 'dashboard'
      ? '(max-width: 1024px) 100vw, 760px'
      : '(max-width: 640px) 100vw, 260px';

  return (
    <div
      role="img"
      aria-label={descriptor.alt}
      data-art-kind={hasExternalFailed ? 'generated_local_scene' : descriptor.kind}
      data-destination-id={descriptor.destinationId}
      className={`relative overflow-hidden select-none ${className}`}
    >
      {/* Immediate Local Vector Layer (Curated Flagship or Deterministic Scene) */}
      <div
        className={`absolute inset-0 transition-transform duration-700 ease-out ${
          surface === 'dashboard' || surface === 'card'
            ? 'group-hover:scale-105'
            : ''
        }`}
      >
        {descriptor.curatedCityKey ? (
          <CuratedCityScene
            cityKey={descriptor.curatedCityKey}
            cropMode={cropMode}
            className="w-full h-full"
          />
        ) : (
          <LocalVectorScene
            params={descriptor.fallbackScene}
            cropMode={cropMode}
            className="w-full h-full"
          />
        )}
      </div>

      {/* Optional External Validated Illustration Layer */}
      {externalUrl && !hasExternalFailed && (
        <Image
          key={externalKey}
          src={externalUrl}
          alt={descriptor.alt}
          fill
          sizes={sizes}
          style={{ objectPosition: `${focalX}% ${focalY}%` }}
          className={`object-cover transition-opacity duration-500 ${
            isExternalVisible ? 'opacity-100' : 'opacity-0'
          } ${
            surface === 'dashboard' || surface === 'card'
              ? 'group-hover:scale-105 transition-transform duration-700 ease-out'
              : ''
          }`}
          onLoad={() => {
            if (externalKey) setLoadedKey(externalKey);
          }}
          onError={() => {
            if (externalKey) setFailedKey(externalKey);
          }}
        />
      )}

      {/* Surface-Specific Overlays & Safe-Area Gradients */}
      {surface === 'workspace' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFF5ED] via-[#FFE8D6]/85 via-30% to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFE8D6]/35 via-transparent to-[#FFF5ED]/20 pointer-events-none" />
        </>
      )}

      {surface === 'dashboard' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/45 to-slate-900/10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent pointer-events-none" />
        </>
      )}

      {surface === 'card' && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent pointer-events-none" />
      )}

      {/* Unobtrusive External Attribution Credit */}
      {shouldShowCredit && descriptor.attribution && (
        <div
          className={`absolute bottom-2.5 right-3 z-20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-xs pointer-events-auto truncate max-w-[240px] ${
            surface === 'dashboard'
              ? 'bg-slate-950/55 text-slate-200'
              : 'bg-white/75 text-slate-700'
          }`}
          title={descriptor.attribution.attributionText}
        >
          <span>
            Art: {descriptor.attribution.author} ({descriptor.attribution.license})
          </span>
        </div>
      )}
    </div>
  );
}
