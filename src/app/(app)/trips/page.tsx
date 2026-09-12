"use client";

import Link from 'next/link';
import { mockTripsList } from '@/lib/mockData';
import { Calendar, MapPin, Trash2 } from 'lucide-react';

export default function TripsPage() {
  const trips = mockTripsList;

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Trips</h1>
          <p className="text-slate-600">Manage and revisit your saved itineraries.</p>
        </div>
        <Link 
          href="/planner" 
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Plan New Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No trips saved yet</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            You haven't generated any itineraries. Start planning your next adventure to see it here.
          </p>
          <Link 
            href="/planner" 
            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            Create Your First Trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-900">{trip.destination}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {trip.persona}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-slate-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{new Date(trip.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{trip.days} {trip.days === 1 ? 'day' : 'days'}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-between items-center">
                <Link 
                  href={`/trip/${trip.id}`} 
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View Itinerary
                </Link>
                <button 
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  title="Delete Trip"
                  onClick={() => alert('Mock: Delete confirmation dialog would appear here.')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
