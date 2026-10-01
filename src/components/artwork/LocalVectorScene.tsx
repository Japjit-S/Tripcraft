import React from 'react';
import { LocalSceneParameters } from '@/lib/types/engine';
import { SCENE_PALETTES, EditorialScenePalette } from '@/lib/images/sceneCatalog';

interface LocalVectorSceneProps {
  params: LocalSceneParameters;
  cropMode?: 'panoramic' | 'thumbnail';
  className?: string;
}

/**
 * Deterministic editorial vector scene composer for Tier 2 and fallback destinations.
 * Composes layered sky bands, sun disc, clouds, travel motifs, terrain, and non-specific
 * regional architectural silhouettes from stable destination metadata.
 */
export function LocalVectorScene({
  params,
  cropMode = 'panoramic',
  className = 'w-full h-full',
}: LocalVectorSceneProps) {
  const palette =
    SCENE_PALETTES[params.paletteId] || SCENE_PALETTES['terracotta-sun'];
  const gradId = `sky-${params.seedHash}-${cropMode}`;
  const viewBox = cropMode === 'thumbnail' ? '440 30 740 450' : '0 0 1200 500';
  const preserveAspectRatio =
    cropMode === 'thumbnail' ? 'xMidYMid slice' : 'xMaxYMid slice';

  const sunX = 830 + params.skyVariant * 45;
  const sunY = 155 + (params.skyVariant % 2) * 25;

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={palette.skyTop} />
          <stop offset="55%" stopColor={palette.skyMid} />
          <stop offset="100%" stopColor={palette.skyBottom} />
        </linearGradient>
      </defs>

      {/* Layered Sky & Sun */}
      <rect width="1200" height="500" fill={`url(#${gradId})`} />
      <circle cx={sunX} cy={sunY} r="132" fill={palette.sunHalo} opacity="0.34" />
      <circle cx={sunX} cy={sunY} r="92" fill={palette.sunDisc} />

      {/* Clouds */}
      <path
        d="M140 135 C175 112 225 112 260 135 L325 135 C345 135 355 152 325 158 L115 158 Z"
        fill={palette.cloudFill}
        opacity="0.65"
      />
      <path
        d="M980 112 C1015 92 1060 92 1095 112 L1150 112 C1168 112 1175 126 1150 132 L960 132 Z"
        fill={palette.cloudFill}
        opacity="0.72"
      />

      {/* Restrained Travel Motif */}
      <TravelMotifLayer motif={params.motifVariant} palette={palette} />

      {/* Distant Horizon & Terrain */}
      <path
        d={
          params.terrainVariant === 0
            ? 'M0 375 Q220 285 460 345 Q740 245 1200 330 L1200 500 L0 500 Z'
            : params.terrainVariant === 1
            ? 'M0 385 Q280 310 560 360 Q850 260 1200 340 L1200 500 L0 500 Z'
            : 'M0 365 Q200 295 490 340 Q810 250 1200 320 L1200 500 L0 500 Z'
        }
        fill={palette.farHorizon}
        opacity="0.78"
      />

      {/* Template-Specific Architectural & Landscape Silhouette */}
      <TemplateArchitectureLayer params={params} palette={palette} />

      {/* Foreground Water or Promenade */}
      <rect x="0" y="422" width="1200" height="78" fill={palette.waterOrTerrace} />
      <path
        d="M540 448 L1120 448 M620 472 L1040 472"
        stroke={palette.waterReflection}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.68"
      />
    </svg>
  );
}

