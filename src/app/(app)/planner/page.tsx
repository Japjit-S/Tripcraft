"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MapPin,
  Clock,
  Plane,
  Train,
  Bus,
  Compass,
  Coffee,
  Baby,
  Backpack,
  Navigation,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Plus,
  Minus,
  Layers,
  Database,
  CloudSun,
  ShieldCheck,
} from 'lucide-react';
import { saveTripToStorage, GeneratedTrip } from '@/lib/tripStore';
import { Destination } from '@/lib/types';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';

const POPULAR_DESTINATIONS = [
  { name: 'Manali', label: 'Manali, HP' },
  { name: 'Jaipur', label: 'Jaipur, RJ' },
  { name: 'Tokyo', label: 'Tokyo, JP' },
  { name: 'Paris', label: 'Paris, FR' },
  { name: 'Cape Town', label: 'Cape Town, ZA' },
];

const PERSONAS = [
  {
    id: 'Backpacker',
    icon: Backpack,
    title: 'Backpacker',
    badge: 'High Stamina',
    desc: 'Walkable scenic viewpoints, authentic bazaars, and local street eats.',
    color: 'emerald',
    traits: ['Scenic Treks', 'Local Markets', 'Street Food'],
    borderClass: 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/50',
    iconClass: 'bg-emerald-600 text-white',
    badgeClass: 'bg-emerald-100 text-emerald-800',
  },
  {
    id: 'Culture Seeker',
    icon: Compass,
    title: 'Culture Seeker',
    badge: 'Curated Heritage',
    desc: 'Deep architectural heritage, palaces, UNESCO sites, and premier museums.',
    color: 'amber',
    traits: ['Royal Palaces', 'Historic Forts', 'Art & Museums'],
    borderClass: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/50',
    iconClass: 'bg-amber-600 text-white',
    badgeClass: 'bg-amber-100 text-amber-800',
  },
  {
    id: 'Comfort Traveller',
    icon: Coffee,
    title: 'Comfort Traveller',
    badge: 'Relaxed Pacing',
    desc: 'Gentle transit buffers, panoramic viewpoints, fine dining, and zero rush.',
    color: 'blue',
    traits: ['Low Friction', 'Scenic Panoramas', 'Curated Dining'],
    borderClass: 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/50',
    iconClass: 'bg-blue-600 text-white',
    badgeClass: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'Family',
    icon: Baby,
    title: 'Family',
    badge: 'Kid-Friendly',
    desc: 'Paved walkways, interactive science parks, gentle pacing, and low fatigue.',
    color: 'purple',
    traits: ['Child Safe', 'Interactive Parks', 'Frequent Rest Buffers'],
    borderClass: 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-50/50',
    iconClass: 'bg-purple-600 text-white',
    badgeClass: 'bg-purple-100 text-purple-800',
  },
];

const ARRIVAL_MODES = [
  { id: 'flight', icon: Plane, label: 'Flight' },
  { id: 'train', icon: Train, label: 'Train' },
  { id: 'bus', icon: Bus, label: 'Bus' },
];

const DISCOVERY_STAGES = [
  { label: 'Geocoding destination coordinates & administrative perimeter', icon: MapPin },
  { label: 'Querying OpenStreetMap Overpass (18 km radius spatial cluster)', icon: Database },
  { label: 'Wikidata sitelinks & Wikipedia GeoSearch prominence scoring', icon: Layers },
  { label: 'Evaluating Open-Meteo forecast & meteorological feasibility rules', icon: CloudSun },
  { label: 'Running constraint satisfaction & multi-slot temporal allocation', icon: ShieldCheck },
];

function PlannerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL query params once for initial state
  const initialCity = searchParams.get('city') || searchParams.get('destination') || '';
  const initialPersonaParam = searchParams.get('persona');
  const initialPersona =
    initialPersonaParam &&
    PERSONAS.some(
      (p) =>
        p.title.toLowerCase() === initialPersonaParam.toLowerCase() ||
        p.id.toLowerCase() === initialPersonaParam.toLowerCase()
    )
      ? PERSONAS.find(
          (p) =>
            p.title.toLowerCase() === initialPersonaParam.toLowerCase() ||
            p.id.toLowerCase() === initialPersonaParam.toLowerCase()
        )!.id
      : 'Culture Seeker';
  const initialDaysParam = searchParams.get('days') || searchParams.get('duration');
  const initialDays = initialDaysParam
    ? Math.min(7, Math.max(1, parseInt(initialDaysParam, 10) || 3))
    : 3;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  // Form State
  const [destination, setDestination] = useState(initialCity);
  const [selectedCityObj, setSelectedCityObj] = useState<Destination | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [duration, setDuration] = useState<number>(initialDays);
  const [persona, setPersona] = useState(initialPersona);
  const [originCity, setOriginCity] = useState('');
  const [arrivalMode, setArrivalMode] = useState('flight');
  const [arrivalTime, setArrivalTime] = useState('10:00 AM');

  // Autocomplete suggestions state
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const activeSearchQueryRef = useRef<string>('');

  // Quick picks selector helper with race safety
  const handleSelectPopularCity = async (cityName: string) => {
    activeSearchQueryRef.current = cityName;
    setDestination(cityName);
    setIsSearchingCities(true);
    try {
      const res = await fetch(`/api/destinations/search?q=${encodeURIComponent(cityName)}`);
      const data = await res.json();
      if (
        activeSearchQueryRef.current === cityName &&
        data.success &&
        Array.isArray(data.results) &&
        data.results.length > 0
      ) {
        const match = data.results[0];
        setSelectedCityObj(match);
        const display = [match.city, match.admin1, match.countryCode || match.country].filter(Boolean).join(', ');
        setDestination(display);
      }
    } catch {
      // Tolerate network search errors
    } finally {
      if (activeSearchQueryRef.current === cityName) {
        setIsSearchingCities(false);
      }
    }
  };

  // Resolve initial city geocoding in the background if provided via URL
  useEffect(() => {
    if (!initialCity) return;
    let isCurrent = true;
    fetch(`/api/destinations/search?q=${encodeURIComponent(initialCity)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCurrent && data.success && Array.isArray(data.results) && data.results.length > 0) {
          const match = data.results[0];
          setSelectedCityObj(match);
          const display = [match.city, match.admin1, match.countryCode || match.country].filter(Boolean).join(', ');
          setDestination(display);
        }
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [initialCity]);

  // Handle stage timer when submitting
  useEffect(() => {
    if (!isSubmitting) return;

    const interval = setInterval(() => {
      setActiveStageIndex((prev) => (prev < DISCOVERY_STAGES.length - 1 ? prev + 1 : prev));
    }, 2800);

    return () => clearInterval(interval);
  }, [isSubmitting]);

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
    let isCurrent = true;
    const trimmed = destination.trim();
    if (trimmed.length < 2) {
      const resetTimer = setTimeout(() => {
        setSuggestions([]);
        setShowSuggestions(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearchingCities(true);
      try {
        const res = await fetch(`/api/destinations/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (isCurrent && data.success && Array.isArray(data.results)) {
          setSuggestions(data.results);
          setShowSuggestions(data.results.length > 0);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
      } finally {
        if (isCurrent) {
          setIsSearchingCities(false);
        }
      }
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [destination]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setActiveStageIndex(0);

    try {
      const res = await fetch('/api/itineraries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: selectedCityObj?.city || destination,
          cityName: selectedCityObj?.city,
          admin1: selectedCityObj?.admin1,
          country: selectedCityObj?.country,
          countryCode: selectedCityObj?.countryCode,
          latitude: selectedCityObj?.latitude,
          longitude: selectedCityObj?.longitude,
          destinationId: selectedCityObj?.id,
          startDate,
          days: duration,
          persona,
          originCity: originCity || 'Direct Arrival',
          arrivalMode,
          arrivalTime: arrivalTime || '10:00 AM',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to generate itinerary.');
        setIsSubmitting(false);
        return;
      }

      const tripId = `trip-${Date.now()}`;
      const resolvedArtwork = data.artwork || data.destination?.artwork;
      const newTrip: GeneratedTrip = {
        id: tripId,
        destination: data.destination.city,
        destinationId: data.destination.id,
        destinationCountry: data.destination.country,
        destinationCountryCode: data.destination.countryCode,
        destinationAdmin1: data.destination.admin1,
        destinationCoords: {
          lat: data.destination.latitude,
          lon: data.destination.longitude,
        },
        bannerUrl:
          resolvedArtwork?.imageUrl ||
          resolvedArtwork?.assetPath ||
          data.destination.imageUrl,
        artwork: resolvedArtwork,
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

      let finalTripId = tripId;
      try {
        const persistRes = await fetch('/api/itineraries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trip: newTrip }),
        });
        if (persistRes.ok) {
          const persistData = await persistRes.json();
          if (persistData.trip?.id) {
            finalTripId = persistData.trip.id;
            saveTripToStorage(persistData.trip);
          } else {
            saveTripToStorage(newTrip);
          }
        } else {
          saveTripToStorage(newTrip);
        }
      } catch {
        saveTripToStorage(newTrip);
      }

      router.push(`/trip/${finalTripId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during generation.';
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 lg:px-12 relative">
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1d6b8f]/10 text-[#1d6b8f] text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Deterministic Procedural Engine</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3 tracking-tight">
          Design your journey.
        </h1>
        <p className="text-base sm:text-lg text-slate-500 font-medium max-w-2xl">
          Enter your travel logistics and our unified OpenStreetMap + Open-Meteo engine will synthesize a physically validated, 1-to-7 day schedule.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-8 p-5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-3 text-rose-700 font-bold text-sm shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-black">Itinerary Generation Halted</p>
            <p className="text-xs font-medium text-rose-600 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Core Logistics */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* Destination & Dates Card */}
          <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 p-7 lg:p-9">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#1d6b8f]/10 flex items-center justify-center text-[#1d6b8f] font-bold text-sm">
                1
              </span>
              Where & When
            </h3>
            
            <div className="space-y-6">
              {/* Autocomplete Destination City */}
              <div ref={autocompleteContainerRef} className="space-y-2 relative">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  Destination City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <input 
                    required
                    value={destination}
                    onChange={e => {
                      setDestination(e.target.value);
                      setSelectedCityObj(null);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    type="text" 
                    placeholder="Where are you heading? (e.g. Manali, Tokyo, Paris, Cape Town)" 
                    className="w-full pl-12 pr-12 py-3.5 bg-[#f8f9fc] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1d6b8f]/30 border border-transparent focus:border-[#1d6b8f] transition-all text-slate-900 font-bold placeholder:font-normal placeholder:text-slate-400 text-base"
                  />
                  {isSearchingCities && (
                    <div className="absolute right-4 top-4 w-4 h-4 border-2 border-[#1d6b8f]/30 border-t-[#1d6b8f] rounded-full animate-spin"></div>
                  )}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden divide-y divide-slate-50 animate-in fade-in duration-150 max-h-64 overflow-y-auto">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          const display = [s.city, s.admin1, s.countryCode || s.country].filter(Boolean).join(', ');
                          setDestination(display);
                          setSelectedCityObj(s);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-5 py-3 hover:bg-slate-50 flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#1d6b8f]/10 text-[#1d6b8f] flex items-center justify-center font-bold text-xs shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-[#1d6b8f] transition-colors text-sm">
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

                {/* Popular Quick Picks */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 mr-0.5">Quick picks:</span>
                  {POPULAR_DESTINATIONS.map((pop) => (
                    <button
                      key={pop.name}
                      type="button"
                      onClick={() => handleSelectPopularCity(pop.name)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-700 hover:border-orange-200 border border-transparent transition-all cursor-pointer"
                    >
                      {pop.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Date & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                    Start Date
                  </label>
                  <DatePicker 
                    value={startDate}
                    onChange={setStartDate}
                  />
                </div>

                {/* Duration Stepper with Day Capsules */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Duration
                    </label>
                    <span className="text-xs font-black text-[#1d6b8f]">
                      {duration} {duration === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>

                  <div className="bg-[#f8f9fc] rounded-2xl p-2 border border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setDuration((prev) => Math.max(1, prev - 1))}
                      disabled={duration <= 1}
                      className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center shadow-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                      title="Decrease duration"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1.5 px-2">
                      <Clock className="w-4 h-4 text-[#1d6b8f]" />
                      <span className="text-sm font-black text-slate-900">
                        {duration} {duration === 1 ? 'day' : 'days'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDuration((prev) => Math.min(7, prev + 1))}
                      disabled={duration >= 7}
                      className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center shadow-xs disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                      title="Increase duration"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Day Pills 1-7 Quick Selector */}
                  <div className="flex gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          duration === d
                            ? 'bg-[#1d6b8f] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Arrival Logistics Card */}
          <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 p-7 lg:p-9">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#1d6b8f]/10 flex items-center justify-center text-[#1d6b8f] font-bold text-sm">
                2
              </span>
              Transit & Timing Gate
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  Origin City (Optional)
                </label>
                <div className="relative">
                  <Navigation className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <input 
                    value={originCity}
                    onChange={e => setOriginCity(e.target.value)}
                    type="text" 
                    placeholder="Where are you travelling from? (e.g. Delhi, London, Tokyo)" 
                    className="w-full pl-12 pr-4 py-3.5 bg-[#f8f9fc] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1d6b8f]/30 border border-transparent focus:border-[#1d6b8f] transition-all text-slate-900 font-bold placeholder:font-normal placeholder:text-slate-400 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                    Arrival Mode
                  </label>
                  <div className="flex gap-2">
                    {ARRIVAL_MODES.map(mode => (
                      <button 
                        key={mode.id}
                        type="button" 
                        onClick={() => setArrivalMode(mode.id)} 
                        className={`flex-1 py-3 flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all border cursor-pointer ${
                          arrivalMode === mode.id 
                            ? 'bg-[#1d6b8f] border-[#1d6b8f] text-white shadow-md shadow-[#1d6b8f]/20 scale-102 font-bold' 
                            : 'bg-[#f8f9fc] border-slate-100 text-slate-500 hover:bg-slate-100 font-semibold'
                        }`}
                      >
                        <mode.icon className="w-4 h-4" />
                        <span className="text-[11px] uppercase tracking-wider">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                    Arrival Time (Day 1 Slot Gate)
                  </label>
                  <TimePicker 
                    value={arrivalTime}
                    onChange={setArrivalTime}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Persona & Submit */}
        <div className="lg:col-span-5 space-y-10">
          
          {/* Persona Card */}
          <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 p-7 lg:p-9">
            <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#1d6b8f]/10 flex items-center justify-center text-[#1d6b8f] font-bold text-sm">
                3
              </span>
              Travel Persona
            </h3>
            <p className="text-xs text-slate-500 mb-6 ml-11 font-medium">
              Calibrates mathematical weights for endurance, historic prominence, and relaxed pacing.
            </p>
            
            <div className="space-y-3">
              {PERSONAS.map((p) => {
                const isSelected = persona === p.id;
                const Icon = p.icon;

                return (
                  <div 
                    key={p.id}
                    onClick={() => setPersona(p.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border-2 relative overflow-hidden group ${
                      isSelected
                        ? p.borderClass
                        : 'border-slate-100 bg-[#f8f9fc] hover:bg-slate-100/80 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-xs ${
                        isSelected ? p.iconClass : 'bg-white text-slate-500 border border-slate-200'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-black text-sm text-slate-900 tracking-tight">
                            {p.title}
                          </h4>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isSelected ? p.badgeClass : 'bg-slate-200 text-slate-600'
                          }`}>
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed mb-2">
                          {p.desc}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.traits.map((trait) => (
                            <span 
                              key={trait} 
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                isSelected 
                                  ? 'bg-white/80 text-slate-800 border border-slate-200' 
                                  : 'bg-white text-slate-500 border border-slate-100'
                              }`}
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="space-y-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-base rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/30 disabled:opacity-80 disabled:cursor-not-allowed flex justify-center items-center gap-3 shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Synthesizing Physical Itinerary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Synthesize {duration}-Day Itinerary</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] font-medium text-slate-400">
              100% deterministic • OpenStreetMap Overpass (18 km) + Open-Meteo Weather
            </p>
          </div>
        </div>
      </form>

      {/* Animated Overpass Discovery Modal Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <Compass className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Synthesizing Physical Itinerary
                </h3>
                <p className="text-xs font-semibold text-orange-600">
                  {destination || 'Target Destination'} • {duration} Days • {persona}
                </p>
              </div>
            </div>

            {/* Live progress stages */}
            <div className="space-y-3.5 mb-8">
              {DISCOVERY_STAGES.map((st, idx) => {
                const Icon = st.icon;
                const isPassed = idx < activeStageIndex;
                const isCurrent = idx === activeStageIndex;

                return (
                  <div
                    key={st.label}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-orange-50/80 border border-orange-200'
                        : isPassed
                        ? 'bg-slate-50 opacity-80'
                        : 'opacity-40'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 border-2 border-orange-600/30 border-t-orange-600 rounded-full animate-spin"></div>
                      ) : (
                        <Icon className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span
                      className={`text-xs ${
                        isCurrent
                          ? 'font-bold text-slate-900'
                          : isPassed
                          ? 'font-medium text-slate-700 line-through'
                          : 'font-medium text-slate-400'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-600 to-amber-500 h-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(95, ((activeStageIndex + 1) / DISCOVERY_STAGES.length) * 100)}%` }}
              />
            </div>
            <p className="text-center text-[11px] font-semibold text-slate-400 mt-3">
              Zero hallucinated venues. Physically verified spatial coordinates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-transparent py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#1d6b8f]/30 border-t-[#1d6b8f] rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-500">Loading planner...</p>
          </div>
        </div>
      }
    >
      <PlannerForm />
    </Suspense>
  );
}

