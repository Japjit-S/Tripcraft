"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Clock, Plane, Train, Bus, Compass, Coffee, Baby, Backpack, Navigation } from 'lucide-react';
import { saveTripToStorage, GeneratedTrip } from '@/lib/tripStore';
import { Destination } from '@/lib/types';

const PERSONAS = [
  { id: 'Backpacker', icon: Backpack, title: 'Backpacker', desc: 'Walkable, local food, highly social' },
  { id: 'Culture Seeker', icon: Compass, title: 'Culture Seeker', desc: 'Museums, history, guided walks' },
  { id: 'Comfort Traveller', icon: Coffee, title: 'Comfort', desc: 'Premium, low-friction, scenic' },
  { id: 'Family', icon: Baby, title: 'Family', desc: 'Kid-friendly, more rest time' },
];

const ARRIVAL_MODES = [
  { id: 'flight', icon: Plane, label: 'Flight' },
  { id: 'train', icon: Train, label: 'Train' },
  { id: 'bus', icon: Bus, label: 'Bus' },
];

export default function PlannerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState('');
  const [persona, setPersona] = useState('Culture Seeker');
  const [originCity, setOriginCity] = useState('');
  const [arrivalMode, setArrivalMode] = useState('flight');
  const [arrivalTime, setArrivalTime] = useState('');

  // Autocomplete suggestions state
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteContainerRef.current &&
        !autocompleteContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = destination.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCities(true);
      try {
        const res = await fetch(`/api/destinations/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          setSuggestions(data.results);
          setShowSuggestions(data.results.length > 0);
        }
      } catch {
        // Silently tolerate autocomplete network errors
      } finally {
        setIsSearchingCities(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [destination]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/itineraries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: destination,
          startDate,
          days: Number(duration),
          persona,
          originCity,
          arrivalMode,
          arrivalTime,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to generate itinerary.');
        setIsSubmitting(false);
        return;
      }

      const tripId = `trip-${Date.now()}`;
      const newTrip: GeneratedTrip = {
        id: tripId,
        destination: data.destination.city,
        destinationCoords: {
          lat: data.destination.latitude,
          lon: data.destination.longitude,
        },
        persona: data.persona,
        startDate: data.startDate,
        days: data.days,
        originCity: data.originCity || originCity,
        arrivalMode: (data.arrivalMode as GeneratedTrip['arrivalMode']) || arrivalMode,
        arrivalAt: data.arrivalTime || arrivalTime || '10:00 AM',
        arrivalTime: data.arrivalTime || arrivalTime || '10:00 AM',
        itineraryDays: data.itineraryDays,
        auditLog: data.auditLog,
        warnings: data.warnings,
        feasibilityStatus: data.feasibilityStatus,
      };

      saveTripToStorage(newTrip);
      router.push(`/trip/${tripId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during generation.';
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 lg:px-12">
      <div className="mb-12">
        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">Design your journey.</h1>
        <p className="text-lg text-slate-500 font-medium max-w-2xl">Drop in your details and we'll craft a deeply personalized, weather-aware itinerary in seconds.</p>
      </div>

      {errorMessage && (
        <div className="mb-8 p-5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center gap-3 text-rose-700 font-bold text-sm shadow-sm animate-in fade-in duration-200">
          <span className="text-lg">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Core Logistics */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* Destination & Dates Card */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-8 lg:p-10">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#1d6b8f]/10 flex items-center justify-center text-[#1d6b8f]">1</span>
              Where & When
            </h3>
            
            <div className="space-y-6">
              <div ref={autocompleteContainerRef} className="space-y-2.5 relative">
                <label className="text-sm font-bold text-slate-700 ml-2">Destination City</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 h-6 w-6 text-slate-400" />
                  <input 
                    required
                    value={destination}
                    onChange={e => {
                      setDestination(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    type="text" 
                    placeholder="Where are you heading? (e.g. Jaipur)" 
                    className="w-full pl-14 pr-12 py-4 bg-[#f8f9fc] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1d6b8f]/30 transition-all text-slate-900 font-bold placeholder:font-normal placeholder:text-slate-400 text-lg"
                  />
                  {isSearchingCities && (
                    <div className="absolute right-4 top-5 w-5 h-5 border-2 border-[#1d6b8f]/30 border-t-[#1d6b8f] rounded-full animate-spin"></div>
                  )}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden divide-y divide-slate-50 animate-in fade-in duration-150 max-h-64 overflow-y-auto">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setDestination(s.city);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-5 py-3.5 hover:bg-slate-50 flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1d6b8f]/10 text-[#1d6b8f] flex items-center justify-center font-bold text-xs shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-[#1d6b8f] transition-colors">
                              {s.city}
                            </span>
                            <span className="text-xs text-slate-400 ml-2 font-medium">
                              {[s.admin1, s.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </div>
                        {s.countryCode && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            {s.countryCode}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-700 ml-2">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                    <input 
                      required
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      type="date" 
                      className="w-full pl-12 pr-4 py-4 bg-[#f8f9fc] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1d6b8f]/30 transition-all text-slate-900 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-700 ml-2">Duration (Days)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                    <input 
                      required
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      type="number" 
                      min="1"
                      max="7"
                      placeholder="1-7 days" 
                      className="w-full pl-12 pr-4 py-4 bg-[#f8f9fc] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1d6b8f]/30 transition-all text-slate-900 font-bold placeholder:font-normal placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Arrival Details Card */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-8 lg:p-10">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#1d6b8f]/10 flex items-center justify-center text-[#1d6b8f]">2</span>
              Arrival Details
            </h3>

            <div className="space-y-8">
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700 ml-2">Origin City</label>
                <div className="relative">
                  <Navigation className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <input 
                    required
                    value={originCity}
                    onChange={e => setOriginCity(e.target.value)}
                    type="text" 
                    placeholder="Where are you travelling from?" 
                    className="w-full pl-12 pr-4 py-4 bg-[#f8f9fc] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1d6b8f]/30 transition-all text-slate-900 font-bold placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 ml-2">How are you arriving?</label>
                  <div className="flex gap-3">
                    {ARRIVAL_MODES.map(mode => (
                      <button 
                        key={mode.id}
                        type="button" 
                        onClick={() => setArrivalMode(mode.id)} 
                        className={`flex-1 py-3 flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all ${arrivalMode === mode.id ? 'bg-[#1d6b8f] text-white shadow-md scale-105' : 'bg-[#f8f9fc] text-slate-500 hover:bg-slate-100'}`}
                      >
                        <mode.icon className="w-5 h-5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-700 ml-2">Arrival Time</label>
                  <input 
                    required
                    value={arrivalTime}
                    onChange={e => setArrivalTime(e.target.value)}
                    type="time" 
                    className="w-full px-4 py-4 h-[72px] bg-[#f8f9fc] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1d6b8f]/30 transition-all text-slate-900 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Persona & Submit */}
        <div className="lg:col-span-5 space-y-10">
          
          {/* Persona Card */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-8 lg:p-10">
            <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#1d6b8f]/10 flex items-center justify-center text-[#1d6b8f]">3</span>
              Travel Style
            </h3>
            <p className="text-sm text-slate-500 mb-8 ml-11">This shifts our algorithm to prioritize activities that match your vibe.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PERSONAS.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={`p-5 rounded-3xl cursor-pointer transition-all border-2 ${persona === p.id ? 'border-[#1d6b8f] bg-[#1d6b8f]/5 scale-[1.02]' : 'border-transparent bg-[#f8f9fc] hover:bg-slate-100 hover:scale-[1.02]'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${persona === p.id ? 'bg-[#1d6b8f] text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                    <p.icon className="w-5 h-5" />
                  </div>
                  <h4 className={`font-black text-sm mb-1.5 ${persona === p.id ? 'text-[#1d6b8f]' : 'text-slate-700'}`}>{p.title}</h4>
                  <p className={`text-xs font-medium leading-relaxed ${persona === p.id ? 'text-[#1d6b8f]/80' : 'text-slate-500'}`}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-5 px-6 bg-[#1d6b8f] hover:bg-[#155370] text-white font-black text-lg rounded-full transition-all focus:outline-none focus:ring-4 focus:ring-[#1d6b8f]/30 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3 shadow-lg shadow-[#1d6b8f]/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#1d6b8f]/30"
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                Crafting magic...
              </>
            ) : (
              'Generate Itinerary'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
