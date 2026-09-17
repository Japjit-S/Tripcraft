"use client";

import Link from 'next/link';
import { mockTripsList } from '@/lib/mockData';
import { Calendar, MapPin, Trash2, Plus, Clock, Navigation, ArrowRight } from 'lucide-react';

export default function TripsPage() {
  const trips = mockTripsList;

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
          className="px-6 py-3 bg-[#1d6b8f] text-white rounded-xl hover:bg-[#155370] transition-all font-bold shadow-md shadow-[#1d6b8f]/20 hover:-translate-y-0.5 flex items-center gap-2"
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
            You haven't generated any itineraries. Start planning your next adventure to see it appear here.
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
                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete Trip"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Mock: Delete confirmation dialog would appear here.');
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
    </div>
  );
}
