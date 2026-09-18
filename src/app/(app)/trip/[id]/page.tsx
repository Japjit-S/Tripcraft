"use client";

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, SlidersHorizontal, MapPin } from 'lucide-react';
import { getMockTrip } from '@/lib/mockData';
import { getTripFromStorage, GeneratedTrip } from '@/lib/tripStore';
import MapPlaceholder from '@/components/workspace/MapPlaceholder';
import DayNotes from '@/components/workspace/DayNotes';
import WeatherSummary from '@/components/workspace/WeatherSummary';
import DecisionLogDrawer from '@/components/workspace/DecisionLogDrawer';
import Image from 'next/image';

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    // 1. Try loading from client storage (real generated trip)
    const stored = getTripFromStorage(resolvedParams.id);
    if (stored) {
      setTrip(stored);
      setIsLoaded(true);
      return;
    }

    // 2. Fall back to mock trip if matching
    const mock = getMockTrip(resolvedParams.id);
    if (mock) {
      setTrip(mock as GeneratedTrip);
    }
    setIsLoaded(true);
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

  // Helper to find selected item with title and coordinates
  const selectedItem = selectedItemId
    ? [...selectedDay.morning, ...selectedDay.afternoon, ...selectedDay.evening].find(
        (i) => i.id === selectedItemId
      )
    : undefined;

  const isJaipur = trip.destination.toLowerCase().includes('jaipur');

  return (
    <div className="h-full flex overflow-hidden bg-transparent">
      {/* Center Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8 flex flex-col">
        {/* Banner Row */}
        <div className="flex flex-col xl:flex-row gap-8 mb-8">
          {/* Destination Banner */}
          <div className="flex-1 relative bg-gradient-to-br from-[#FFF5ED] to-[#FFE8D6] rounded-[2rem] overflow-hidden p-8 flex items-center shadow-sm min-h-[220px]">
            <div className="relative z-10 w-2/3 md:w-1/2">
              <p className="text-xs font-bold text-orange-900/50 mb-2 tracking-widest uppercase">
                Active Itinerary
              </p>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                {trip.destination}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setSelectedDayIndex((prev) =>
                      prev > 0 ? prev - 1 : trip.itineraryDays.length - 1
                    )
                  }
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow text-slate-700 transition-all hover:scale-105"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setSelectedDayIndex((prev) =>
                      prev < trip.itineraryDays.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow text-slate-700 transition-all hover:scale-105"
                  title="Next Day"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Illustration Mask */}
            <div className="absolute right-0 top-0 bottom-0 w-2/3 md:w-1/2 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFE8D6] via-[#FFE8D6]/30 to-transparent z-10"></div>
              {isJaipur ? (
                <Image
                  src="/jaipur-banner.jpg"
                  alt="Jaipur"
                  fill
                  className="object-cover object-left opacity-90 mix-blend-multiply"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#1d6b8f]/20 via-[#1d6b8f]/5 to-transparent flex items-center justify-center">
                  <MapPin className="w-28 h-28 text-[#1d6b8f]/20" />
                </div>
              )}
            </div>
          </div>

          {/* Weather Card */}
          <div className="w-full xl:w-80 shrink-0 flex flex-col justify-center">
            <WeatherSummary summary={selectedDay.weatherSummary} />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Dates */}
          <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-400 mb-2">Travel Date</p>
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {trip.days} {trip.days === 1 ? 'day' : 'days'}
            </h3>
            <p className="text-xs font-bold text-slate-400">
              {new Date(trip.startDate).toLocaleDateString()} -{' '}
              {new Date(
                trip.itineraryDays[trip.itineraryDays.length - 1]?.date || trip.startDate
              ).toLocaleDateString()}
            </p>
          </div>

          {/* Card 2: Persona */}
          <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-400 mb-2">Travel Persona</p>
            <h3 className="text-xl font-black text-slate-900 mb-1">{trip.persona}</h3>
            <p className="text-xs font-bold text-slate-400">
              Weather-tuned algorithm active
            </p>
          </div>

          {/* Card 3: Arrival */}
          <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-400 mb-2">Arrival & Origin</p>
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {trip.destination}
            </h3>
            <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {trip.originCity ? `From ${trip.originCity}` : 'Direct arrival'} (
              {trip.arrivalMode}) at {trip.arrivalAt || trip.arrivalTime || '10:00 AM'}
            </p>
          </div>
        </div>

        {/* Content Area: Map + Itinerary */}
        <div className="flex flex-col lg:flex-row gap-8 pb-8">
          {/* Left: Map */}
          <div className="w-full lg:w-1/3 shrink-0">
            <div className="sticky top-0">
              <MapPlaceholder
                destination={trip.destination}
                destinationCoords={trip.destinationCoords}
                selectedItem={
                  selectedItem
                    ? {
                        title: selectedItem.title,
                        coords: selectedItem.coords,
                      }
                    : undefined
                }
                selectedItemTitle={selectedItem?.title}
                className="h-[500px]"
              />
            </div>
          </div>

          {/* Right: Itinerary List */}
          <div className="flex-1 bg-white rounded-[2rem] p-6 lg:p-10 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Itinerary</h2>
                {trip.auditLog && trip.auditLog.length > 0 && (
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    {trip.auditLog.length} engine rule evaluations recorded
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Decision Log Drawer Trigger Button */}
                {trip.auditLog && trip.auditLog.length > 0 && (
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1d6b8f] text-white rounded-full text-xs font-bold hover:bg-[#155370] shadow-md shadow-[#1d6b8f]/20 transition-all hover:scale-105"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Decision Log ({trip.auditLog.length})
                  </button>
                )}

                <span className="text-sm font-bold text-slate-700 bg-[#f8f9fc] px-4 py-2 rounded-full border border-slate-100">
                  Day {selectedDay.dayNumber}
                </span>
              </div>
            </div>

            <div className="space-y-8">
              <ItinerarySection
                title="Morning"
                items={selectedDay.morning}
                startIndex={0}
                selectedId={selectedItemId}
                onSelect={setSelectedItemId}
              />
              <ItinerarySection
                title="Afternoon"
                items={selectedDay.afternoon}
                startIndex={selectedDay.morning.length}
                selectedId={selectedItemId}
                onSelect={setSelectedItemId}
              />
              <ItinerarySection
                title="Evening"
                items={selectedDay.evening}
                startIndex={selectedDay.morning.length + selectedDay.afternoon.length}
                selectedId={selectedItemId}
                onSelect={setSelectedItemId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Calendar, Notes */}
      <div className="w-80 shrink-0 bg-white flex flex-col h-full overflow-y-auto hidden xl:flex">
        {/* Calendar Widget */}
        <div className="px-8 pt-8 py-4">
          <h3 className="text-2xl font-black text-slate-900 mb-6">Calendar</h3>

          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <div key={d} className="text-[10px] font-bold text-slate-400">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
            {/* Render days of trip */}
            {trip.itineraryDays.map((d, tripDayIndex) => {
              const dateObj = new Date(d.date);
              const dayNum = dateObj.getUTCDate() || d.dayNumber;
              const isSelected = selectedDayIndex === tripDayIndex;

              let className =
                'py-2 text-xs font-bold rounded-full cursor-pointer transition-all mx-auto w-8 h-8 flex items-center justify-center ';
              if (isSelected) {
                className += 'bg-[#1d6b8f] text-white shadow-md scale-110';
              } else {
                className += 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/25';
              }

              return (
                <div key={d.id} className="flex justify-center items-center">
                  <div
                    className={className}
                    onClick={() => {
                      setSelectedDayIndex(tripDayIndex);
                      setSelectedItemId(null);
                    }}
                  >
                    {dayNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="px-8 py-6">
          <div className="h-px w-full bg-slate-100"></div>
        </div>

        {/* Day Notes */}
        <div className="flex-1 px-8 pb-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-slate-900">Notes</h3>
            <button className="bg-[#1d6b8f] text-white text-[11px] font-bold px-4 py-2 rounded-full hover:bg-[#155370] shadow-sm transition-colors">
              Add note +
            </button>
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
  items,
  startIndex,
  selectedId,
  onSelect,
}: {
  title: string;
  items: any[];
  startIndex: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4 px-4">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item, localIndex) => {
          const index = startIndex + localIndex;
          const isSelected = selectedId === item.id;
          const isFlex = Boolean(item.isFlex);

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`p-4 rounded-2xl transition-all cursor-pointer flex gap-4 items-center group relative overflow-hidden ${
                isSelected
                  ? isFlex
                    ? 'bg-amber-50/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-200 scale-[1.01] my-2'
                    : 'bg-blue-50/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-100/50 scale-[1.01] my-2'
                  : 'bg-transparent hover:bg-slate-50 border border-transparent'
              }`}
            >
              {isSelected && (
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${
                    isFlex ? 'bg-amber-500' : 'bg-[#1d6b8f]'
                  }`}
                ></div>
              )}

              {/* Index */}
              <div
                className={`w-5 text-center font-black transition-colors ${
                  isSelected
                    ? isFlex
                      ? 'text-amber-600'
                      : 'text-[#1d6b8f]'
                    : 'text-slate-300 group-hover:text-slate-400'
                }`}
              >
                {index + 1}
              </div>

              <div className="flex-1 grid grid-cols-[1fr_95px] gap-4 items-center">
                <div>
                  <h4
                    className={`font-bold text-sm ${
                      isSelected ? 'text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {item.title}
                  </h4>
                  {isSelected && (
                    <div className="mt-1.5 space-y-1">
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {item.reason}
                      </p>
                      {isFlex && item.flexReason && (
                        <p className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md inline-block">
                          Notice: {item.flexReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right flex justify-end">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      isFlex
                        ? 'bg-amber-100 text-amber-800 border border-amber-200/60'
                        : item.indoor
                        ? 'bg-orange-50 text-orange-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {isFlex ? 'FLEX' : item.indoor ? 'Indoor' : 'Outdoor'}
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