function TravelMotifLayer({
  motif,
  palette,
}: {
  motif: LocalSceneParameters['motifVariant'];
  palette: EditorialScenePalette;
}) {
  if (motif === 'balloon-route') {
    return (
      <g>
        <path
          d="M170 215 Q360 135 560 170"
          stroke={palette.routeStroke}
          strokeWidth="2.5"
          strokeDasharray="7 7"
          opacity="0.45"
          fill="none"
        />
        <circle cx="595" cy="142" r="24" fill={palette.primaryArchitecture} />
        <path d="M583 142 Q595 118 607 142 Q595 166 583 142 Z" fill={palette.highlightTrim} />
        <rect x="590" y="170" width="10" height="8" rx="2" fill={palette.windowArch} />
      </g>
    );
  }
  if (motif === 'birds-compass') {
    return (
      <g stroke={palette.routeStroke} strokeWidth="2.5" fill="none" opacity="0.55">
        <path d="M510 145 Q522 132 534 145 Q546 132 558 145" />
        <path d="M565 122 Q575 112 585 122 Q595 112 605 122" />
        <path d="M210 195 Q380 125 500 150" strokeDasharray="6 6" />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M165 210 Q355 120 535 168 T755 125"
        stroke={palette.routeStroke}
        strokeWidth="2.5"
        strokeDasharray="7 7"
        opacity="0.45"
        fill="none"
      />
      <polygon
        points="765,122 745,116 751,125 747,134"
        fill={palette.routeStroke}
        opacity="0.7"
      />
    </g>
  );
}

function TemplateArchitectureLayer({
  params,
  palette,
}: {
  params: LocalSceneParameters;
  palette: EditorialScenePalette;
}) {
  const { templateId, skylineVariant } = params;
  const shiftX = skylineVariant * 14;

  if (templateId === 'alpine-valley') {
    return (
      <g transform={`translate(${shiftX}, 0)`}>
        <polygon points="480,422 650,155 820,422" fill={palette.midSilhouette} />
        <polygon points="650,155 605,225 650,205 695,225" fill={palette.highlightTrim} />
        <polygon points="710,422 900,125 1090,422" fill={palette.primaryArchitecture} />
        <polygon points="900,125 845,210 900,185 955,210" fill={palette.highlightTrim} />
        {/* Viaduct & Gabled Chalet Clocktower */}
        <rect x="560" y="335" width="480" height="87" fill={palette.secondaryArchitecture} />
        <rect x="815" y="215" width="65" height="207" fill={palette.primaryArchitecture} />
        <polygon points="808,215 847,160 886,215" fill={palette.windowArch} />
        <circle cx="847" cy="248" r="14" fill={palette.highlightTrim} />
        <g fill={palette.windowArch}>
          <path d="M595 422 L595 365 A24 24 0 0 1 643 365 L643 422 Z" />
          <path d="M675 422 L675 365 A24 24 0 0 1 723 365 L723 422 Z" />
          <path d="M915 422 L915 365 A24 24 0 0 1 963 365 L963 422 Z" />
        </g>
      </g>
    );
  }

  if (templateId === 'metropolitan-skyline') {
    return (
      <g transform={`translate(${shiftX}, 0)`}>
        <rect x="540" y="235" width="75" height="187" fill={palette.midSilhouette} />
        <rect x="630" y="175" width="92" height="247" fill={palette.secondaryArchitecture} />
        <rect x="740" y="125" width="105" height="297" fill={palette.primaryArchitecture} />
        <rect x="765" y="95" width="55" height="30" fill={palette.secondaryArchitecture} />
        <line x1="792" y1="55" x2="792" y2="95" stroke={palette.windowArch} strokeWidth="4" />
        <rect x="862" y="190" width="88" height="232" fill={palette.secondaryArchitecture} />
        <rect x="968" y="150" width="95" height="272" fill={palette.primaryArchitecture} />
        <path d="M968 150 Q1015 110 1063 150 Z" fill={palette.highlightTrim} />
        {/* Architectural Window Strips */}
        <g fill={palette.highlightTrim} opacity="0.8">
          <rect x="760" y="150" width="16" height="220" rx="4" />
          <rect x="786" y="150" width="16" height="220" rx="4" />
          <rect x="812" y="150" width="16" height="220" rx="4" />
          <rect x="652" y="200" width="48" height="180" rx="4" />
          <rect x="990" y="175" width="50" height="200" rx="4" />
        </g>
      </g>
    );
  }

  if (templateId === 'coastal-harbor' || templateId === 'tropical-island') {
    return (
      <g transform={`translate(${shiftX}, 0)`}>
        <path d="M460 422 Q680 265 960 320 L1180 300 L1180 422 Z" fill={palette.midSilhouette} />
        <rect x="620" y="245" width="145" height="177" fill={palette.primaryArchitecture} />
        <path d="M620 245 L692 190 L765 245 Z" fill={palette.highlightTrim} />
        <rect x="780" y="270" width="130" height="152" fill={palette.secondaryArchitecture} />
        <polygon points="955,422 970,185 1005,185 1020,422" fill={palette.highlightTrim} />
        <rect x="965" y="160" width="45" height="25" fill={palette.primaryArchitecture} />
        {/* Sailboat on Water */}
        <polygon points="555,412 595,325 595,412" fill={palette.highlightTrim} />
        <polygon points="602,412 602,345 632,412" fill={palette.secondaryArchitecture} />
        <g fill={palette.foliagePrimary}>
          <circle cx="1075" cy="395" r="36" />
          <circle cx="1115" cy="408" r="28" />
        </g>
      </g>
    );
  }

  if (templateId === 'desert-oasis') {
    return (
      <g transform={`translate(${shiftX}, 0)`}>
        <path d="M420 422 Q630 295 850 355 Q1020 285 1200 345 L1200 422 Z" fill={palette.midSilhouette} />
        <rect x="610" y="215" width="390" height="207" fill={palette.primaryArchitecture} />
        <rect x="690" y="160" width="230" height="262" fill={palette.secondaryArchitecture} />
        <path d="M745 160 Q805 95 865 160 Z" fill={palette.highlightTrim} />
        <g fill={palette.windowArch}>
          <path d="M725 320 L725 235 A26 26 0 0 1 777 235 L777 320 Z" />
          <path d="M833 320 L833 235 A26 26 0 0 1 885 235 L885 320 Z" />
        </g>
      </g>
    );
  }

  // Default: 'historic-old-town' (Rome-inspired layered domes, arches & belltower)
  return (
    <g transform={`translate(${shiftX}, 0)`}>
      <rect x="550" y="255" width="510" height="167" fill={palette.secondaryArchitecture} />
      <rect x="650" y="195" width="320" height="227" fill={palette.primaryArchitecture} />
      <path d="M720 195 Q810 88 900 195 Z" fill={palette.highlightTrim} />
      <rect x="975" y="145" width="62" height="277" fill={palette.primaryArchitecture} />
      <polygon points="968,145 1006,95 1044,145" fill={palette.highlightTrim} />
      <g fill={palette.windowArch} stroke={palette.highlightTrim} strokeWidth="1.5">
        <rect x="685" y="230" width="34" height="54" rx="17" />
        <rect x="745" y="230" width="34" height="54" rx="17" />
        <rect x="805" y="230" width="34" height="54" rx="17" />
        <rect x="865" y="230" width="34" height="54" rx="17" />
        <rect x="585" y="295" width="32" height="52" rx="16" />
        <rect x="685" y="315" width="34" height="58" rx="17" />
        <rect x="745" y="315" width="34" height="58" rx="17" />
        <rect x="805" y="315" width="34" height="58" rx="17" />
        <rect x="865" y="315" width="34" height="58" rx="17" />
      </g>
      <g fill={palette.foliagePrimary}>
        <circle cx="535" cy="402" r="34" />
        <circle cx="1075" cy="396" r="38" />
        <circle cx="1115" cy="410" r="28" />
      </g>
    </g>
  );
}
