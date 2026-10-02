"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Trash2,
  Plus,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import {
  getAllStoredTrips,
  deleteTripFromStorage,
  GeneratedTrip,
} from '@/lib/tripStore';
import Image from 'next/image';
import { formatDestinationDate } from '@/lib/engine/timezone';
import { DestinationBanner } from '@/components/artwork/DestinationBanner';
import { getPersonaArtworkPath } from '@/lib/images';

export default function TripsPage() {
  const [trips, setTrips] = useState<GeneratedTrip[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<GeneratedTrip | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAllTrips() {
      const stored = getAllStoredTrips();

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

    loadAllTrips();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (trip: GeneratedTrip) => {
    deleteTripFromStorage(trip.id);
    setTrips((prev) => prev.filter((t) => t.id !== trip.id));
    setTripToDelete(null);

    try {
      await fetch(`/api/itineraries/${encodeURIComponent(trip.id)}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-transparent">
        <div className="w-8 h-8 border-4 border-[var(--color-tc-sage)] border-t-[var(--color-tc-tangerine)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 lg:px-12 w-full h-full overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 border-b-2 border-[var(--color-tc-ink)] pb-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-tc-tangerine)] mb-2">Saved Journeys</h2>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[var(--color-tc-ink)] tracking-tight">
            The Atlas
          </h1>
        </div>
        <Link
          href="/planner"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-tc-ink)] hover:bg-[var(--color-tc-teal)] text-[var(--color-tc-cream)] font-bold text-xs uppercase tracking-widest rounded-full shadow-[4px_4px_0px_var(--color-tc-sage)] hover:shadow-[2px_2px_0px_var(--color-tc-sage)] hover:translate-y-[2px] hover:translate-x-[2px] transition-all cursor-pointer shrink-0"
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
          <h3 className="text-2xl font-serif font-bold text-[var(--color-tc-ink)] mb-3">No saved trips</h3>
          <p className="text-[var(--color-tc-ink)]/60 max-w-md text-center text-sm font-medium mb-8 leading-relaxed">
            Your atlas is currently empty. Generate a physically feasible itinerary to populate your field notes.
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
        /* Trips Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="group flex flex-col bg-[var(--color-tc-cream)] rounded-2xl border-2 border-[var(--color-tc-sage)]/50 overflow-hidden hover:border-[var(--color-tc-ink)] transition-colors shadow-[4px_4px_0px_rgba(23,60,57,0.05)] hover:shadow-[4px_4px_0px_rgba(23,60,57,0.15)] hover:-translate-y-1 relative"
            >
              {/* Delete Button overlay */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTripToDelete(trip);
                }}
                className="absolute top-3 right-3 z-20 w-8 h-8 bg-[var(--color-tc-cream)]/90 backdrop-blur border border-[var(--color-tc-sage)] text-[var(--color-tc-ink)]/50 hover:text-[#7F1D1D] hover:bg-[#FEF2F2] rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                aria-label="Delete Trip"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <Link href={`/trip/${trip.id}`} className="flex-1 flex flex-col">
                <div className="h-32 bg-[var(--color-tc-parchment)] relative overflow-hidden border-b-2 border-[var(--color-tc-sage)]/50">
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

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-2xl text-[var(--color-tc-ink)] mb-2 truncate">
                      {trip.destination}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-tc-ink)]/70 mb-4">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDestinationDate(trip.startDate, undefined, trip.destinationTimezone)}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-auto border-t border-[var(--color-tc-sage)]/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
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
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-tc-ink)] bg-[var(--color-tc-sage)]/30 px-2 py-1 rounded border border-[var(--color-tc-sage)]/50">
                          {trip.itineraryDays.length} Days
                        </span>
                      </div>
                    <ArrowRight className="w-4 h-4 text-[var(--color-tc-ink)]/30 group-hover:text-[var(--color-tc-tangerine)] transition-colors" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[var(--color-tc-ink)]/40 backdrop-blur-sm"
            onClick={() => setTripToDelete(null)}
          ></div>
          <div className="relative bg-[var(--color-tc-cream)] w-full max-w-sm rounded-2xl shadow-xl border-2 border-[#7F1D1D]/20 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-[#FEF2F2] rounded-full flex items-center justify-center border-2 border-[#FCA5A5] mb-5">
              <AlertTriangle className="w-5 h-5 text-[#7F1D1D]" />
            </div>
            
            <h3 className="text-xl font-serif font-bold text-[var(--color-tc-ink)] mb-2">Delete Field Notes?</h3>
            <p className="text-sm text-[var(--color-tc-ink)]/70 font-medium mb-6 leading-relaxed">
              Are you sure you want to delete the itinerary for <strong className="text-[var(--color-tc-ink)]">{tripToDelete.destination}</strong>? This action cannot be undone.
            </p>
            
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setTripToDelete(null)}
                className="flex-1 py-3 bg-[var(--color-tc-parchment)] border-2 border-[var(--color-tc-sage)] hover:bg-[var(--color-tc-sage)]/20 text-[var(--color-tc-ink)] rounded-xl text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(tripToDelete)}
                className="flex-1 py-3 bg-[#7F1D1D] hover:bg-[#991B1B] text-[var(--color-tc-cream)] rounded-xl text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(127,29,29,0.2)] hover:translate-y-[2px] hover:translate-x-[2px] transition-all cursor-pointer border-2 border-[#7F1D1D]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
