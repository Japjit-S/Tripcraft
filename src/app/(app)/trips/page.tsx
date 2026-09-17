"use client";

import Link from 'next/link';
import { mockTripsList } from '@/lib/mockData';
import { Calendar, MapPin, Trash2, Plus, Clock, Navigation } from 'lucide-react';

export default function TripsPage() {
  const trips = mockTripsList;

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 lg:px-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tight">Your Journeys.</h1>
          <p className="text-lg text-slate-500 font-medium">Manage and revisit your crafted itineraries.</p>
        </div>
        <Link 
          href="/planner" 
          className="px-8 py-4 bg-[#1d6b8f] text-white rounded-full hover:bg-[#155370] transition-all font-black shadow-lg shadow-[#1d6b8f]/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1d6b8f]/30 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Plan New Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-16 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-[#1d6b8f]/5 text-[#1d6b8f] rounded-full flex items-center justify-center mb-6">
            <MapPin className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3">No trips saved yet</h3>
          <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
            You haven't generated any itineraries. Start planning your next adventure to see it appear here.
          </p>
          <Link 
            href="/planner" 
            className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all font-black shadow-lg hover:-translate-y-1"
          >
            Create Your First Trip
          </Link>
        </div>
      ) : (
        /* Trips Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all group flex flex-col overflow-hidden relative">
              
              {/* Abstract Banner & Delete Button */}
              <div className="h-28 bg-gradient-to-br from-[#1d6b8f]/10 via-[#1d6b8f]/5 to-transparent relative">
                <button 
                  className="absolute top-4 right-4 w-10 h-10 bg-white/50 hover:bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm backdrop-blur-sm"
                  title="Delete Trip"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Mock: Delete confirmation dialog would appear here.');
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                {/* Floating Map Pin Icon */}
                <div className="absolute -bottom-6 left-6 w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-50">
                  <MapPin className="w-6 h-6 text-[#1d6b8f]" />
                </div>
              </div>
              
              {/* Card Content */}
              <div className="p-6 pt-10 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-2xl font-black text-slate-900">{trip.destination}</h3>
                </div>
                
                <div className="mb-8">
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wide uppercase bg-[#1d6b8f]/10 text-[#1d6b8f]">
                    {trip.persona}
                  </span>
                </div>
                
                <div className="space-y-3.5 text-sm text-slate-500 font-medium mb-10">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{trip.days} {trip.days === 1 ? 'day' : 'days'}</span>
                  </div>
                  {trip.originCity && (
                    <div className="flex items-center gap-3">
                      <Navigation className="w-4 h-4 text-slate-400" />
                      <span>From {trip.originCity}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-auto">
                  <Link 
                    href={`/trip/${trip.id}`} 
                    className="block w-full py-4 bg-[#f8f9fc] text-[#1d6b8f] font-black rounded-xl hover:bg-[#1d6b8f] hover:text-white transition-all text-center"
                  >
                    View Itinerary
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
