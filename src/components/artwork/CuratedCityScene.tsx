import React from 'react';
import { CuratedCityKey } from '@/lib/types/engine';

interface CuratedCitySceneProps {
  cityKey: CuratedCityKey;
  cropMode?: 'panoramic' | 'thumbnail';
  className?: string;
}

/**
 * Renders bundled vector landmark illustrations for the 6 curated flagship cities.
 * Text-free, season-neutral, warm editorial travel illustration style.
 */
export function CuratedCityScene({
  cityKey,
  cropMode = 'panoramic',
  className = 'w-full h-full',
}: CuratedCitySceneProps) {
  const viewBox = cropMode === 'thumbnail' ? '440 30 740 450' : '0 0 1200 500';
  const preserveAspectRatio =
    cropMode === 'thumbnail' ? 'xMidYMid slice' : 'xMaxYMid slice';

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {cityKey === 'jaipur' && <JaipurVectorScene />}
      {cityKey === 'delhi' && <DelhiVectorScene />}
      {cityKey === 'agra' && <AgraVectorScene />}
      {cityKey === 'varanasi' && <VaranasiVectorScene />}
      {cityKey === 'udaipur' && <UdaipurVectorScene />}
      {cityKey === 'goa' && <GoaVectorScene />}
    </svg>
  );
}

