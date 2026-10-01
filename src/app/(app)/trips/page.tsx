"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Trash2,
  Plus,
  Clock,
  Navigation,
  ArrowRight,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import {
  getAllStoredTrips,
  deleteTripFromStorage,
  GeneratedTrip,
} from '@/lib/tripStore';
import { DestinationBanner } from '@/components/artwork/DestinationBanner';

const PERSONA_PILL_STYLES: Record<string, string> = {
  Backpacker: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Culture Seeker': 'bg-amber-50 text-amber-700 border-amber-200',
  'Comfort Traveller': 'bg-blue-50 text-blue-700 border-blue-200',
  Family: 'bg-purple-50 text-purple-700 border-purple-200',
};

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
      <div className="max-w-5xl mx-auto py-16 px-4 flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#1d6b8f]/30 border-t-[#1d6b8f] rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500">Loading your journeys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 lg:px-12 w-full h-full overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-1 tracking-tight">Your Journeys</h1>
          <p className="text-sm font-medium text-slate-500">
            Revisit and manage all your physically validated travel itineraries ({trips.length}).
          </p>
        </div>
        <Link 
          href="/planner" 
          className="px-5 py-3 bg-[#1d6b8f] text-white rounded-2xl hover:bg-[#155370] transition-all font-bold text-xs shadow-md shadow-[#1d6b8f]/20 hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Plan New Journey</span>
        </Link>
      </div>

      {trips.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 p-12 sm:p-16 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-[#1d6b8f]/10 text-[#1d6b8f] rounded-2xl flex items-center justify-center mb-5">
            <Compass className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">No itineraries saved yet</h3>
          <p className="text-slate-500 font-medium text-xs mb-6 max-w-md mx-auto">
            You haven&apos;t generated any travel itineraries yet. Launch the planner to generate your first physical schedule.
          </p>
          <Link 
            href="/planner" 
            className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-xs shadow-md hover:-translate-y-0.5"
          >
            Create Your First Trip
          </Link>
        </div>
      ) : (
        /* Responsive Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trips.map((trip) => {
            const pillStyle =
              PERSONA_PILL_STYLES[trip.persona] ||
              'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div 
                key={trip.id} 
                className="bg-white rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-slate-100 hover:border-[#1d6b8f]/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all group overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Top Thumbnail Banner */}
                  <Link href={`/trip/${trip.id}`} className="block relative h-48 w-full overflow-hidden bg-slate-900">
                    <DestinationBanner
                      artwork={trip.artwork}
                      destination={trip.destination}
                      destinationId={trip.destinationId}
                      country={trip.destinationCountry}
                      countryCode={trip.destinationCountryCode}
                      admin1={trip.destinationAdmin1}
                      coords={trip.destinationCoords}
                      surface="card"
                      showAttribution={false}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay & Badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-between p-4 z-10 pointer-events-none">
                      <div className="flex justify-between items-start">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide uppercase border backdrop-blur-md ${pillStyle}`}>
                          {trip.persona}
                        </span>
                        {trip.feasibilityStatus === 'CAUTION' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                            <AlertTriangle className="w-3 h-3" /> Caution
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                          {trip.destination}
                        </h3>
                        <p className="text-xs text-white/80 font-medium">
                          {[trip.destinationAdmin1, trip.destinationCountry].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(trip.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{trip.days} {trip.days === 1 ? 'day' : 'days'}</span>
                      </div>
                      {trip.originCity && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Navigation className="w-3.5 h-3.5 text-slate-400" />
                          <span>From {trip.originCity}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 pb-5 pt-0 flex items-center justify-between border-t border-slate-100 pt-4">
                  <button 
                    type="button"
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Itinerary"
                    onClick={(e) => {
                      e.preventDefault();
                      setTripToDelete(trip);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link
                    href={`/trip/${trip.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-[#1d6b8f] text-white text-xs font-bold rounded-xl transition-all shadow-xs group-hover:bg-[#1d6b8f]"
                  >
                    <span>View Itinerary</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Delete Itinerary?</h3>
            <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
              Are you sure you want to remove your itinerary for <span className="font-bold text-slate-900">{tripToDelete.destination}</span>? This will remove all day schedules and notes.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(tripToDelete)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
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
