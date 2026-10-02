import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  ArrowRight,
} from 'lucide-react';
import LandingHeader from '@/components/layout/LandingHeader';

export const metadata = {
  title: 'Tripcraft | A better journey begins with a plan that fits',
  description: 'Weather-aware daily travel plans grounded in reality. The modern atlas for your field notes.',
};

const FEATURED_DESTINATIONS = [
  { name: 'Delhi', region: 'Delhi' },
  { name: 'Jaipur', region: 'Rajasthan' },
  { name: 'Mumbai', region: 'Maharashtra' },
  { name: 'Bengaluru', region: 'Karnataka' },
];

const PERSONAS = [
  {
    title: 'Backpacker',
    artworkPath: '/artwork/persona-backpacker.png',
    badge: 'High Stamina',
    desc: 'Unmissable scenic treks, viewpoints, and bustling local bazaars.',
  },
  {
    title: 'Culture Seeker',
    artworkPath: '/artwork/persona-culture-seeker.png',
    badge: 'Curated Heritage',
    desc: 'Architectural heritage, royal palaces, and premier museums.',
  },
  {
    title: 'Comfort Traveller',
    artworkPath: '/artwork/persona-comfort-traveller.png',
    badge: 'Relaxed Pacing',
    desc: 'Balanced day flows with gentle transit buffers and scenic panoramas.',
  },
  {
    title: 'Family',
    artworkPath: '/artwork/persona-family.png',
    badge: 'Child-Safe',
    desc: 'Kid-friendly botanical gardens, interactive parks, and low fatigue.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-tc-parchment)] text-[var(--color-tc-ink)] flex flex-col font-sans selection:bg-[var(--color-tc-tangerine)] selection:text-white">
      {/* Noise Texture Overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-50 mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* Navigation */}
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative min-h-[580px] lg:min-h-[640px] xl:min-h-[680px] flex items-center overflow-hidden border-b border-[var(--color-tc-sage)]/30 bg-[var(--color-tc-parchment)]">
        {/* Full-bleed Panoramic India Atlas Hero Artwork */}
        <div className="absolute inset-0 pointer-events-none select-none z-0">
          <Image 
            src="/artwork/landing-india-atlas-hero-v2.png" 
            alt="Tripcraft India Atlas Illustration"
            fill 
            sizes="100vw"
            className="object-cover object-[72%_center] md:object-[80%_center] lg:object-right" 
            priority 
          />
          {/* Ultra-wide left fade to ensure seamless edge blend */}
          <div className="absolute inset-y-0 left-0 w-32 lg:w-48 bg-gradient-to-r from-[var(--color-tc-parchment)] to-transparent pointer-events-none hidden xl:block" />
          {/* Mobile & tablet soft parchment wash to guarantee crisp text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-tc-parchment)] via-[var(--color-tc-parchment)]/85 to-[var(--color-tc-parchment)]/30 lg:to-transparent lg:w-3/5 pointer-events-none" />
        </div>

        {/* Hero Text Content naturally wrapping in the open parchment zone */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 sm:py-20 lg:py-24 w-full">
          <div className="w-full max-w-lg lg:max-w-xl xl:max-w-[540px] lg:-translate-x-10 xl:-translate-x-20 2xl:-translate-x-24">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[var(--color-tc-ink)] leading-[1.08] tracking-tight">
              A better journey begins with a plan that fits.
            </h1>

            <p className="mt-6 sm:mt-8 text-base sm:text-lg lg:text-xl text-[var(--color-tc-ink)]/85 leading-relaxed font-medium">
              Tripcraft synthesizes physically feasible 1-to-7 day itineraries across India. 
              Governed by live meteorological forecasts, spatial proximity, and traveler stamina.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/planner"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-tc-cream)] bg-[var(--color-tc-tangerine)] hover:bg-[#e07740] px-8 py-4 rounded-full shadow-[4px_4px_0px_var(--color-tc-ink)] hover:shadow-[2px_2px_0px_var(--color-tc-ink)] hover:translate-y-[2px] hover:translate-x-[2px] transition-all cursor-pointer"
              >
                Start Planning
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Personas */}
      <section id="personas" className="py-24 bg-[var(--color-tc-cream)] border-b border-[var(--color-tc-sage)]/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-tc-tangerine)] mb-4">Tailored Scheduling</h2>
            <p className="text-4xl font-serif font-bold text-[var(--color-tc-ink)]">
              Four Personas.<br/>Four Distinct Trips.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PERSONAS.map((p) => (
              <Link
                key={p.title}
                href={`/planner?persona=${encodeURIComponent(p.title)}`}
                className="group bg-[var(--color-tc-parchment)] rounded-2xl p-7 border-2 border-[var(--color-tc-sage)]/60 hover:border-[var(--color-tc-ink)] flex flex-col justify-between transition-all duration-300 shadow-[4px_4px_0px_var(--color-tc-sage)]/50 hover:shadow-[6px_6px_0px_var(--color-tc-ink)] hover:-translate-y-1.5 cursor-pointer relative overflow-hidden"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Persona Artwork Showcase Medallion */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-[var(--color-tc-ink)]/15 group-hover:border-[var(--color-tc-ink)] bg-[var(--color-tc-cream)] flex items-center justify-center mb-5 p-2.5 shadow-sm group-hover:shadow-[3px_3px_0px_var(--color-tc-ink)] transition-all duration-300 relative overflow-hidden shrink-0">
                    <Image
                      src={p.artworkPath}
                      alt={p.title}
                      width={104}
                      height={104}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Characteristic Badge */}
                  <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[var(--color-tc-cream)] text-[var(--color-tc-teal)] border border-[var(--color-tc-sage)]/60 group-hover:bg-[var(--color-tc-ink)] group-hover:text-[var(--color-tc-cream)] transition-colors mb-3">
                    {p.badge}
                  </span>

                  {/* Title */}
                  <h3 className="text-xl font-serif font-bold text-[var(--color-tc-ink)] mb-2.5">
                    {p.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-[var(--color-tc-ink)]/75 leading-relaxed font-medium">
                    {p.desc}
                  </p>
                </div>

                {/* Interactive Action Prompt */}
                <div className="mt-6 pt-4 border-t border-[var(--color-tc-sage)]/40 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-tc-tangerine)] group-hover:text-[var(--color-tc-ink)] transition-colors">
                  <span>Plan Itinerary</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works & Architecture */}
      <section id="how-it-works" className="py-24 border-b border-[var(--color-tc-sage)]/30 bg-[var(--color-tc-parchment)]/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-tc-teal)] mb-3">Transparent Logic</h2>
            <p className="text-4xl font-serif font-bold text-[var(--color-tc-ink)]">
              The Deterministic Engine
            </p>
            <p className="mt-4 text-base text-[var(--color-tc-ink)]/70 font-medium max-w-xl">
              Zero hallucinations. Every itinerary day is strictly synthesized through sequential, verifiable computational gates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 01: Meteorology */}
            <div className="group bg-[var(--color-tc-cream)] hover:bg-[#FFFDF9] rounded-2xl p-7 sm:p-8 border-2 border-[var(--color-tc-sage)]/60 hover:border-[var(--color-tc-ink)] shadow-[4px_4px_0px_var(--color-tc-sage)]/50 hover:shadow-[6px_6px_0px_var(--color-tc-ink)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[var(--color-tc-teal)]/10 text-[var(--color-tc-teal)] border border-[var(--color-tc-teal)]/25 mb-2">
                      Gate 01
                    </span>
                    <span className="text-3xl sm:text-4xl font-serif font-black text-[var(--color-tc-ink)] block tracking-tight">
                      01.
                    </span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl border-2 border-[var(--color-tc-teal)]/20 group-hover:border-[var(--color-tc-ink)] bg-[var(--color-tc-cream)] shadow-sm flex items-center justify-center p-2 group-hover:scale-105 group-hover:shadow-[2px_2px_0px_var(--color-tc-ink)] transition-all shrink-0 overflow-hidden">
                    <Image
                      src="/artwork/weather-rain-cloud.png"
                      alt="Weather Gate"
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <h3 className="text-xl font-serif font-bold text-[var(--color-tc-ink)] mb-3">
                  Live Meteorology
                </h3>
                <p className="text-sm text-[var(--color-tc-ink)]/75 leading-relaxed font-medium">
                  Rainfall triggers automatic outdoor culling with indoor museum fallbacks. Extreme heat shifts strenuous trekking away from peak midday sun.
                </p>
              </div>

              {/* Engine Logic Micro-Dossier */}
              <div className="mt-6 pt-4 border-t border-[var(--color-tc-sage)]/40 bg-[var(--color-tc-parchment)]/70 rounded-xl p-3.5 border border-[var(--color-tc-sage)]/30 font-mono text-[11px] text-[var(--color-tc-ink)]/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Precipitation &ge; 25mm</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200">
                    Cull Outdoor
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Peak Heat &gt; 40&deg;C</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
                    Indoor Discovery
                  </span>
                </div>
              </div>
            </div>

            {/* Card 02: Time Math */}
            <div className="group bg-[var(--color-tc-cream)] hover:bg-[#FFFDF9] rounded-2xl p-7 sm:p-8 border-2 border-[var(--color-tc-sage)]/60 hover:border-[var(--color-tc-ink)] shadow-[4px_4px_0px_var(--color-tc-sage)]/50 hover:shadow-[6px_6px_0px_var(--color-tc-ink)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[var(--color-tc-tangerine)]/15 text-[var(--color-tc-tangerine)] border border-[var(--color-tc-tangerine)]/30 mb-2">
                      Gate 02
                    </span>
                    <span className="text-3xl sm:text-4xl font-serif font-black text-[var(--color-tc-ink)] block tracking-tight">
                      02.
                    </span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl border-2 border-[var(--color-tc-tangerine)]/25 group-hover:border-[var(--color-tc-ink)] bg-[var(--color-tc-cream)] shadow-sm flex items-center justify-center p-2 group-hover:scale-105 group-hover:shadow-[2px_2px_0px_var(--color-tc-ink)] transition-all shrink-0 overflow-hidden">
                    <Image
                      src="/artwork/gate-interval-time-math.png"
                      alt="Interval & Time Math Gate"
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <h3 className="text-xl font-serif font-bold text-[var(--color-tc-ink)] mb-3">
                  Interval & Time Math
                </h3>
                <p className="text-sm text-[var(--color-tc-ink)]/75 leading-relaxed font-medium">
                  Deterministic time arithmetic enforces honest travel cadence, arrival transit buffers, and rest pauses after high-fatigue days.
                </p>
              </div>

              {/* Engine Logic Micro-Dossier */}
              <div className="mt-6 pt-4 border-t border-[var(--color-tc-sage)]/40 bg-[var(--color-tc-parchment)]/70 rounded-xl p-3.5 border border-[var(--color-tc-sage)]/30 font-mono text-[11px] text-[var(--color-tc-ink)]/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Landing &gt; 11:30 AM</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
                    Transit Buffer
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Landing &gt; 3:00 PM</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300">
                    Evening Deferral
                  </span>
                </div>
              </div>
            </div>

            {/* Card 03: Spatial Clustering */}
            <div className="group bg-[var(--color-tc-cream)] hover:bg-[#FFFDF9] rounded-2xl p-7 sm:p-8 border-2 border-[var(--color-tc-sage)]/60 hover:border-[var(--color-tc-ink)] shadow-[4px_4px_0px_var(--color-tc-sage)]/50 hover:shadow-[6px_6px_0px_var(--color-tc-ink)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[var(--color-tc-teal)]/15 text-[var(--color-tc-teal)] border border-[var(--color-tc-teal)]/30 mb-2">
                      Gate 03
                    </span>
                    <span className="text-3xl sm:text-4xl font-serif font-black text-[var(--color-tc-ink)] block tracking-tight">
                      03.
                    </span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl border-2 border-[var(--color-tc-teal)]/20 group-hover:border-[var(--color-tc-ink)] bg-[var(--color-tc-cream)] shadow-sm flex items-center justify-center p-2 group-hover:scale-105 group-hover:shadow-[2px_2px_0px_var(--color-tc-ink)] transition-all shrink-0 overflow-hidden">
                    <Image
                      src="/artwork/gate-spatial-clustering.png"
                      alt="Spatial Clustering Gate"
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <h3 className="text-xl font-serif font-bold text-[var(--color-tc-ink)] mb-3">
                  Spatial Clustering
                </h3>
                <p className="text-sm text-[var(--color-tc-ink)]/75 leading-relaxed font-medium">
                  Pass A anchors premier landmarks; Pass B clusters subsequent venues via continuous exponential distance decay, preventing criss-cross transits.
                </p>
              </div>

              {/* Engine Logic Micro-Dossier */}
              <div className="mt-6 pt-4 border-t border-[var(--color-tc-sage)]/40 bg-[var(--color-tc-parchment)]/70 rounded-xl p-3.5 border border-[var(--color-tc-sage)]/30 font-mono text-[11px] text-[var(--color-tc-ink)]/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Pass A Anchor</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                    Primary Hub
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Pass B Cluster</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded border border-teal-200">
                    Proximity Decay
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations (Typographic Treatment) */}
      <section id="destinations" className="py-24 bg-[var(--color-tc-cream)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b-2 border-[var(--color-tc-ink)] pb-8">
            <div className="max-w-xl">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-tc-tangerine)] mb-4">Subcontinental Coverage</h2>
              <p className="text-3xl font-serif font-bold text-[var(--color-tc-ink)]">
                The Indian Atlas is Open
              </p>
            </div>
            <p className="text-sm text-[var(--color-tc-ink)]/70 font-medium max-w-sm md:text-right">
              Powered by OpenStreetMap. Type any Indian city, town, or district to generate an authentic plan.
            </p>
          </div>

          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-tc-ink)]/50">Quickstart with these 4 picks:</span>
          </div>
          <div className="flex md:grid md:grid-cols-4 overflow-x-auto md:overflow-visible gap-3 sm:gap-4 pb-4 md:pb-0 snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {FEATURED_DESTINATIONS.map((dest) => (
              <Link
                key={dest.name}
                href={`/planner?city=${encodeURIComponent(dest.name)}`}
                className="group shrink-0 md:shrink snap-start flex items-center justify-between sm:justify-start gap-3 px-5 py-3.5 rounded-full border-2 border-[var(--color-tc-sage)] hover:border-[var(--color-tc-ink)] bg-[var(--color-tc-parchment)] transition-all hover:bg-[var(--color-tc-saffron)]/10"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin className="w-4 h-4 text-[var(--color-tc-teal)] shrink-0" />
                  <span className="font-bold text-[var(--color-tc-ink)] text-sm uppercase tracking-wider truncate">{dest.name}</span>
                </div>
                <span className="text-[10px] font-bold text-[var(--color-tc-ink)]/50 uppercase tracking-widest hidden sm:inline-block border-l-2 border-[var(--color-tc-sage)] pl-3 ml-auto group-hover:text-[var(--color-tc-ink)]/70 shrink-0">
                  {dest.region}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--color-tc-ink)] text-[var(--color-tc-parchment)] py-16 border-t border-[var(--color-tc-sage)]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 shrink-0">
              <Image
                src="/artwork/tripcraft-mark.png"
                alt=""
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-serif text-lg font-bold text-[var(--color-tc-parchment)]">Tripcraft</span>
          </div>

          <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-[var(--color-tc-parchment)]/60">
            <Link href="/planner" className="hover:text-[var(--color-tc-saffron)] transition-colors">Planner</Link>
            <Link href="/dashboard" className="hover:text-[var(--color-tc-saffron)] transition-colors">Dashboard</Link>
            <Link href="/trips" className="hover:text-[var(--color-tc-saffron)] transition-colors">Saved Trips</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
