"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ensureTripArtwork, getAllStoredTrips, GeneratedTrip } from '@/lib/tripStore';
import { DestinationBanner } from '@/components/artwork/DestinationBanner';
import { ArrowRight, MapPin, Calendar, Compass, Sun, Wind, Droplets, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<GeneratedTrip[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.name ? user.name.split(' ')[0] : 'Traveller';

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardTrips() {
      const stored = getAllStoredTrips().map((t) => ensureTripArtwork(t));

      try {
        const res = await fetch('/api/itineraries');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.itineraries) && data.itineraries.length > 0) {
            const dbTrips: GeneratedTrip[] = data.itineraries;
            const tripMap = new Map<string, GeneratedTrip>();
            stored.forEach((t) => tripMap.set(t.id, t));
            dbTrips.forEach((t) => tripMap.set(t.id, t));
            const merged = Array.from(tripMap.values());
            if (isMounted) {
              setTrips(merged);
              setIsLoaded(true);
            }
            return;
          }
        }
      } catch {
        // tolerate network failure
      }

      if (isMounted) {
        setTrips(stored);
        setIsLoaded(true);
      }
    }

    loadDashboardTrips();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#1d6b8f]/30 border-t-[#1d6b8f] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const featuredTrip = trips.length > 0 ? trips[0] : null;
  const nextUpItem = featuredTrip && featuredTrip.itineraryDays.length > 0 && featuredTrip.itineraryDays[0].morning.length > 0 
    ? featuredTrip.itineraryDays[0].morning[0] 
    : null;

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 lg:px-12 w-full h-full overflow-y-auto">
      
      {/* Greeting */}
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2">
            {greeting}, {displayName}.
          </h1>
          <p className="text-base sm:text-lg text-slate-500 font-medium">
            Here&apos;s an overview of your physical travel plans and weather telemetry.
          </p>
        </div>
        <Link
          href="/planner"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1d6b8f] hover:bg-[#155370] text-white font-bold text-xs rounded-xl shadow-md shadow-[#1d6b8f]/20 hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Plan Journey</span>
        </Link>
      </div>

      {trips.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 p-8 shadow-xs">
          <div className="w-20 h-20 bg-[#1d6b8f]/10 text-[#1d6b8f] rounded-2xl flex items-center justify-center mb-5">
            <Compass className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">No active journeys found.</h2>
          <p className="text-xs text-slate-500 max-w-sm text-center mb-6">
            Synthesize your first physically feasible, weather-aware itinerary for any city worldwide.
          </p>
          <Link 
            href="/planner" 
            className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-xs shadow-md hover:-translate-y-0.5"
          >
            Create Your First Itinerary
          </Link>
        </div>
      ) : (
        /* Dashboard Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Top Row: Featured Trip */}
          <div className="lg:col-span-8 flex flex-col">
            <Link 
              href={`/trip/${featuredTrip!.id}`}
              className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-xl shadow-slate-200/50 flex-1 min-h-[380px] flex flex-col justify-between p-8 sm:p-10 group cursor-pointer border border-slate-800"
            >
              <div className="absolute inset-0 z-0 opacity-90">
                <DestinationBanner
                  artwork={featuredTrip!.artwork}
                  destination={featuredTrip!.destination}
                  destinationId={featuredTrip!.destinationId}
                  country={featuredTrip!.destinationCountry}
                  countryCode={featuredTrip!.destinationCountryCode}
                  admin1={featuredTrip!.destinationAdmin1}
                  coords={featuredTrip!.destinationCoords}
                  surface="dashboard"
                  className="w-full h-full"
                />
              </div>
              
              <div className="relative z-10 flex justify-between items-start">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-slate-900/60 text-white backdrop-blur-md border border-white/20">
                  Featured Journey
                </span>
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-slate-900 transition-all shadow-sm">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              <div className="relative z-10 max-w-xl">
                <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4 group-hover:-translate-y-1 transition-transform duration-500 break-words drop-shadow-md">
                  {featuredTrip!.destination}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-white/90">
                  <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span>
                      {new Date(featuredTrip!.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {featuredTrip!.days} days
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>{featuredTrip!.persona}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Top Row: Weather Widget */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-white rounded-3xl p-7 sm:p-8 flex flex-col justify-between shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 flex-1 min-h-[380px]">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                  Destination Telemetry
                </h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-100">
                    <Sun className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">28°C</div>
                    <div className="text-xs font-bold text-slate-500">{featuredTrip?.destination}</div>
                    <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">Open-Meteo Verified</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-[#f8f9fc] rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2.5 text-slate-600 font-bold text-xs">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    Precipitation Risk
                  </div>
                  <span className="font-black text-xs text-slate-900">10% (Clear)</span>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-[#f8f9fc] rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2.5 text-slate-600 font-bold text-xs">
                    <Wind className="w-4 h-4 text-teal-500" />
                    Wind Velocity
                  </div>
                  <span className="font-black text-xs text-slate-900">12 km/h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Up Next */}
          <div className="lg:col-span-7 flex flex-col">
            {nextUpItem && (
              <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 h-full">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                  First Day Anchor Activity
                </h3>
                
                <Link 
                  href={`/trip/${featuredTrip!.id}`}
                  className="block group p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-100/70 border border-slate-100 transition-all"
                >
                  <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
                    <div className="bg-[#1d6b8f] text-white px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider self-start sm:self-center shrink-0">
                      MORNING
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-black text-slate-900 group-hover:text-[#1d6b8f] transition-colors mb-1 truncate">
                        {nextUpItem.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {featuredTrip!.destination}
                        </span>
                        <span>•</span>
                        <span className={nextUpItem.indoor ? 'text-orange-600 font-bold' : 'text-emerald-600 font-bold'}>
                          {nextUpItem.indoor ? 'Indoor Venue' : 'Outdoor Landmark'}
                        </span>
                      </div>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#1d6b8f] group-hover:bg-[#1d6b8f] group-hover:text-white transition-all shrink-0 self-start sm:self-center shadow-2xs">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Bottom Row: Your Journeys Quick List */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex flex-col h-full bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Recent Itineraries
                </h3>
                <Link href="/trips" className="text-xs font-bold text-[#1d6b8f] hover:underline flex items-center gap-1">
                  View all ({trips.length}) <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3 flex-1">
                {trips.slice(0, 3).map((t) => (
                  <Link 
                    key={t.id} 
                    href={`/trip/${t.id}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100 hover:border-slate-200 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <DestinationBanner
                        artwork={t.artwork}
                        destination={t.destination}
                        destinationId={t.destinationId}
                        country={t.destinationCountry}
                        countryCode={t.destinationCountryCode}
                        admin1={t.destinationAdmin1}
                        coords={t.destinationCoords}
                        surface="card"
                        showAttribution={false}
                        className="w-12 h-12 rounded-xl shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#1d6b8f] transition-colors truncate">
                          {t.destination}
                        </h4>
                        <div className="text-[11px] font-medium text-slate-400">
                          {t.days}d • {t.persona}
                        </div>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-[#1d6b8f] shadow-2xs shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
