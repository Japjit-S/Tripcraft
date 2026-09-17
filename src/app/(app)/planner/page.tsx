"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Clock, Plane, Train, Bus, Compass, Coffee, Baby, Backpack, Navigation } from 'lucide-react';

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

  // Form State
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState('');
  const [persona, setPersona] = useState('Culture Seeker');
  const [originCity, setOriginCity] = useState('');
  const [arrivalMode, setArrivalMode] = useState('flight');
  const [arrivalTime, setArrivalTime] = useState('');

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
    <div className="max-w-6xl mx-auto py-12 px-6 lg:px-12">
      <div className="mb-12">
        <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">Design your journey.</h1>
        <p className="text-lg text-slate-500 font-medium max-w-2xl">Drop in your details and we'll craft a deeply personalized, weather-aware itinerary in seconds.</p>
      </div>

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
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700 ml-2">Destination City</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 h-6 w-6 text-slate-400" />
                  <input 
                    required
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    type="text" 
                    placeholder="Where are you heading? (e.g. Jaipur)" 
                    className="w-full pl-14 pr-4 py-4 bg-[#f8f9fc] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1d6b8f]/30 transition-all text-slate-900 font-bold placeholder:font-normal placeholder:text-slate-400 text-lg"
                  />
                </div>
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
