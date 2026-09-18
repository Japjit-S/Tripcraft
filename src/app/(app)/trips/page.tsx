"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Trash2,
  Plus,
  Clock,
  Navigation,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import {
  getAllStoredTrips,
  deleteTripFromStorage,
  saveTripToStorage,
  GeneratedTrip,
} from '@/lib/tripStore';
import { mockTripsList, mockJaipurTrip } from '@/lib/mockData';

export default function TripsPage() {
  const [trips, setTrips] = useState<GeneratedTrip[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<GeneratedTrip | null>(null);

  useEffect(() => {
    let stored = getAllStoredTrips();
    // If no trips in storage yet, seed initial mock trip so the user has immediate data
    if (stored.length === 0) {
      const seeded: GeneratedTrip[] = mockTripsList.map((m) => ({
        ...m,
        itineraryDays: m.id === mockJaipurTrip.id ? mockJaipurTrip.itineraryDays : [],
      }));
      seeded.forEach((t) => saveTripToStorage(t));
      stored = seeded;
    }
    setTrips(stored);
    setIsLoaded(true);
  }, []);

  const handleDelete = (trip: GeneratedTrip) => {
    deleteTripFromStorage(trip.id);
    setTrips((prev) => prev.filter((t) => t.id !== trip.id));
    setTripToDelete(null);
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
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Your Journeys</h1>
          <p className="text-slate-500 font-medium">Manage and revisit your crafted itineraries.</p>
        </div>
        <Link 
          href="/planner" 
          className="px-6 py-3 bg-[#1d6b8f] text-white rounded-xl hover:bg-[#155370] transition-all font-bold shadow-md shadow-[#1d6b8f]/20 hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Plan New Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 p-12 sm:p-16 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-[#1d6b8f]/5 text-[#1d6b8f] rounded-full flex items-center justify-center mb-5">
            <MapPin className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">No trips saved yet</h3>
          <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
            You haven't generated any itineraries yet. Start planning your next adventure to see it appear here.
          </p>
          <Link 
            href="/planner" 
            className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold shadow-md hover:-translate-y-0.5"
          >
            Create Your First Trip
          </Link>
        </div>
      ) : (
        /* Dense List View */
        <div className="space-y-4">
          {trips.map((trip) => (
            <Link 
              key={trip.id} 
              href={`/trip/${trip.id}`}
              className="block bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 hover:border-[#1d6b8f]/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all group overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center p-6 gap-6">
                
                {/* Left: Destination & Badge */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-[#1d6b8f] transition-colors">{trip.destination}</h3>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide uppercase bg-[#1d6b8f]/10 text-[#1d6b8f]">
                      {trip.persona}
                    </span>
                    {trip.feasibilityStatus === 'CAUTION' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                        Caution
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{trip.days} {trip.days === 1 ? 'day' : 'days'}</span>
                    </div>
                    {trip.originCity && (
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-slate-400" />
                        <span>From {trip.originCity}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button 
                    type="button"
                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Trip"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTripToDelete(trip);
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#f8f9fc] text-[#1d6b8f] group-hover:bg-[#1d6b8f] group-hover:text-white transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>

              </div>
            </Link>
          ))}
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
            <p className="text-sm text-slate-500 font-medium mb-6">
              Are you sure you want to remove your itinerary for <span className="font-bold text-slate-900">{tripToDelete.destination}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(tripToDelete)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
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