function JaipurVectorScene() {
  return (
    <>
      <defs>
        <linearGradient id="c-jp-sky" x1="0" y1="0" x2="0" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F7A072" />
          <stop offset="55%" stopColor="#F9C784" />
          <stop offset="100%" stopColor="#FFF1DC" />
        </linearGradient>
      </defs>
      <rect width="1200" height="500" fill="url(#c-jp-sky)" />
      <circle cx="900" cy="175" r="135" fill="#FDB863" opacity="0.35" />
      <circle cx="900" cy="175" r="96" fill="#FFF7DE" />
      <path d="M120 140 C160 120 210 120 250 140 L310 140 C330 140 345 155 315 162 L100 162 Z" fill="#FFF8EE" opacity="0.7" />
      <path d="M1010 110 C1040 94 1080 94 1110 110 L1155 110 C1170 110 1180 122 1155 128 L995 128 Z" fill="#FFF8EE" opacity="0.75" />
      <path d="M180 210 Q340 125 510 175 T760 130" stroke="#9E3B24" strokeWidth="2.5" strokeDasharray="7 7" opacity="0.45" fill="none" />
      <polygon points="768,127 748,120 754,130 749,139" fill="#9E3B24" opacity="0.7" />
      <path d="M0 365 Q180 280 390 335 Q560 245 760 315 Q960 240 1200 320 L1200 500 L0 500 Z" fill="#E08A64" opacity="0.8" />
      {/* Amber Fort Ridge Silhouette */}
      <path d="M350 305 L350 265 L375 265 L375 278 L395 278 L395 260 L435 260 L435 278 L455 278 L455 265 L480 265 L480 315 Z" fill="#C96846" />
      <path d="M0 405 Q260 355 540 395 Q860 360 1200 390 L1200 500 L0 500 Z" fill="#C96846" />
      {/* Hawa Mahal Crowned Facade */}
      <g transform="translate(560, 120)">
        <rect x="40" y="180" width="440" height="160" rx="4" fill="#B84B31" />
        <rect x="85" y="130" width="350" height="190" rx="4" fill="#C85538" />
        <rect x="130" y="85" width="260" height="220" rx="4" fill="#D46244" />
        <rect x="175" y="45" width="170" height="240" rx="4" fill="#DF7050" />
        <rect x="220" y="15" width="80" height="250" rx="4" fill="#E67E5D" />
        <path d="M220 15 Q260 -18 300 15 Z" fill="#FBE3C6" />
        <path d="M175 45 Q200 18 225 45 Z M295 45 Q320 18 345 45 Z" fill="#FBE3C6" />
        <path d="M130 85 Q155 58 180 85 Z M340 85 Q365 58 390 85 Z" fill="#FBE3C6" />
        <path d="M85 130 Q110 104 135 130 Z M385 130 Q410 104 435 130 Z" fill="#FBE3C6" />
        <path d="M40 180 Q65 154 90 180 Z M430 180 Q455 154 480 180 Z" fill="#FBE3C6" />
        <g fill="#5E2118" stroke="#FBE3C6" strokeWidth="1.5">
          <rect x="242" y="32" width="36" height="42" rx="18" />
          <rect x="192" y="65" width="32" height="40" rx="16" />
          <rect x="244" y="65" width="32" height="40" rx="16" />
          <rect x="296" y="65" width="32" height="40" rx="16" />
          <rect x="148" y="105" width="30" height="40" rx="15" />
          <rect x="196" y="105" width="30" height="40" rx="15" />
          <rect x="245" y="105" width="30" height="40" rx="15" />
          <rect x="294" y="105" width="30" height="40" rx="15" />
          <rect x="342" y="105" width="30" height="40" rx="15" />
          <rect x="102" y="150" width="30" height="42" rx="15" />
          <rect x="150" y="150" width="30" height="42" rx="15" />
          <rect x="198" y="150" width="30" height="42" rx="15" />
          <rect x="245" y="150" width="30" height="42" rx="15" />
          <rect x="292" y="150" width="30" height="42" rx="15" />
          <rect x="340" y="150" width="30" height="42" rx="15" />
          <rect x="388" y="150" width="30" height="42" rx="15" />
          <rect x="58" y="200" width="30" height="48" rx="15" />
          <rect x="105" y="200" width="30" height="48" rx="15" />
          <rect x="152" y="200" width="30" height="48" rx="15" />
          <rect x="199" y="200" width="30" height="48" rx="15" />
          <rect x="245" y="200" width="30" height="48" rx="15" />
          <rect x="291" y="200" width="30" height="48" rx="15" />
          <rect x="338" y="200" width="30" height="48" rx="15" />
          <rect x="385" y="200" width="30" height="48" rx="15" />
          <rect x="432" y="200" width="30" height="48" rx="15" />
        </g>
        <line x1="40" y1="192" x2="480" y2="192" stroke="#FBE3C6" strokeWidth="2.5" />
        <line x1="85" y1="142" x2="435" y2="142" stroke="#FBE3C6" strokeWidth="2.5" />
        <line x1="130" y1="98" x2="390" y2="98" stroke="#FBE3C6" strokeWidth="2.5" />
        <line x1="40" y1="262" x2="480" y2="262" stroke="#FBE3C6" strokeWidth="3" />
      </g>
      <rect x="0" y="430" width="1200" height="70" fill="#8C3522" />
      <rect x="0" y="422" width="1200" height="10" fill="#FBE3C6" opacity="0.65" />
      <g fill="#24594C">
        <circle cx="535" cy="405" r="34" />
        <circle cx="570" cy="415" r="26" />
        <circle cx="1075" cy="398" r="38" />
        <circle cx="1115" cy="412" r="28" />
      </g>
    </>
  );
}

