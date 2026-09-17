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
    <div className="max-w-3xl mx-auto py-12 px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Plan your next adventure</h1>
        <p className="text-slate-500 font-medium">Tell us about your trip and we'll generate a weather-aware itinerary for you.</p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 p-8 lg:p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Destination & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Destination City</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Jaipur" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-900 font-medium placeholder:font-normal"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Persona</label>
              <div className="relative">
                <UserCircle className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <select 
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors appearance-none text-slate-900 font-medium"
                >
                  <option value="Backpacker">Backpacker</option>
                  <option value="Culture Seeker">Culture Seeker</option>
                  <option value="Comfort Traveller">Comfort Traveller</option>
                  <option value="Family">Family</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <input 
                  required
                  type="date" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Duration (Days)</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <input 
                  required
                  type="number" 
                  min="1"
                  max="7"
                  placeholder="1-7 days" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-900 font-medium placeholder:font-normal"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100"></div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-5">Arrival Details</h3>
            
            {/* Arrival Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Origin City</label>
                <input 
                  required
                  type="text" 
                  placeholder="Where from?" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-900 font-medium placeholder:font-normal"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Arrival Mode</label>
                <select 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-900 font-medium"
                >
                  <option value="flight">Flight</option>
                  <option value="train">Train</option>
                  <option value="bus">Bus</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Arrival Time</label>
                <input 
                  required
                  type="time" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-slate-900 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-sm shadow-blue-200"
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
