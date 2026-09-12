"use client";

import { useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMockTrip } from '@/lib/mockData';
import MapPlaceholder from '@/components/workspace/MapPlaceholder';
import DayNotes from '@/components/workspace/DayNotes';
import WeatherSummary from '@/components/workspace/WeatherSummary';
import Image from 'next/image';

export default function TripWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const trip = getMockTrip(resolvedParams.id);
  
  if (!trip) {
    notFound();
  }

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedDay = trip.itineraryDays[selectedDayIndex];

  // Helper to find title of selected item
  const selectedItemTitle = selectedItemId 
    ? [...selectedDay.morning, ...selectedDay.afternoon, ...selectedDay.evening]
        .find(i => i.id === selectedItemId)?.title 
    : undefined;

  return (
    <div className="h-full flex overflow-hidden bg-transparent">
      
      {/* Center Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8 flex flex-col">
        
        {/* Banner Row */}
        <div className="flex flex-col xl:flex-row gap-8 mb-8">
           {/* Illustration Banner */}
           <div className="flex-1 relative bg-gradient-to-br from-[#FFF5ED] to-[#FFE8D6] rounded-[2rem] overflow-hidden p-8 flex items-center shadow-sm min-h-[220px]">
             <div className="relative z-10 w-1/2">
                <p className="text-xs font-bold text-orange-900/50 mb-2 tracking-widest uppercase">Nearest Trip</p>
                <h1 className="text-5xl font-black text-slate-900 mb-6">{trip.destination}</h1>
                <div className="flex gap-2">
                  <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow text-slate-700 transition-all hover:scale-105">
                     <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow text-slate-700 transition-all hover:scale-105">
                     <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
             </div>
             {/* The right side illustration mask */}
             <div className="absolute right-0 top-0 bottom-0 w-2/3 md:w-1/2 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFE8D6] via-[#FFE8D6]/20 to-transparent z-10"></div>
                <Image src="/jaipur-banner.jpg" alt="Jaipur" fill className="object-cover object-left opacity-90 mix-blend-multiply" />
             </div>
           </div>
           
           {/* Weather Card (replaces Expenses) */}
           <div className="w-full xl:w-80 shrink-0 flex flex-col justify-center">
             <WeatherSummary summary={selectedDay.weatherSummary} />
           </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           {/* Card 1: Dates */}
           <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-center">
             <p className="text-xs font-bold text-slate-400 mb-2">Travel Date</p>
             <h3 className="text-xl font-black text-slate-900 mb-1">{trip.days} days</h3>
             <p className="text-xs font-bold text-slate-400">{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.itineraryDays[trip.itineraryDays.length-1].date).toLocaleDateString()}</p>
           </div>
           
           {/* Card 2: Persona */}
           <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-center">
             <p className="text-xs font-bold text-slate-400 mb-2">People</p>
             <h3 className="text-xl font-black text-slate-900 mb-1">1 <span className="text-sm font-bold text-slate-400">/adult</span></h3>
             <p className="text-xs font-bold text-slate-400">{trip.persona}</p>
           </div>

           {/* Card 3: Arrival */}
           <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-center">
             <p className="text-xs font-bold text-slate-400 mb-2">Destination</p>
             <h3 className="text-xl font-black text-slate-900 mb-1">{trip.destination}</h3>
             <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
               From {trip.originCity} ({trip.arrivalMode}) at {trip.arrivalAt}
             </p>
           </div>
        </div>

        {/* Content Area: Map + Itinerary */}
        <div className="flex flex-col lg:flex-row gap-8 pb-8">
           {/* Left: Map */}
           <div className="w-full lg:w-1/3 shrink-0">
             <div className="sticky top-0">
               <MapPlaceholder destination={trip.destination} selectedItemTitle={selectedItemTitle} className="h-[500px]" />
             </div>
           </div>

           {/* Right: Itinerary List */}
           <div className="flex-1 bg-white rounded-[2rem] p-6 lg:p-10 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
              <div className="flex justify-between items-center mb-6 pb-4">
                 <h2 className="text-3xl font-black text-slate-900">Itinerary</h2>
                 <span className="text-sm font-bold text-slate-500 bg-slate-50 px-4 py-1.5 rounded-full">Day {selectedDay.dayNumber}</span>
              </div>

              <div className="space-y-8">
                <ItinerarySection title="Morning" items={selectedDay.morning} startIndex={0} selectedId={selectedItemId} onSelect={setSelectedItemId} />
                <ItinerarySection title="Afternoon" items={selectedDay.afternoon} startIndex={selectedDay.morning.length} selectedId={selectedItemId} onSelect={setSelectedItemId} />
                <ItinerarySection title="Evening" items={selectedDay.evening} startIndex={selectedDay.morning.length + selectedDay.afternoon.length} selectedId={selectedItemId} onSelect={setSelectedItemId} />
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
             {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
               <div key={d} className="text-[10px] font-bold text-slate-400">{d}</div>
             ))}
           </div>

           {/* Simple Mock Month Grid (October 2026) - starting Thu 1st */}
           <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
             <div className="py-2 text-slate-300 text-xs font-bold">28</div>
             <div className="py-2 text-slate-300 text-xs font-bold">29</div>
             <div className="py-2 text-slate-300 text-xs font-bold">30</div>
             {[...Array(31)].map((_, i) => {
               const dayNum = i + 1;
               // Find if this day belongs to our trip (trip is Oct 15-17)
               const tripDayIndex = trip.itineraryDays.findIndex(d => new Date(d.date).getDate() === dayNum);
               const isTripDay = tripDayIndex !== -1;
               const isSelected = isTripDay && selectedDayIndex === tripDayIndex;

               let className = "py-2 text-xs font-bold rounded-full cursor-pointer transition-all mx-auto w-8 h-8 flex items-center justify-center ";
               if (isSelected) {
                 className += "bg-[#1d6b8f] text-white shadow-md scale-110";
               } else if (isTripDay) {
                 className += "bg-blue-500/15 text-blue-600 hover:bg-blue-500/25";
               } else {
                 className += "text-slate-600 hover:bg-slate-50";
               }

               return (
                 <div key={dayNum} className="flex justify-center items-center">
                   <div 
                     className={className}
                     onClick={() => {
                       if (isTripDay) {
                         setSelectedDayIndex(tripDayIndex);
                         setSelectedItemId(null);
                       }
                     }}
                   >
                     {dayNum}
                   </div>
                 </div>
               );
             })}
             <div className="py-2 text-slate-300 text-xs font-bold">1</div>
           </div>
        </div>

        {/* Divider */}
        <div className="px-8 py-6">
          <div className="h-px w-full bg-slate-100"></div>
        </div>

        {/* Day Notes (replaces Timeline) */}
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

    </div>
  );
}