function DelhiVectorScene() {
  return (
    <>
      <defs>
        <linearGradient id="c-dl-sky" x1="0" y1="0" x2="0" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F39C6B" />
          <stop offset="55%" stopColor="#F7C578" />
          <stop offset="100%" stopColor="#FFF3DF" />
        </linearGradient>
      </defs>
      <rect width="1200" height="500" fill="url(#c-dl-sky)" />
      <circle cx="880" cy="170" r="130" fill="#F5B041" opacity="0.32" />
      <circle cx="880" cy="170" r="92" fill="#FFF9E2" />
      <path d="M160 190 Q350 110 530 155 T740 120" stroke="#7B3418" strokeWidth="2.5" strokeDasharray="7 7" opacity="0.45" fill="none" />
      <polygon points="748,117 729,112 735,121 731,130" fill="#7B3418" opacity="0.7" />
      <path d="M440 420 L440 320 L690 320 L690 420 Z" fill="#C96846" opacity="0.88" />
      <path d="M475 320 Q520 248 565 320 Z M580 320 Q625 258 670 320 Z" fill="#B96334" />
      <g transform="translate(715, 108)">
        <rect x="45" y="18" width="190" height="22" fill="#CC6F3D" />
        <rect x="25" y="38" width="230" height="28" fill="#B96334" />
        <rect x="10" y="64" width="260" height="255" fill="#9C4522" />
        <path d="M85 319 L85 155 A55 55 0 0 1 195 155 L195 319 Z" fill="url(#c-dl-sky)" />
        <path d="M80 319 L80 155 A60 60 0 0 1 200 155 L200 319" stroke="#FDE8C4" strokeWidth="3" fill="none" />
        <rect x="34" y="110" width="28" height="46" rx="14" fill="#4D1F11" stroke="#FDE8C4" strokeWidth="1.5" />
        <rect x="218" y="110" width="28" height="46" rx="14" fill="#4D1F11" stroke="#FDE8C4" strokeWidth="1.5" />
        <rect x="34" y="185" width="28" height="58" rx="14" fill="#4D1F11" stroke="#FDE8C4" strokeWidth="1.5" />
        <rect x="218" y="185" width="28" height="58" rx="14" fill="#4D1F11" stroke="#FDE8C4" strokeWidth="1.5" />
        <line x1="10" y1="90" x2="270" y2="90" stroke="#FDE8C4" strokeWidth="2.5" />
        <path d="M110 18 Q140 -2 170 18 Z" fill="#FDE8C4" />
      </g>
      <g fill="#234E46">
        <circle cx="660" cy="395" r="42" />
        <circle cx="710" cy="408" r="32" />
        <circle cx="1015" cy="392" r="44" />
        <circle cx="1065" cy="406" r="34" />
      </g>
      <rect x="0" y="425" width="1200" height="75" fill="#7B3418" />
      <rect x="420" y="438" width="780" height="18" rx="9" fill="#1D6B8F" opacity="0.7" />
    </>
  );
}

function AgraVectorScene() {
  return (
    <>
      <defs>
        <linearGradient id="c-ag-sky" x1="0" y1="0" x2="0" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EC9578" />
          <stop offset="55%" stopColor="#F6C295" />
          <stop offset="100%" stopColor="#FFF2E5" />
        </linearGradient>
      </defs>
      <rect width="1200" height="500" fill="url(#c-ag-sky)" />
      <circle cx="855" cy="185" r="145" fill="#F6AE84" opacity="0.35" />
      <circle cx="855" cy="185" r="105" fill="#FFF8EA" />
      <path d="M0 390 Q310 345 620 385 Q920 350 1200 380 L1200 500 L0 500 Z" fill="#CF7E6C" opacity="0.7" />
      <g transform="translate(555, 105)">
        <rect x="18" y="85" width="18" height="215" fill="#FFF8F3" stroke="#C96D5D" strokeWidth="1.5" />
        <path d="M14 85 Q27 65 40 85 Z" fill="#FDE8DC" />
        <rect x="72" y="115" width="14" height="185" fill="#FDE8DC" stroke="#C96D5D" strokeWidth="1.2" />
        <rect x="494" y="115" width="14" height="185" fill="#FDE8DC" stroke="#C96D5D" strokeWidth="1.2" />
        <rect x="544" y="85" width="18" height="215" fill="#FFF8F3" stroke="#C96D5D" strokeWidth="1.5" />
        <path d="M540 85 Q553 65 566 85 Z" fill="#FDE8DC" />
        <rect x="135" y="140" width="310" height="160" rx="4" fill="#FFF8F3" stroke="#C96D5D" strokeWidth="2" />
        <path d="M225 140 C210 75 260 35 290 12 C320 35 370 75 355 140 Z" fill="#FFF8F3" stroke="#C96D5D" strokeWidth="2" />
        <line x1="290" y1="-8" x2="290" y2="14" stroke="#9E4640" strokeWidth="3" />
        <path d="M165 140 C160 105 182 88 195 75 C208 88 230 105 225 140 Z" fill="#FDE8DC" stroke="#C96D5D" strokeWidth="1.5" />
        <path d="M355 140 C350 105 372 88 385 75 C398 88 420 105 415 140 Z" fill="#FDE8DC" stroke="#C96D5D" strokeWidth="1.5" />
        <path d="M242 300 L242 195 A48 48 0 0 1 338 195 L338 300 Z" fill="#9E4640" />
        <path d="M254 300 L254 205 A36 36 0 0 1 326 205 L326 300 Z" fill="#471E20" />
        <path d="M165 215 L165 178 A20 20 0 0 1 205 178 L205 215 Z M165 285 L165 242 A20 20 0 0 1 205 242 L205 285 Z" fill="#9E4640" />
        <path d="M375 215 L375 178 A20 20 0 0 1 415 178 L415 215 Z M375 285 L375 242 A20 20 0 0 1 415 242 L415 285 Z" fill="#9E4640" />
        <rect x="0" y="300" width="580" height="24" fill="#FDE8DC" stroke="#9E4640" strokeWidth="1.5" />
      </g>
      <rect x="0" y="425" width="1200" height="75" fill="#266582" />
      <path d="M680 448 L1010 448 M720 468 L970 468" stroke="#F7C9B0" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
    </>
  );
}

