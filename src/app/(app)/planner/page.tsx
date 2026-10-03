"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
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
  Sparkles,
  AlertCircle,
  Plus,
  Minus,
  ArrowRight,
} from 'lucide-react';
import { saveTripToStorage, GeneratedTrip } from '@/lib/tripStore';
import { Destination } from '@/lib/types';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';

const POPULAR_DESTINATIONS = [
  { name: 'Delhi', label: 'Delhi, DL' },
  { name: 'Jaipur', label: 'Jaipur, RJ' },
  { name: 'Mumbai', label: 'Mumbai, MH' },
  { name: 'Bengaluru', label: 'Bengaluru, KA' },
  { name: 'Kochi', label: 'Kochi, KL' },
];

const PERSONAS = [
  {
    id: 'Backpacker',
    icon: Backpack,
    artworkPath: '/artwork/persona-backpacker.png',
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
    artworkPath: '/artwork/persona-culture-seeker.png',
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
    artworkPath: '/artwork/persona-comfort-traveller.png',
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
    artworkPath: '/artwork/persona-family.png',
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
        } else if (isCurrent) {
          setErrorMessage('Tripcraft currently plans destinations within India.');
        }
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [initialCity]);

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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-tc-ink)]/10 text-[var(--color-tc-ink)] text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curated Journey Planner</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-[var(--color-tc-ink)] mb-3 tracking-tight">
          Design your journey.
        </h1>
        <p className="text-base sm:text-lg text-[var(--color-tc-ink)]/75 font-medium max-w-2xl">
          Enter your travel details to create a handcrafted, weather-aware 1-to-7 day journey across India.
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

      <form onSubmit={handleSubmit} className="space-y-8 lg:space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Column: Core Logistics */}
          <div className="lg:col-span-7 flex flex-col gap-8 lg:gap-10">
          
          {/* Destination & Dates Card */}
          <div className="bg-[var(--color-tc-cream)] rounded-3xl shadow-[8px_8px_0px_rgba(23,60,57,0.05)] border-2 border-[var(--color-tc-sage)]/50 p-7 lg:p-9">
            <h3 className="text-2xl font-bold font-serif text-[var(--color-tc-ink)] mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[var(--color-tc-ink)] flex items-center justify-center text-white font-bold font-serif text-sm shadow-xs">
                1
              </span>
              Where & When
            </h3>
            
            <div className="space-y-6">
              {/* Autocomplete Destination City */}
              <div ref={autocompleteContainerRef} className="space-y-2 relative">
                <label className="text-xs font-bold font-serif uppercase tracking-wider text-[var(--color-tc-ink)]/80 ml-1">
                  Destination City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-[var(--color-tc-ink)]/50" />
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
                    placeholder="Where are you heading? (e.g. Delhi, Jaipur, Mumbai, Bengaluru)" 
                    className="w-full pl-12 pr-12 py-3.5 bg-[var(--color-tc-parchment)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-tc-ink)]/20 border border-[var(--color-tc-sage)]/60 focus:border-[var(--color-tc-ink)] focus:bg-white transition-all text-[var(--color-tc-ink)] font-bold placeholder:font-normal placeholder:text-[var(--color-tc-ink)]/40 text-base"
                  />
                  {isSearchingCities && (
                    <div className="absolute right-4 top-4 w-4 h-4 border-2 border-[var(--color-tc-ink)]/30 border-t-[var(--color-tc-ink)] rounded-full animate-spin"></div>
                  )}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-[var(--color-tc-cream)] rounded-2xl shadow-xl border-2 border-[var(--color-tc-sage)]/60 z-50 overflow-hidden divide-y divide-[var(--color-tc-sage)]/20 animate-in fade-in duration-150 max-h-64 overflow-y-auto">
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
                        className="w-full text-left px-5 py-3 hover:bg-[var(--color-tc-parchment)]/70 flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[var(--color-tc-ink)]/10 text-[var(--color-tc-ink)] flex items-center justify-center font-bold text-xs shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-[var(--color-tc-ink)] group-hover:text-[var(--color-tc-ink)] transition-colors text-sm">
                              {s.city}
                            </span>
                            <span className="text-xs text-slate-400 ml-2 font-medium">
                              {[s.admin1, s.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </div>
                        {s.countryCode && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-[var(--color-tc-sage)]/30 text-[var(--color-tc-ink)] rounded-md">
                            {s.countryCode}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular Quick Picks */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-[var(--color-tc-ink)]/60 mr-0.5">Quick picks:</span>
                  {POPULAR_DESTINATIONS.map((pop) => (
                    <button
                      key={pop.name}
                      type="button"
                      onClick={() => handleSelectPopularCity(pop.name)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--color-tc-parchment)] hover:bg-[var(--color-tc-sage)]/30 text-[var(--color-tc-ink)]/80 hover:text-[var(--color-tc-ink)] hover:border-[var(--color-tc-ink)]/40 border border-[var(--color-tc-sage)]/50 transition-all cursor-pointer"
                    >
                      {pop.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Date & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold font-serif uppercase tracking-wider text-[var(--color-tc-ink)]/80 ml-1">
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
                    <label className="text-xs font-bold font-serif uppercase tracking-wider text-[var(--color-tc-ink)]/80">
                      Duration
                    </label>
                    <span className="text-xs font-bold font-serif text-[var(--color-tc-ink)]">
                      {duration} {duration === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>

                  <div className="bg-[var(--color-tc-parchment)] rounded-2xl p-2 border border-[var(--color-tc-sage)]/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setDuration((prev) => Math.max(1, prev - 1))}
                      disabled={duration <= 1}
                      className="w-10 h-10 rounded-xl bg-[var(--color-tc-cream)] text-[var(--color-tc-ink)] hover:text-[var(--color-tc-ink)] hover:bg-white flex items-center justify-center shadow-xs border border-[var(--color-tc-sage)]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                      title="Decrease duration"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1.5 px-2">
                      <Clock className="w-4 h-4 text-[var(--color-tc-ink)]" />
                      <span className="text-sm font-serif font-bold text-[var(--color-tc-ink)]">
                        {duration} {duration === 1 ? 'day' : 'days'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDuration((prev) => Math.min(7, prev + 1))}
                      disabled={duration >= 7}
                      className="w-10 h-10 rounded-xl bg-[var(--color-tc-cream)] text-[var(--color-tc-ink)] hover:text-[var(--color-tc-ink)] hover:bg-white flex items-center justify-center shadow-xs border border-[var(--color-tc-sage)]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                            ? 'bg-[var(--color-tc-ink)] text-white shadow-xs'
                            : 'bg-[var(--color-tc-parchment)] text-[var(--color-tc-ink)]/70 hover:bg-[var(--color-tc-sage)]/30 hover:text-[var(--color-tc-ink)] border border-[var(--color-tc-sage)]/40'
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
          <div className="bg-[var(--color-tc-cream)] rounded-3xl shadow-[8px_8px_0px_rgba(23,60,57,0.05)] border-2 border-[var(--color-tc-sage)]/50 p-7 lg:p-9 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold font-serif text-[var(--color-tc-ink)] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[var(--color-tc-ink)] flex items-center justify-center text-white font-bold font-serif text-sm shadow-xs">
                  2
                </span>
                Transit & Timing Gate
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold font-serif uppercase tracking-wider text-[var(--color-tc-ink)]/80 ml-1">
                    Origin City (Optional)
                  </label>
                  <div className="relative">
                    <Navigation className="absolute left-4 top-3.5 h-5 w-5 text-[var(--color-tc-ink)]/50" />
                    <input 
                      value={originCity}
                      onChange={e => setOriginCity(e.target.value)}
                      type="text" 
                      placeholder="Where are you travelling from? (e.g. Delhi, London, Tokyo)" 
                      className="w-full pl-12 pr-4 py-3.5 bg-[var(--color-tc-parchment)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-tc-ink)]/20 border border-[var(--color-tc-sage)]/60 focus:border-[var(--color-tc-ink)] focus:bg-white transition-all text-[var(--color-tc-ink)] font-bold placeholder:font-normal placeholder:text-[var(--color-tc-ink)]/40 text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold font-serif uppercase tracking-wider text-[var(--color-tc-ink)]/80 ml-1">
                      Arrival Mode
                    </label>
                    <div className="flex gap-2">
                      {ARRIVAL_MODES.map(mode => (
                        <button 
                          key={mode.id}
                          type="button" 
                          onClick={() => setArrivalMode(mode.id)} 
                          className={`flex-1 py-3 flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all border-2 cursor-pointer ${
                            arrivalMode === mode.id 
                              ? 'bg-[var(--color-tc-ink)] border-[var(--color-tc-ink)] text-white shadow-md shadow-[var(--color-tc-ink)]/20 scale-102 font-bold' 
                              : 'bg-[var(--color-tc-parchment)] border-[var(--color-tc-sage)]/50 text-[var(--color-tc-ink)]/70 hover:bg-[var(--color-tc-sage)]/20 hover:text-[var(--color-tc-ink)] hover:border-[var(--color-tc-sage)] font-semibold'
                          }`}
                        >
                          <mode.icon className="w-4 h-4" />
                          <span className="text-[11px] uppercase tracking-wider">{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold font-serif uppercase tracking-wider text-[var(--color-tc-ink)]/80 ml-1">
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

            {/* Smart Timing Gate Guidance Note */}
            <div className="mt-8 pt-5 border-t border-[var(--color-tc-sage)]/40 flex items-start gap-3.5 text-xs text-[var(--color-tc-ink)]/75 font-medium">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-tc-parchment)] border border-[var(--color-tc-sage)]/60 flex items-center justify-center shrink-0 text-[var(--color-tc-teal)] mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <p className="leading-relaxed">
                <strong className="text-[var(--color-tc-ink)] font-bold">Dynamic Slot Gating:</strong> Arrival times before 1:00 PM unlock full afternoon anchors. Evening arrivals automatically defer primary sights to Day 2 for effortless pacing.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Persona */}
        <div className="lg:col-span-5 flex flex-col">
          {/* Persona Card */}
          <div className="bg-[var(--color-tc-cream)] rounded-3xl shadow-[8px_8px_0px_rgba(23,60,57,0.05)] border-2 border-[var(--color-tc-sage)]/50 p-7 lg:p-9 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold font-serif text-[var(--color-tc-ink)] mb-1 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[var(--color-tc-ink)] flex items-center justify-center text-white font-bold font-serif text-sm shadow-xs">
                  3
                </span>
                Travel Persona
              </h3>
              <p className="text-xs text-[var(--color-tc-ink)]/70 mb-5 ml-11 font-medium">
                Customizes activity pacing, cultural landmarks, and daily rhythm for your style.
              </p>
            </div>
            
            <div className="space-y-3.5 flex-1 flex flex-col justify-between">
              {PERSONAS.map((p) => {
                const isSelected = persona === p.id;

                return (
                  <div 
                    key={p.id}
                    onClick={() => setPersona(p.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border-2 relative overflow-hidden group ${
                      isSelected
                        ? 'border-[var(--color-tc-ink)] bg-[var(--color-tc-sage)]/15 shadow-[4px_4px_0px_rgba(23,60,57,0.12)] scale-[1.01]' 
                        : 'border-[var(--color-tc-sage)]/50 bg-[var(--color-tc-parchment)]/60 hover:bg-[var(--color-tc-parchment)] hover:border-[var(--color-tc-ink)]/40'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 p-1 relative overflow-hidden ${
                        isSelected 
                          ? 'bg-[var(--color-tc-ink)] border-2 border-[var(--color-tc-ink)] shadow-xs' 
                          : 'bg-[var(--color-tc-cream)] border border-[var(--color-tc-sage)]/60'
                      }`}>
                        <Image
                          src={p.artworkPath}
                          alt=""
                          width={44}
                          height={44}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-bold font-serif text-sm text-[var(--color-tc-ink)] tracking-tight">
                            {p.title}
                          </h4>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isSelected 
                              ? 'bg-[var(--color-tc-ink)] text-white shadow-xs' 
                              : 'bg-[var(--color-tc-sage)]/30 text-[var(--color-tc-ink)]/80'
                          }`}>
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[var(--color-tc-ink)]/70 leading-relaxed mb-2">
                          {p.desc}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.traits.map((trait) => (
                            <span 
                              key={trait} 
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                isSelected 
                                  ? 'bg-[var(--color-tc-cream)] text-[var(--color-tc-ink)] border border-[var(--color-tc-ink)]/20 shadow-xs' 
                                  : 'bg-[var(--color-tc-cream)] text-[var(--color-tc-ink)]/60 border border-[var(--color-tc-sage)]/40'
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
        </div>
      </div>

      {/* Full-Width Hero Journey Launch Button */}
      <div className="pt-2">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="relative w-full rounded-3xl overflow-hidden border-2 border-[var(--color-tc-ink)] shadow-[8px_8px_0px_var(--color-tc-teal)] hover:shadow-[4px_4px_0px_var(--color-tc-teal)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-200 cursor-pointer group flex items-stretch disabled:opacity-80 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="w-full bg-[var(--color-tc-ink)] py-5 sm:py-6 px-6 sm:px-10 flex items-center justify-center gap-3.5">
              <div className="w-6 h-6 border-3 border-[var(--color-tc-cream)]/30 border-t-[var(--color-tc-cream)] rounded-full animate-spin shrink-0"></div>
              <span className="font-serif font-bold text-xl sm:text-2xl tracking-tight text-[var(--color-tc-cream)]">
                Crafting a journey that fits you...
              </span>
            </div>
          ) : (
            <>
              {/* Left Ticket Main Body: Deep Ink Green (~78%) */}
              <div className="flex-1 bg-[var(--color-tc-ink)] group-hover:bg-[#12312e] py-5 sm:py-6 px-5 sm:px-9 flex items-center gap-4 transition-colors">
                {/* Tripcraft Brand Mark on crisp cream medallion */}
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-tc-cream)] border border-white/20 shadow-sm flex items-center justify-center shrink-0 p-1.5 overflow-hidden">
                  <Image
                    src="/artwork/tripcraft-mark.png"
                    alt="Tripcraft"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Headline */}
                <div className="flex-1 text-center sm:text-left sm:pl-2">
                  <span className="font-serif font-bold text-xl sm:text-2xl lg:text-3xl text-white tracking-tight">
                    Craft a journey that fits you
                  </span>
                </div>
              </div>

              {/* Perforated Divider with Authentic Ticket Punch Cutouts */}
              <div className="relative flex flex-col justify-between items-center bg-[var(--color-tc-ink)] group-hover:bg-[#12312e] w-[1px] transition-colors shrink-0">
                <div className="w-4 h-4 bg-[var(--color-tc-parchment)] rounded-full -mt-2.5 -mx-2 z-10 border border-[var(--color-tc-ink)]/40" />
                <div className="h-full border-r-2 border-dashed border-[var(--color-tc-sage)]/50 my-1" />
                <div className="w-4 h-4 bg-[var(--color-tc-parchment)] rounded-full -mb-2.5 -mx-2 z-10 border border-[var(--color-tc-ink)]/40" />
              </div>

              {/* Right Ticket Action Stub: Warm Ivory Cream (~22%) */}
              <div className="bg-[var(--color-tc-cream)] group-hover:bg-white px-5 sm:px-8 flex items-center justify-center gap-2.5 shrink-0 transition-colors border-l border-[var(--color-tc-sage)]/40">
                <span className="text-xs font-serif font-bold uppercase tracking-wider text-[var(--color-tc-ink)] hidden sm:inline">
                  Begin
                </span>
                <div className="w-10 h-10 rounded-xl bg-[var(--color-tc-ink)] text-white flex items-center justify-center shadow-xs group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-5 h-5 text-[var(--color-tc-cream)]" />
                </div>
              </div>
            </>
          )}
        </button>

        {/* Micro Trust Indicators (Consolidated 3 items) */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-4 text-xs font-semibold text-[var(--color-tc-ink)]/60">
          <span className="flex items-center gap-1.5">
            <span className="text-[var(--color-tc-teal)]">✦</span> 100% Deterministic Engine
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-[var(--color-tc-teal)]">✦</span> Verified Local Heritage & Landmarks
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-[var(--color-tc-teal)]">✦</span> Real-Time Meteorological Alignment
          </span>
        </div>
      </div>
    </form>

      {/* Restored parchment loading treatment from the earlier planner design. */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-[var(--color-tc-parchment)]/80 p-4 backdrop-blur-sm duration-200">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="itinerary-loading-title"
            aria-describedby="itinerary-loading-description"
            className="flex flex-col items-center gap-4 text-center"
          >
            <div
              aria-hidden="true"
              className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-tc-sage)] border-t-[var(--color-tc-ink)]"
            />
            <p
              id="itinerary-loading-title"
              role="status"
              aria-live="polite"
              className="font-serif text-xl font-bold text-[var(--color-tc-ink)]"
            >
              Crafting a journey that fits you...
            </p>
            <p
              id="itinerary-loading-description"
              className="text-xs font-semibold text-[var(--color-tc-ink)]/60"
            >
              {destination || 'Target Destination'} • {duration} Days • {persona}
            </p>
          </section>
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
            <div className="w-8 h-8 border-4 border-[var(--color-tc-ink)]/30 border-t-[var(--color-tc-ink)] rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-500">Loading planner...</p>
          </div>
        </div>
      }
    >
      <PlannerForm />
    </Suspense>
  );
}

