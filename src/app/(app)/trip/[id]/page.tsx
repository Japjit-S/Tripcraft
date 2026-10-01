"use client";

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { getMockTrip } from '@/lib/mockData';
import { ensureTripArtwork, getTripFromStorage, GeneratedTrip } from '@/lib/tripStore';
import { ItineraryItem } from '@/lib/types';
import { DestinationBanner } from '@/components/artwork/DestinationBanner';
import MapPlaceholder from '@/components/workspace/MapPlaceholder';
import DayNotes from '@/components/workspace/DayNotes';
import WeatherSummary from '@/components/workspace/WeatherSummary';
import DecisionLogDrawer from '@/components/workspace/DecisionLogDrawer';

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  LANDMARK: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  CULTURE: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  NATURE: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  FOOD: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  MARKET: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  ENTERTAINMENT: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  RELAXATION: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
};

export default function TripWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [trip, setTrip] = useState<GeneratedTrip | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadTrip = async () => {
      // 1. Try loading from client storage (fast local cache)
      const stored = getTripFromStorage(resolvedParams.id);
      if (stored) {
        if (isMounted) {
          setTrip(stored);
          setIsLoaded(true);
        }
        return;
      }

      // 2. Fall back to mock trip if matching
      const mock = getMockTrip(resolvedParams.id);
      if (mock) {
        if (isMounted) {
          setTrip(ensureTripArtwork(mock as GeneratedTrip));
          setIsLoaded(true);
        }
        return;
      }

      // 3. Try fetching from Supabase database API
      try {
        const res = await fetch(`/api/itineraries/${encodeURIComponent(resolvedParams.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.itinerary && isMounted) {
            const upgraded = ensureTripArtwork(data.itinerary);
            setTrip(upgraded);
            setIsLoaded(true);
            return;
          }
        }
      } catch {
        // tolerate network error
      }

      if (isMounted) setIsLoaded(true);
    };

    loadTrip();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id]);

  if (isLoaded && !trip) {
    notFound();
  }

  if (!trip) {
    return (
      <div className="h-full flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#1d6b8f]/30 border-t-[#1d6b8f] rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500">Loading your journey...</p>
        </div>
      </div>
    );
  }

  const selectedDay = trip.itineraryDays[selectedDayIndex] || trip.itineraryDays[0];
  const allCurrentDayItems = [
    ...selectedDay.morning,
    ...selectedDay.afternoon,
    ...selectedDay.evening,
  ];

  // Active item prioritizes hovered item, otherwise selected item
  const activeItemId = hoveredItemId || selectedItemId;
  const activeItem = activeItemId
    ? allCurrentDayItems.find((i) => i.id === activeItemId)
    : undefined;

  return (
    <div className="h-full flex overflow-hidden bg-transparent">
      {/* Center Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8 flex flex-col">
        {/* Banner Row */}
        <div className="flex flex-col xl:flex-row gap-6 mb-8">
          {/* Destination Banner */}
          <div className="flex-1 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden p-6 sm:p-8 flex items-center shadow-lg min-h-[220px] border border-slate-800">
            {/* Subtle Gradient Overlays for High-Contrast Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent z-10 pointer-events-none" />

            <div className="relative z-20 max-w-[65%] sm:max-w-[60%] pr-4 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/10 px-2.5 py-0.5 rounded-md border border-orange-400/20">
                  {trip.persona} Persona
                </span>
                {trip.feasibilityStatus === 'CAUTION' ? (
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-400/20">
                    <AlertTriangle className="w-3 h-3" /> Caution Advisory
                  </span>
                ) : (
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-400/20">
                    <ShieldCheck className="w-3 h-3" /> Feasibility Passed
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 tracking-tight break-words">
                {trip.destination}
              </h1>

              <p className="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>
                  {[trip.destinationAdmin1, trip.destinationCountry].filter(Boolean).join(', ') ||
                    'Global Destination'}
                </span>
                {trip.originCity && (
                  <span className="text-slate-400 text-xs">
                    • Departed from {trip.originCity}
                  </span>
                )}
              </p>
            </div>

            {/* Illustration Mask */}
            <div className="absolute right-0 top-0 bottom-0 w-[55%] sm:w-1/2 md:w-5/12 z-0 opacity-90">
              <DestinationBanner
                artwork={trip.artwork}
                destination={trip.destination}
                destinationId={trip.destinationId}
                country={trip.destinationCountry}
                countryCode={trip.destinationCountryCode}
                admin1={trip.destinationAdmin1}
                coords={trip.destinationCoords}
                surface="workspace"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Weather Card */}
          <div className="w-full xl:w-80 shrink-0 flex flex-col justify-center">
            <WeatherSummary summary={selectedDay.weatherSummary} />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Card 1: Dates */}
          <div className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Duration & Schedule</p>
            <h3 className="text-lg font-black text-slate-900 mb-0.5">
              {trip.days} {trip.days === 1 ? 'Day Excursion' : 'Days Total'}
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {new Date(
                trip.itineraryDays[trip.itineraryDays.length - 1]?.date || trip.startDate
              ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Card 2: Persona */}
          <div className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pacing Algorithm</p>
            <h3 className="text-lg font-black text-slate-900 mb-0.5">{trip.persona}</h3>
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1d6b8f] animate-pulse"></span>
              Weather-tuned slot distribution active
            </p>
          </div>

          {/* Card 3: Arrival */}
          <div className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transit Gate</p>
            <h3 className="text-lg font-black text-slate-900 mb-0.5">
              {trip.arrivalAt || trip.arrivalTime || '10:00 AM'} ({trip.arrivalMode})
            </h3>
            <p className="text-xs font-semibold text-slate-500 truncate">
              {trip.originCity ? `Inbound transit from ${trip.originCity}` : 'Direct destination check-in'}
            </p>
          </div>
        </div>

        {/* Content Area: Map + Itinerary */}
        <div className="flex flex-col lg:flex-row gap-8 pb-8">
          {/* Left: Interactive Map with Pan-on-Hover */}
          <div className="w-full lg:w-1/3 shrink-0">
            <div className="sticky top-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Spatial Radar
                </span>
                <span className="text-[10px] font-semibold text-[#1d6b8f] bg-[#1d6b8f]/10 px-2 py-0.5 rounded-full">
                  Pan on Hover
                </span>
              </div>
              <MapPlaceholder
                destination={trip.destination}
                destinationCoords={trip.destinationCoords}
                selectedItem={
                  activeItem
                    ? {
                        title: activeItem.title,
                        coords: activeItem.coords,
                      }
                    : undefined
                }
                selectedItemTitle={activeItem?.title}
                className="h-[480px]"
              />
            </div>
          </div>

          {/* Right: Itinerary List */}
          <div className="flex-1 bg-white rounded-3xl p-6 lg:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Day {selectedDay.dayNumber} Timeline
                </h2>
                <p className="text-xs font-medium text-slate-400 mt-0.5">
                  {new Date(selectedDay.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Decision Log Drawer Trigger Button */}
                {trip.auditLog && trip.auditLog.length > 0 && (
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-xs hover:scale-102 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Decision Log ({trip.auditLog.length})</span>
                  </button>
                )}

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    disabled={selectedDayIndex === 0}
                    onClick={() =>
                      setSelectedDayIndex((prev) => (prev > 0 ? prev - 1 : prev))
                    }
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      selectedDayIndex === 0 
                        ? 'bg-transparent text-slate-300 cursor-not-allowed' 
                        : 'bg-white shadow-2xs text-slate-700 hover:text-[#1d6b8f]'
                    }`}
                    title="Previous Day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2 min-w-[3.5rem] text-center">
                    Day {selectedDay.dayNumber} of {trip.days}
                  </span>
                  <button
                    disabled={selectedDayIndex === trip.itineraryDays.length - 1}
                    onClick={() =>
                      setSelectedDayIndex((prev) =>
                        prev < trip.itineraryDays.length - 1 ? prev + 1 : prev
                      )
                    }
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      selectedDayIndex === trip.itineraryDays.length - 1 
                        ? 'bg-transparent text-slate-300 cursor-not-allowed' 
                        : 'bg-white shadow-2xs text-slate-700 hover:text-[#1d6b8f]'
                    }`}
                    title="Next Day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <ItinerarySection
                title="Morning"
                slotBadge="09:00 - 12:30"
                items={selectedDay.morning}
                startIndex={0}
                selectedId={selectedItemId}
                hoveredId={hoveredItemId}
                onSelect={setSelectedItemId}
                onHover={setHoveredItemId}
              />
              <ItinerarySection
                title="Afternoon"
                slotBadge="13:30 - 17:00"
                items={selectedDay.afternoon}
                startIndex={selectedDay.morning.length}
                selectedId={selectedItemId}
                hoveredId={hoveredItemId}
                onSelect={setSelectedItemId}
                onHover={setHoveredItemId}
              />
              <ItinerarySection
                title="Evening"
                slotBadge="18:00 - 21:30"
                items={selectedDay.evening}
                startIndex={selectedDay.morning.length + selectedDay.afternoon.length}
                selectedId={selectedItemId}
                hoveredId={hoveredItemId}
                onSelect={setSelectedItemId}
                onHover={setHoveredItemId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Calendar, Notes */}
      <div className="w-80 shrink-0 bg-white border-l border-slate-100 flex flex-col h-full overflow-y-auto hidden xl:flex">
        {/* Calendar Widget */}
        <div className="px-6 pt-6 py-4">
          <h3 className="text-xl font-black text-slate-900 mb-4">Journey Calendar</h3>

          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <div key={d} className="text-[10px] font-bold text-slate-400">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
            {(() => {
              const start = new Date(trip.startDate);
              const year = start.getUTCFullYear();
              const month = start.getUTCMonth();
              const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
              
              const firstDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay();
              const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
              
              const grid = [];
              for (let i = 0; i < offset; i++) {
                grid.push(<div key={`empty-${i}`} className="w-7 h-7 mx-auto" />);
              }
              
              const tripDates = trip.itineraryDays.map(d => ({
                dayNum: new Date(d.date).getUTCDate(),
                tripDayIndex: trip.itineraryDays.indexOf(d),
                id: d.id
              }));

              for (let i = 1; i <= daysInMonth; i++) {
                const tripDayInfo = tripDates.find(td => td.dayNum === i);
                
                if (tripDayInfo) {
                  const isSelected = selectedDayIndex === tripDayInfo.tripDayIndex;
                  let className = 'py-1 text-xs font-bold rounded-xl cursor-pointer transition-all mx-auto w-7 h-7 flex items-center justify-center ';
                  if (isSelected) {
                    className += 'bg-[#1d6b8f] text-white shadow-sm scale-105';
                  } else {
                    className += 'bg-[#1d6b8f]/10 text-[#1d6b8f] hover:bg-[#1d6b8f]/20';
                  }

                  grid.push(
                    <div key={`day-${i}`} className="flex justify-center items-center">
                      <div
                        className={className}
                        onClick={() => {
                          setSelectedDayIndex(tripDayInfo.tripDayIndex);
                          setSelectedItemId(null);
                        }}
                      >
                        {i}
                      </div>
                    </div>
                  );
                } else {
                  grid.push(
                    <div key={`day-${i}`} className="flex justify-center items-center">
                      <div className="py-1 text-xs font-medium text-slate-300 w-7 h-7 flex items-center justify-center">
                        {i}
                      </div>
                    </div>
                  );
                }
              }
              return grid;
            })()}
          </div>
        </div>

        {/* Divider */}
        <div className="px-6 py-3">
          <div className="h-px w-full bg-slate-100"></div>
        </div>

        {/* Collaborative Day Notes */}
        <div className="flex-1 px-6 pb-6 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-black text-slate-900">
              Day {selectedDay.dayNumber} Notes
            </h3>
          </div>
          <div className="flex-1">
            <DayNotes key={selectedDay.id} dayId={selectedDay.id} />
          </div>
        </div>
      </div>

      {/* Decision Log Slide-Over Drawer */}
      <DecisionLogDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        auditLog={trip.auditLog || []}
        totalDays={trip.days}
      />
    </div>
  );
}

// Subcomponent for sections
function ItinerarySection({
  title,
  slotBadge,
  items,
  startIndex,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: {
  title: string;
  slotBadge?: string;
  items: ItineraryItem[];
  startIndex: number;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1d6b8f]"></span>
          {title}
        </h3>
        {slotBadge && (
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
            {slotBadge}
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {items.map((item, localIndex) => {
          const index = startIndex + localIndex;
          const isSelected = selectedId === item.id;
          const isHovered = hoveredId === item.id;
          const isFlex = Boolean(item.isFlex);
          const catStyle =
            CATEGORY_STYLES[item.category] || CATEGORY_STYLES.LANDMARK;

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              onMouseEnter={() => onHover(item.id)}
              onMouseLeave={() => onHover(null)}
              className={`p-4 rounded-2xl transition-all cursor-pointer flex gap-4 items-start group relative border ${
                isSelected || isHovered
                  ? isFlex
                    ? 'bg-amber-50/80 shadow-md border-amber-300 scale-[1.01]'
                    : 'bg-slate-50/90 shadow-md border-[#1d6b8f]/40 scale-[1.01]'
                  : 'bg-white hover:bg-slate-50/60 border-slate-100 hover:border-slate-200'
              }`}
            >
              {/* Left Slot Accent Bar */}
              {(isSelected || isHovered) && (
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${
                    isFlex ? 'bg-amber-500' : 'bg-[#1d6b8f]'
                  }`}
                />
              )}

              {/* Numerical Index Badge */}
              <div
                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isSelected || isHovered
                    ? isFlex
                      ? 'bg-amber-500 text-white'
                      : 'bg-[#1d6b8f] text-white'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                }`}
              >
                {index + 1}
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <h4
                    className={`font-black text-sm tracking-tight ${
                      isSelected || isHovered ? 'text-slate-900' : 'text-slate-800'
                    }`}
                  >
                    {item.title}
                  </h4>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                    >
                      {item.category}
                    </span>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        item.indoor
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {item.indoor ? 'Indoor' : 'Outdoor'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {item.reason}
                </p>

                {isFlex && item.flexReason && (
                  <p className="mt-1.5 text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md inline-block">
                    Notice: {item.flexReason}
                  </p>
                )}

                {/* Details Footer */}
                <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                  {item.coords && (
                    <span className="flex items-center gap-1 hover:text-[#1d6b8f] transition-colors">
                      <MapPin className="w-3 h-3 text-[#1d6b8f]" />
                      <span className="font-mono">
                        {item.coords.lat.toFixed(3)}, {item.coords.lon.toFixed(3)}
                      </span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Focus Activity</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