function VaranasiVectorScene() {
  return (
    <>
      <defs>
        <linearGradient id="c-vn-sky" x1="0" y1="0" x2="0" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F39C6B" />
          <stop offset="55%" stopColor="#F7C578" />
          <stop offset="100%" stopColor="#FFF3DF" />
        </linearGradient>
      </defs>
      <rect width="1200" height="500" fill="url(#c-vn-sky)" />
      <circle cx="910" cy="165" r="128" fill="#F5B041" opacity="0.35" />
      <circle cx="910" cy="165" r="90" fill="#FFF9E2" />
      <g transform="translate(520, 95)">
        <path d="M120 245 L165 45 L210 245 Z" fill="#B96334" stroke="#FDE8C4" strokeWidth="1.5" />
        <path d="M295 245 L350 20 L405 245 Z" fill="#9C4522" stroke="#FDE8C4" strokeWidth="1.5" />
        <path d="M470 245 L515 65 L560 245 Z" fill="#B96334" stroke="#FDE8C4" strokeWidth="1.5" />
        <rect x="65" y="165" width="540" height="105" fill="#CC6F3D" />
        <rect x="195" y="130" width="280" height="140" fill="#9C4522" />
        <g fill="#4D1F11" stroke="#FDE8C4" strokeWidth="1.5">
          <rect x="220" y="155" width="28" height="44" rx="14" />
          <rect x="270" y="155" width="28" height="44" rx="14" />
          <rect x="320" y="155" width="28" height="44" rx="14" />
          <rect x="370" y="155" width="28" height="44" rx="14" />
          <rect x="420" y="155" width="28" height="44" rx="14" />
        </g>
        <rect x="20" y="270" width="620" height="18" fill="#FDE8C4" />
        <rect x="0" y="288" width="640" height="18" fill="#E59866" />
        <rect x="-20" y="306" width="660" height="20" fill="#CC6F3D" />
      </g>
      <rect x="0" y="420" width="1200" height="80" fill="#1D6B8F" />
      <path d="M620 450 Q690 468 760 450 Z M880 462 Q940 478 1000 462 Z" fill="#4D1F11" />
      <path d="M520 442 L1140 442 M580 475 L1080 475" stroke="#F8D48D" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    </>
  );
}