// Subcomponent for sections
function ItinerarySection({ title, items, startIndex, selectedId, onSelect }: { 
  title: string,
  items: any[], 
  startIndex: number,
  selectedId: string | null,
  onSelect: (id: string) => void
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4 px-4">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item, localIndex) => {
        const index = startIndex + localIndex;
        const isSelected = selectedId === item.id;
        
        return (
          <div 
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`p-4 rounded-2xl transition-all cursor-pointer flex gap-4 items-center group relative overflow-hidden ${
              isSelected 
                ? 'bg-blue-50/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-100/50 scale-[1.01] my-2' 
                : 'bg-transparent hover:bg-slate-50 border border-transparent'
            }`}
          >
            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-2xl"></div>}
            
            {/* Index */}
            <div className={`w-5 text-center font-black transition-colors ${isSelected ? 'text-blue-500' : 'text-slate-300 group-hover:text-slate-400'}`}>
              {index + 1}
            </div>

            <div className="flex-1 grid grid-cols-[1fr_80px] gap-4 items-center">
              <div>
                <h4 className={`font-bold text-sm ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                  {item.title}
                </h4>
                {isSelected && (
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item.reason}</p>
                )}
              </div>
              
              <div className="text-right flex justify-end">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                  item.indoor 
                    ? 'bg-orange-50 text-orange-600' 
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {item.indoor ? 'Indoor' : 'Outdoor'}
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
