"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ensureTripArtwork, getAllStoredTrips, GeneratedTrip } from '@/lib/tripStore';
import { ArrowRight, Calendar, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatDestinationDate } from '@/lib/engine/timezone';
import { DestinationBanner } from '@/components/artwork/DestinationBanner';
import { getPersonaArtworkPath } from '@/lib/images';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = useState<GeneratedTrip[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.name ? user.name.split(' ')[0] : 'Explorer';

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
        <div className="w-8 h-8 border-4 border-[var(--color-tc-sage)] border-t-[var(--color-tc-tangerine)] rounded-full animate-spin"></div>
      </div>
    );
  }

  const featuredTrip = trips.length > 0 ? trips[0] : null;

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 lg:px-12 w-full h-full overflow-y-auto">
      
      {/* Greeting */}
      <div className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b-2 border-[var(--color-tc-ink)] pb-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-tc-tangerine)] mb-2">My Home</h2>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[var(--color-tc-ink)] tracking-tight">
            {greeting}, {displayName}.
          </h1>
          <p className="text-base text-[var(--color-tc-ink)]/70 font-medium mt-3 max-w-xl">
            Welcome to your atlas. Here is your upcoming travel dossier and recent field notes.
          </p>
        </div>
        <Link
          href="/planner"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-tc-ink)] hover:bg-[var(--color-tc-teal)] text-[var(--color-tc-cream)] font-bold text-xs uppercase tracking-widest rounded-full shadow-[4px_4px_0px_var(--color-tc-sage)] hover:shadow-[2px_2px_0px_var(--color-tc-sage)] hover:translate-y-[2px] hover:translate-x-[2px] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Expedition</span>
        </Link>
      </div>

      {trips.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-[var(--color-tc-cream)] rounded-3xl border-2 border-[var(--color-tc-sage)]/50 shadow-[8px_8px_0px_rgba(23,60,57,0.05)] px-6">
          <div className="relative w-48 h-32 sm:w-64 sm:h-40 mb-6 rounded-2xl overflow-hidden border-2 border-[var(--color-tc-sage)]/60 bg-[var(--color-tc-parchment)] shadow-xs">
            <Image
              src="/artwork/landing-india-atlas-hero.png"
              alt="Tripcraft India Atlas"
              fill
              sizes="(max-width: 640px) 192px, 256px"
              className="object-cover object-center opacity-85"
            />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[var(--color-tc-ink)] mb-3">The atlas is empty</h3>
          <p className="text-[var(--color-tc-ink)]/60 max-w-md text-center text-sm font-medium mb-8 leading-relaxed">
            You haven&apos;t charted any journeys yet. Build your first physical itinerary governed by live meteorology.
          </p>
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-tc-tangerine)] hover:bg-[#e07740] text-[var(--color-tc-cream)] font-bold text-xs uppercase tracking-widest rounded-full shadow-[4px_4px_0px_var(--color-tc-ink)] hover:shadow-[2px_2px_0px_var(--color-tc-ink)] hover:translate-y-[2px] hover:translate-x-[2px] transition-all cursor-pointer"
          >
            <span>Start Planning</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Featured Trip */}
          {featuredTrip && (
            <div className="relative group cursor-pointer" onClick={() => router.push(`/trip/${featuredTrip.id}`)}>
              <div className="absolute -inset-4 rounded-3xl border-2 border-transparent group-hover:border-[var(--color-tc-sage)] transition-colors"></div>
              <div className="relative bg-[var(--color-tc-cream)] rounded-2xl border-2 border-[var(--color-tc-sage)]/50 shadow-[8px_8px_0px_rgba(23,60,57,0.05)] overflow-hidden flex flex-col md:flex-row">
                
                {/* Visual Area */}
                <div className="md:w-1/3 relative min-h-[220px] md:h-auto border-b-2 md:border-b-0 md:border-r-2 border-[var(--color-tc-sage)]/50 bg-[var(--color-tc-parchment)] overflow-hidden">
                  <DestinationBanner
                    artwork={featuredTrip.artwork}
                    destination={featuredTrip.destination}
                    destinationId={featuredTrip.destinationId}
                    country={featuredTrip.destinationCountry}
                    countryCode={featuredTrip.destinationCountryCode}
                    admin1={featuredTrip.destinationAdmin1}
                    coords={featuredTrip.destinationCoords}
                    surface="dashboard"
                    className="w-full h-full min-h-[220px]"
                  />
                  <div className="absolute top-4 left-4 z-20 bg-[var(--color-tc-ink)] text-[var(--color-tc-cream)] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                    Next Expedition
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-8 md:w-2/3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative w-5 h-5 shrink-0">
                        <Image
                          src={getPersonaArtworkPath(featuredTrip.persona)}
                          alt=""
                          width={20}
                          height={20}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[var(--color-tc-teal)] uppercase tracking-widest">{featuredTrip.persona} Persona</span>
                      <span className="w-1 h-1 rounded-full bg-[var(--color-tc-sage)]"></span>
                      <span className="text-[10px] font-bold text-[var(--color-tc-ink)]/50 uppercase tracking-widest">{featuredTrip.itineraryDays.length} Days</span>
                    </div>
                    <h3 className="text-3xl font-serif font-bold text-[var(--color-tc-ink)] mb-2">{featuredTrip.destination}</h3>
                    
                    <div className="flex items-center gap-2 text-sm text-[var(--color-tc-ink)]/70 font-medium mb-8">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDestinationDate(featuredTrip.startDate, undefined, featuredTrip.destinationTimezone)}</span>
                      <span>—</span>
                      
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-6 border-t-2 border-[var(--color-tc-sage)]/30 border-dashed">
                    <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-tc-ink)]/50">
                      View full dossier
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[var(--color-tc-parchment)] border-2 border-[var(--color-tc-sage)] flex items-center justify-center group-hover:bg-[var(--color-tc-tangerine)] group-hover:border-[var(--color-tc-tangerine)] transition-colors">
                      <ArrowRight className="w-4 h-4 text-[var(--color-tc-ink)] group-hover:text-[var(--color-tc-cream)]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Trips Grid */}
          {trips.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-8 border-b-2 border-[var(--color-tc-sage)]/50 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-tc-ink)]">Archived Field Notes</h3>
                <Link href="/trips" className="text-xs font-bold uppercase tracking-widest text-[var(--color-tc-teal)] hover:text-[var(--color-tc-ink)] transition-colors">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.slice(1, 4).map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/trip/${trip.id}`}
                    className="group flex flex-col bg-[var(--color-tc-cream)] rounded-2xl border-2 border-[var(--color-tc-sage)]/50 overflow-hidden hover:border-[var(--color-tc-ink)] transition-colors shadow-[4px_4px_0px_rgba(23,60,57,0.05)] hover:shadow-[4px_4px_0px_rgba(23,60,57,0.15)] hover:-translate-y-1"
                  >
                    <div className="h-24 bg-[var(--color-tc-parchment)] relative overflow-hidden border-b-2 border-[var(--color-tc-sage)]/50">
                      <DestinationBanner
                        artwork={trip.artwork}
                        destination={trip.destination}
                        destinationId={trip.destinationId}
                        country={trip.destinationCountry}
                        countryCode={trip.destinationCountryCode}
                        admin1={trip.destinationAdmin1}
                        coords={trip.destinationCoords}
                        surface="card"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="p-5">
                      <h4 className="font-serif font-bold text-xl text-[var(--color-tc-ink)] mb-1 truncate">{trip.destination}</h4>
                      <p className="text-xs text-[var(--color-tc-ink)]/60 font-medium">
                        {formatDestinationDate(trip.startDate, undefined, trip.destinationTimezone)}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                         <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-tc-teal)] bg-[var(--color-tc-teal)]/10 px-2 py-1 rounded">
                           <div className="relative w-3.5 h-3.5 shrink-0">
                             <Image
                               src={getPersonaArtworkPath(trip.persona)}
                               alt=""
                               width={14}
                               height={14}
                               className="w-full h-full object-contain"
                             />
                           </div>
                           {trip.persona}
                         </span>
                         <ArrowRight className="w-4 h-4 text-[var(--color-tc-ink)]/30 group-hover:text-[var(--color-tc-ink)] transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