function UdaipurVectorScene() {
  return (
    <>
      <defs>
        <linearGradient id="c-ud-sky" x1="0" y1="0" x2="0" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F29A76" />
          <stop offset="55%" stopColor="#FAD09C" />
          <stop offset="100%" stopColor="#FFF5E6" />
        </linearGradient>
      </defs>
      <rect width="1200" height="500" fill="url(#c-ud-sky)" />
      <circle cx="870" cy="165" r="125" fill="#F7B277" opacity="0.35" />
      <circle cx="870" cy="165" r="88" fill="#FFF8E5" />
      <path d="M0 385 Q240 275 520 355 Q820 235 1200 345 L1200 500 L0 500 Z" fill="#D4836A" opacity="0.65" />
      <g transform="translate(560, 115)">
        <rect x="60" y="135" width="490" height="165" fill="#E58F6B" />
        <rect x="130" y="85" width="350" height="215" fill="#C85D44" />
        <rect x="205" y="45" width="200" height="255" fill="#FFF0D9" />
        <path d="M130 85 Q165 42 200 85 Z M410 85 Q445 42 480 85 Z" fill="#FFF0D9" />
        <path d="M260 45 Q305 -5 350 45 Z" fill="#C85D44" />
        <g fill="#3D262A">
          <rect x="235" y="75" width="26" height="40" rx="13" />
          <rect x="292" y="75" width="26" height="40" rx="13" />
          <rect x="348" y="75" width="26" height="40" rx="13" />
          <rect x="158" y="135" width="26" height="44" rx="13" />
          <rect x="235" y="135" width="26" height="44" rx="13" />
          <rect x="292" y="135" width="26" height="44" rx="13" />
          <rect x="348" y="135" width="26" height="44" rx="13" />
          <rect x="425" y="135" width="26" height="44" rx="13" />
        </g>
        <rect x="30" y="285" width="550" height="22" fill="#FFF0D9" />
      </g>
      <rect x="0" y="415" width="1200" height="85" fill="#1D6B8F" />
      <path d="M580 445 L1120 445 M650 470 L1040 470" stroke="#80BBD0" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    </>
  );
}

function GoaVectorScene() {
  return (
    <>
      <defs>
        <linearGradient id="c-go-sky" x1="0" y1="0" x2="0" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F4A261" />
          <stop offset="55%" stopColor="#F8CE8B" />
          <stop offset="100%" stopColor="#FFF4E0" />
        </linearGradient>
      </defs>
      <rect width="1200" height="500" fill="url(#c-go-sky)" />
      <circle cx="885" cy="170" r="130" fill="#F6B868" opacity="0.35" />
      <circle cx="885" cy="170" r="92" fill="#FFF9E4" />
      <path d="M420 415 Q640 290 920 340 L1200 325 L1200 430 L420 430 Z" fill="#CE8559" />
      <g transform="translate(620, 125)">
        <rect x="60" y="110" width="170" height="175" fill="#C2593B" />
        <path d="M60 110 L145 35 L230 110 Z" fill="#E08258" />
        <circle cx="145" cy="85" r="16" fill="#FDF0D5" />
        <rect x="125" y="195" width="40" height="90" rx="20" fill="#233D47" />
        <rect x="245" y="155" width="125" height="130" fill="#E08258" />
        <path d="M245 155 L307 105 L370 155 Z" fill="#FDF0D5" />
        <polygon points="435,285 450,75 485,75 500,285" fill="#FDF0D5" />
        <rect x="445" y="52" width="45" height="25" fill="#C2593B" />
        <path d="M445 52 Q467 28 490 52 Z" fill="#233D47" />
      </g>
      <rect x="0" y="410" width="1200" height="90" fill="#1D6B8F" />
      <path d="M480 442 Q600 430 720 442 T960 442 T1160 442" stroke="#94C9D8" strokeWidth="3" fill="none" />
      <g stroke="#1E5549" strokeWidth="7" strokeLinecap="round">
        <path d="M560 415 Q545 330 515 275" fill="none" />
        <path d="M1110 415 Q1125 320 1155 265" fill="none" />
      </g>
      <g fill="#1E5549">
        <ellipse cx="505" cy="275" rx="38" ry="12" transform="rotate(-20 505 275)" />
        <ellipse cx="535" cy="272" rx="38" ry="12" transform="rotate(25 535 272)" />
        <ellipse cx="1140" cy="265" rx="38" ry="12" transform="rotate(-25 1140 265)" />
        <ellipse cx="1170" cy="268" rx="38" ry="12" transform="rotate(20 1170 268)" />
      </g>
    </>
  );
}
