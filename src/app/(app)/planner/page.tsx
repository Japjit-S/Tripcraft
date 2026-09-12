"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Clock, Plane, Train, Bus, UserCircle } from 'lucide-react';

export default function PlannerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mock submission latency
    setTimeout(() => {
      // Redirect to the mock trip we created
      router.push('/trip/trip-1');
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Plan your next adventure</h1>
        <p className="text-slate-600">Tell us about your trip and we'll generate a weather-aware itinerary for you.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Destination & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Destination City</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Jaipur" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Persona</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <select 
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors appearance-none"
                >
                  <option value="Backpacker">Backpacker</option>
                  <option value="Culture Seeker">Culture Seeker</option>
                  <option value="Comfort Traveller">Comfort Traveller</option>
                  <option value="Family">Family</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input 
                  required
                  type="date" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Duration (Days)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input 
                  required
                  type="number" 
                  min="1"
                  max="7"
                  placeholder="1-7 days" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-6 pt-6"></div>

          <h3 className="text-lg font-medium text-slate-900 mb-4">Arrival Details</h3>
          
          {/* Arrival Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Origin City</label>
              <input 
                required
                type="text" 
                placeholder="Where from?" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Arrival Mode</label>
              <select 
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              >
                <option value="flight">Flight</option>
                <option value="train">Train</option>
                <option value="bus">Bus</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Arrival Time</label>
              <input 
                required
                type="time" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating Itinerary...
                </>
              ) : (
                'Generate Itinerary'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
