import Link from 'next/link';
import {
  Compass,
  CloudSun,
  MapPin,
  Sparkles,
  ArrowRight,
  Clock,
  Backpack,
  Landmark,
  Coffee,
  Users,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export const metadata = {
  title: 'Tripcraft | Weather-Aware Deterministic Travel Planner',
  description:
    'Generate physically feasible 1-to-7 day itineraries anywhere worldwide using live meteorological forecasts and open spatial data.',
};

const FEATURED_DESTINATIONS = [
  { name: 'Manali', region: 'Himachal Pradesh, India', desc: 'Himalayan valleys & alpine pine walks' },
  { name: 'Jaipur', region: 'Rajasthan, India', desc: 'Historic pink sandstone forts & royal palaces' },
  { name: 'Tokyo', region: 'Japan', desc: 'Metropolitan gardens, shrines & culinary lanes' },
  { name: 'Paris', region: 'France', desc: 'World-renowned art museums & riverside promenades' },
  { name: 'Cape Town', region: 'South Africa', desc: 'Coastal peaks, ocean drives & botanical reserves' },
];

const PERSONAS = [
  {
    title: 'Backpacker',
    icon: Backpack,
    badge: 'High Stamina',
    color: 'from-emerald-500 to-teal-600',
    desc: 'Prioritizes unmissable scenic treks, high-altitude viewpoints, street food hubs, and authentic local bazaars.',
    traits: ['Nature & Outdoors', 'Scenic Viewpoints', 'Bustling Bazaars', 'High Walking Load'],
  },
  {
    title: 'Culture Seeker',
    icon: Landmark,
    badge: 'Curated Heritage',
    color: 'from-amber-500 to-orange-600',
    desc: 'Focuses on architectural heritage, historic forts, royal palaces, archaeological ruins, and premier museums.',
    traits: ['Historic Monuments', 'Art Galleries', 'Museums', 'Architectural Walking'],
  },
  {
    title: 'Comfort Traveller',
    icon: Coffee,
    badge: 'Relaxed Pacing',
    color: 'from-blue-500 to-indigo-600',
    desc: 'Balanced day flows with gentle transit buffers, scenic viewpoints, fine dining, and minimal physical fatigue.',
    traits: ['Accessible Sights', 'Scenic Panoramas', 'Comfortable Transit', 'Zero Rush'],
  },
  {
    title: 'Family',
    icon: Users,
    badge: 'Child-Safe & Inclusive',
    color: 'from-purple-500 to-pink-600',
    desc: 'Strictly screens for kid-friendly botanical gardens, science galleries, interactive parks, and safe paved environments.',
    traits: ['Interactive Science & Parks', 'Paved Walking', 'Safe Indoor Swaps', 'Low Fatigue'],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-orange-600 bg-clip-text text-transparent">
                Tripcraft
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase -mt-1">
                Roamwise Engine
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-orange-600 transition-colors">
              How It Works
            </a>
            <a href="#personas" className="hover:text-orange-600 transition-colors">
              Personas
            </a>
            <a href="#destinations" className="hover:text-orange-600 transition-colors">
              Worldwide Sourcing
            </a>
            <a href="#architecture" className="hover:text-orange-600 transition-colors">
              Engine Philosophy
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/planner"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 px-4 py-2 rounded-lg shadow-sm shadow-orange-600/20 hover:shadow-orange-600/30 transition-all hover:-translate-y-0.5"
            >
              Plan Trip
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(249,115,22,0.12),rgba(255,255,255,0))]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Deterministic Travel Intelligence • Zero LLM Hallucinations
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Weather-aware daily travel plans{' '}
              <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                grounded in reality.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Tripcraft synthesizes physically feasible 1-to-7 day itineraries for any city worldwide. 
              Governed by real-time meteorological forecasts, physical opening hours, spatial proximity clustering, and traveler stamina.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/planner"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 px-7 py-3.5 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all hover:-translate-y-0.5"
              >
                Start Planning Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 px-7 py-3.5 rounded-xl shadow-xs transition-all hover:border-slate-300"
              >
                Sign In to Account
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="text-2xl font-bold text-slate-900">100%</div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">Procedural Worldwide</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="text-2xl font-bold text-slate-900">0</div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">LLM Hallucinations</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="text-2xl font-bold text-slate-900">1–7</div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">Day Weather Horizon</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="text-2xl font-bold text-slate-900">Real-Time</div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">PostgreSQL Persistence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Worldwide Destinations */}
      <section id="destinations" className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600">Universal Coverage</h2>
              <p className="text-2xl font-bold text-slate-900 mt-1">Explore Popular Destinations</p>
            </div>
            <p className="text-sm text-slate-500 max-w-md">
              Powered by OpenStreetMap and Wikipedia GeoSearch. Type any town or metropolis to generate an authentic plan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {FEATURED_DESTINATIONS.map((dest) => (
              <Link
                key={dest.name}
                href={`/planner?city=${encodeURIComponent(dest.name)}`}
                className="group p-4 rounded-xl border border-slate-200/80 hover:border-orange-500/40 bg-slate-50/50 hover:bg-orange-50/20 transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{dest.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 font-medium">{dest.region}</div>
                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {dest.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-slate-700 group-hover:text-orange-600 pt-2 border-t border-slate-200/60">
                  <span>Plan in {dest.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* The 4 Personas */}
      <section id="personas" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600">Tailored Scheduling</h2>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              Four Personas. Four Completely Different Trips.
            </p>
            <p className="text-base text-slate-600 mt-3">
              The same city generates vastly different itineraries based on traveler stamina, interests, and safety tolerances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PERSONAS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${p.color} flex items-center justify-center text-white shadow-md shadow-slate-900/5`}>
                        <Icon className="w-6 h-6 stroke-[2]" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        {p.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{p.title}</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {p.desc}
                    </p>

                    <div className="mt-5 space-y-2">
                      {p.traits.map((trait) => (
                        <div key={trait} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{trait}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/planner?persona=${encodeURIComponent(p.title)}`}
                    className="mt-6 text-center text-xs font-semibold text-slate-700 hover:text-orange-600 py-2.5 rounded-lg bg-slate-50 hover:bg-orange-50 border border-slate-200/60 transition-colors"
                  >
                    Select {p.title}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works & Architecture */}
      <section id="how-it-works" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600">Transparent Logic</h2>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              How the Deterministic Engine Works
            </p>
            <p className="text-base text-slate-600 mt-3">
              Every slot is assigned via verifiable mathematical rules rather than random probabilistic output.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-orange-600" />
                Meteorological Gating
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Queries Open-Meteo for hourly temperature, precipitation sum, and wind speed. 
                Rain triggers outdoor activity culling with indoor museum fallbacks; extreme heat shifts strenuous sightseeing away from afternoon sun.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                Arrival & Slot Math
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Arrivals after 11:30 AM reserve morning slots for transit & check-in; arrivals after 3:00 PM collapse afternoon sightseeing. 
                Opening hours and minimum duration ensure travelers are never sent to closed doors.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-600" />
                Spatial Anchor Clustering
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Pass A anchors each day with a flagship cultural landmark or mountain excursion. 
                Pass B scores remaining candidates by Haversine proximity, preventing chaotic cross-city transit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-tr from-slate-950 via-slate-900 to-orange-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to plan your next journey?
          </h2>
          <p className="mt-4 text-slate-300 text-base max-w-xl mx-auto">
            Choose any city, pick your dates, select your travel persona, and get a feasible itinerary in under 3 seconds.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/planner"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-slate-950 bg-white hover:bg-slate-100 px-8 py-3.5 rounded-xl shadow-lg transition-all hover:scale-105"
            >
              Launch Tripcraft Planner
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 px-8 py-3.5 rounded-xl transition-all"
            >
              Sign In to Save Trips
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center text-white">
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-900">Tripcraft (Roamwise)</span>
            <span className="text-xs text-slate-400">© 2026 GDG Dev Recruitment Task</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
            <a
              href="https://github.com/Japjit-S/Tripcraft"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              GitHub Repository
            </a>
            <Link href="/planner" className="hover:text-slate-900 transition-colors">
              Planner
            </Link>
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
              Dashboard
            </Link>
            <Link href="/login" className="hover:text-slate-900 transition-colors">
              Account Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
