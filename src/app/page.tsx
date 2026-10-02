import Link from 'next/link';
import Image from 'next/image';
import {
  CloudSun,
  MapPin,
  ArrowRight,
  Clock,
  Layers,
} from 'lucide-react';

export const metadata = {
  title: 'Tripcraft | A better journey begins with a plan that fits',
  description: 'Weather-aware daily travel plans grounded in reality. The modern atlas for your field notes.',
};

const FEATURED_DESTINATIONS = [
  { name: 'Delhi', region: 'Delhi' },
  { name: 'Jaipur', region: 'Rajasthan' },
  { name: 'Mumbai', region: 'Maharashtra' },
  { name: 'Bengaluru', region: 'Karnataka' },
  { name: 'Kochi', region: 'Kerala' },
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

// SVG Mountain / Sun / Fort Illustration for the Hero
const HeroArtwork = () => (
  <div className="relative w-full max-w-lg mx-auto aspect-square opacity-90 pointer-events-none select-none">
    <Image 
      src="/artwork/landing-india-atlas-hero.png" 
      alt=""
      fill 
      sizes="(max-width: 1024px) 100vw, 512px"
      className="object-contain" 
      priority 
    />
  </div>
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-tc-parchment)] text-[var(--color-tc-ink)] flex flex-col font-sans selection:bg-[var(--color-tc-tangerine)] selection:text-white">
      {/* Noise Texture Overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-50 mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-[var(--color-tc-parchment)]/90 backdrop-blur-md border-b border-[var(--color-tc-sage)]/30">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 shrink-0">
              <Image
                src="/artwork/tripcraft-mark.png"
                alt=""
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[var(--color-tc-ink)]">
              Tripcraft
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-[var(--color-tc-ink)]/70 uppercase tracking-widest">
            <a href="#personas" className="hover:text-[var(--color-tc-tangerine)] transition-colors">Personas</a>
              <a href="#how-it-works" className="hover:text-[var(--color-tc-tangerine)] transition-colors">Method</a>
            <a href="#destinations" className="hover:text-[var(--color-tc-tangerine)] transition-colors">Atlas</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-bold uppercase tracking-wider text-[var(--color-tc-ink)] hover:text-[var(--color-tc-tangerine)] px-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/planner"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-tc-cream)] bg-[var(--color-tc-ink)] hover:bg-[var(--color-tc-teal)] px-6 py-3 rounded-full transition-all"
            >
              Plan Trip
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden border-b border-[var(--color-tc-sage)]/30">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10 max-w-2xl">
            

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-[var(--color-tc-ink)] leading-[1.05] tracking-tight">
              A better journey begins with a plan that fits.
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-[var(--color-tc-ink)]/80 leading-relaxed font-medium">
              Tripcraft synthesizes physically feasible 1-to-7 day itineraries across India. 
              Governed by live meteorological forecasts, spatial proximity, and traveler stamina.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/planner"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-tc-cream)] bg-[var(--color-tc-tangerine)] hover:bg-[#e07740] px-8 py-4 rounded-full shadow-[4px_4px_0px_var(--color-tc-ink)] hover:shadow-[2px_2px_0px_var(--color-tc-ink)] hover:translate-y-[2px] hover:translate-x-[2px] transition-all"
              >
                Start Planning
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <HeroArtwork />
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PERSONAS.map((p) => (
              <div
                key={p.title}
                className="bg-[var(--color-tc-parchment)] rounded-2xl p-8 border-2 border-[var(--color-tc-sage)]/40 flex flex-col justify-between group hover:border-[var(--color-tc-ink)] transition-colors"
              >
                  <div>
                    <div className="w-12 h-12 rounded-xl border-2 border-[var(--color-tc-ink)] bg-[var(--color-tc-cream)] flex items-center justify-center mb-6 group-hover:bg-[var(--color-tc-saffron)]/20 transition-colors p-1 relative overflow-hidden shrink-0">
                      <Image
                        src={p.artworkPath}
                        alt=""
                        width={44}
                        height={44}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-tc-teal)] mb-3 block">
                      {p.badge}
                    </span>
                    <h3 className="text-xl font-serif font-bold text-[var(--color-tc-ink)] mb-3">{p.title}</h3>
                    <p className="text-sm text-[var(--color-tc-ink)]/70 leading-relaxed font-medium">
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* How It Works & Architecture */}
      <section id="how-it-works" className="py-24 border-b border-[var(--color-tc-sage)]/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-tc-teal)] mb-4">Transparent Logic</h2>
            <p className="text-4xl font-serif font-bold text-[var(--color-tc-ink)]">
              The Deterministic Engine
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-[var(--color-tc-cream)] border-2 border-[var(--color-tc-sage)]/40">
              <div className="text-3xl font-serif font-bold text-[var(--color-tc-teal)] mb-4">01.</div>
              <h3 className="text-lg font-bold text-[var(--color-tc-ink)] flex items-center gap-2 mb-3">
                <CloudSun className="w-5 h-5" />
                Meteorology
              </h3>
              <p className="text-sm text-[var(--color-tc-ink)]/70 leading-relaxed font-medium">
                Rain triggers outdoor activity culling with indoor museum fallbacks; extreme heat shifts strenuous sightseeing away from afternoon sun.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[var(--color-tc-cream)] border-2 border-[var(--color-tc-sage)]/40">
              <div className="text-3xl font-serif font-bold text-[var(--color-tc-tangerine)] mb-4">02.</div>
              <h3 className="text-lg font-bold text-[var(--color-tc-ink)] flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5" />
                Time Math
              </h3>
              <p className="text-sm text-[var(--color-tc-ink)]/70 leading-relaxed font-medium">
                Arrivals after 11:30 AM reserve morning slots for transit; arrivals after 3:00 PM collapse afternoon sightseeing.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[var(--color-tc-cream)] border-2 border-[var(--color-tc-sage)]/40">
              <div className="text-3xl font-serif font-bold text-[var(--color-tc-saffron)] mb-4">03.</div>
              <h3 className="text-lg font-bold text-[var(--color-tc-ink)] flex items-center gap-2 mb-3">
                <Layers className="w-5 h-5" />
                Spatial Clustering
              </h3>
              <p className="text-sm text-[var(--color-tc-ink)]/70 leading-relaxed font-medium">
                Pass A anchors each day. Pass B scores remaining candidates by Haversine proximity, preventing chaotic cross-city transit.
              </p>
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
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-tc-ink)]/50">Quickstart with these 5 picks:</span>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar">
            {FEATURED_DESTINATIONS.map((dest) => (
              <Link
                key={dest.name}
                href={`/planner?city=${encodeURIComponent(dest.name)}`}
                className="group shrink-0 snap-start flex items-center gap-3 px-6 py-4 rounded-full border-2 border-[var(--color-tc-sage)] hover:border-[var(--color-tc-ink)] bg-[var(--color-tc-parchment)] transition-all hover:bg-[var(--color-tc-saffron)]/10"
              >
                <MapPin className="w-4 h-4 text-[var(--color-tc-teal)]" />
                <span className="font-bold text-[var(--color-tc-ink)] text-sm uppercase tracking-wider">{dest.name}</span>
                <span className="text-[10px] font-bold text-[var(--color-tc-ink)]/50 uppercase tracking-widest hidden sm:inline-block border-l-2 border-[var(--color-tc-sage)] pl-3 ml-1 group-hover:text-[var(--color-tc-ink)]/70">
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
            <Link href="/login" className="hover:text-[var(--color-tc-saffron)] transition-colors">Account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
