"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ensureTripArtwork, getAllStoredTrips, GeneratedTrip } from '@/lib/tripStore';
import { mockTripsList } from '@/lib/mockData';
import { DestinationBanner } from '@/components/artwork/DestinationBanner';
import { ArrowRight, MapPin, Calendar, Compass, Sun, Wind, Droplets } from 'lucide-react';

export default function DashboardPage() {
  const [trips, setTrips] = useState<GeneratedTrip[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Use a hardcoded time for the greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const userName = 'Japjit'; // Hardcoded as per existing context

  useEffect(() => {
    const timer = setTimeout(() => {
      let stored = getAllStoredTrips();
      if (stored.length === 0) {
        // Seed if empty so the dashboard isn't completely blank on first load
        stored = (mockTripsList as GeneratedTrip[]).map((t) => ensureTripArtwork(t));
      }
      setTrips(stored);
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
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
      <div className="mb-10">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2">
          {greeting}, {userName}.
        </h1>
        <p className="text-lg text-slate-500 font-medium">Here&apos;s what&apos;s happening with your travels.</p>
      </div>

      {trips.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 bg-[#1d6b8f]/5 text-[#1d6b8f] rounded-full flex items-center justify-center mb-6">
            <Compass className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Your next adventure starts here.</h2>
          <Link 
            href="/planner" 
            className="px-8 py-4 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all font-black shadow-lg hover:-translate-y-1"
          >
            Plan a trip
          </Link>
        </div>
      ) : (
        /* Dashboard Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Top Row */}
          <div className="lg:col-span-8 flex flex-col">
            {/* Featured Trip */}
            <Link 
              href={`/trip/${featuredTrip!.id}`}
              className="relative rounded-[2rem] overflow-hidden bg-slate-900 shadow-xl shadow-slate-200/50 flex-1 min-h-[380px] flex flex-col justify-between p-8 sm:p-10 group cursor-pointer border-0"
            >
              <div className="absolute inset-0 z-0">
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
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-white/20 text-white backdrop-blur-md">
                  Upcoming Journey
                </span>
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-slate-900 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              <div className="relative z-10 max-w-xl">
                <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4 group-hover:-translate-y-1 transition-transform duration-500 break-words">
                  {featuredTrip!.destination}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white/70" />
                    <span>
                      {new Date(featuredTrip!.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {featuredTrip!.days} days
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-white/70" />
                    <span>{featuredTrip!.persona}</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="lg:col-span-4 flex flex-col">
            {/* Weather Widget */}
            <div className="bg-white rounded-[2rem] p-8 sm:p-10 flex flex-col justify-between shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex-1 min-h-[380px]">
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Current Conditions</h3>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                    <Sun className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-slate-900 tracking-tight">28°C</div>
                    <div className="text-sm font-bold text-slate-500">Clear and Sunny</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#f8f9fc] rounded-2xl">
                  <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                    <Droplets className="w-5 h-5 text-blue-400" />
                    Humidity
                  </div>
                  <span className="font-black text-slate-900">45%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#f8f9fc] rounded-2xl">
                  <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                    <Wind className="w-5 h-5 text-teal-400" />
                    Wind
                  </div>
                  <span className="font-black text-slate-900">12 km/h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Up Next */}
            {nextUpItem && (
              <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] h-full">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Up Next</h3>
                
                <Link 
                  href={`/trip/${featuredTrip!.id}`}
                  className="block group"
                >
                  <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                    <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-black tracking-widest self-start sm:self-center shrink-0">
                      9:00 AM
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-2xl font-black text-slate-900 group-hover:text-[#1d6b8f] transition-colors mb-2">
                        {nextUpItem.title}
                      </h4>
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {featuredTrip!.destination}</span>
                        <span>·</span>
                        <span className={nextUpItem.indoor ? 'text-orange-500' : 'text-emerald-500'}>{nextUpItem.indoor ? 'Indoor' : 'Outdoor'}</span>
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-[#f8f9fc] flex items-center justify-center text-[#1d6b8f] group-hover:bg-[#1d6b8f] group-hover:text-white transition-all shrink-0 self-start sm:self-center">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 flex flex-col">
            {/* Your Journeys */}
            <div className="flex flex-col h-full pl-0 lg:pl-4 pt-4 lg:pt-0">
              <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Your Journeys</h3>
                <Link href="/trips" className="text-xs font-bold text-[#1d6b8f] hover:text-[#155370] flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-4">
                {trips.slice(0, 2).map(trip => (
                  <Link 
                    key={trip.id} 
                    href={`/trip/${trip.id}`}
                    className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 border border-slate-100 transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
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
                        className="w-14 h-14 rounded-xl shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 text-lg group-hover:text-[#1d6b8f] transition-colors truncate">{trip.destination}</h4>
                        <div className="text-xs font-bold text-slate-500 mt-1">
                          {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {trip.days} days
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-[#f8f9fc] text-slate-500 rounded-md shrink-0">
                      {trip.persona.split(' ')[0]}
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
