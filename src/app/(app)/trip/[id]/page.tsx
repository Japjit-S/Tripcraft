"use client";

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { ensureTripArtwork, getTripFromStorage, GeneratedTrip } from '@/lib/tripStore';
import { ItineraryItem } from '@/lib/types';
import Image from 'next/image';
import { DestinationBanner } from '@/components/artwork/DestinationBanner';
import { getPersonaArtworkPath } from '@/lib/images';
import MapPlaceholder from '@/components/workspace/MapPlaceholder';
import DayNotes from '@/components/workspace/DayNotes';
import WeatherSummary from '@/components/workspace/WeatherSummary';
import { formatDestinationDate, parseDateParts } from '@/lib/engine/timezone';

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  LANDMARK: { bg: 'bg-[var(--color-tc-saffron)]/10', text: 'text-[var(--color-tc-saffron)]', border: 'border-[var(--color-tc-saffron)]' },
  CULTURE: { bg: 'bg-[var(--color-tc-tangerine)]/10', text: 'text-[var(--color-tc-tangerine)]', border: 'border-[var(--color-tc-tangerine)]' },
  NATURE: { bg: 'bg-[var(--color-tc-teal)]/10', text: 'text-[var(--color-tc-teal)]', border: 'border-[var(--color-tc-teal)]' },
  FOOD: { bg: 'bg-[#FEF2F2]', text: 'text-[#7F1D1D]', border: 'border-rose-200' },
  MARKET: { bg: 'bg-[var(--color-tc-saffron)]/10', text: 'text-[var(--color-tc-saffron)]', border: 'border-[var(--color-tc-saffron)]' },
  ENTERTAINMENT: { bg: 'bg-indigo-50', text: 'text-[var(--color-tc-ink)]', border: 'border-indigo-200' },
  RELAXATION: { bg: 'bg-purple-50', text: 'text-[var(--color-tc-ink)]', border: 'border-purple-200' },
};

function getDestinationTypography(destination: string) {
  const len = destination.trim().length;
  if (len > 15) {
    // Very long city names like Thiruvananthapuram (18 chars)
    return {
      city: 'text-xl sm:text-2xl lg:text-[1.85rem]',
      admin1: 'text-xs sm:text-sm lg:text-base',
    };
  }
  if (len > 10) {
    // Long city names like Visakhapatnam (13 chars), Bhubaneswar (11 chars)
    return {
      city: 'text-2xl sm:text-3xl lg:text-[2.35rem]',
      admin1: 'text-sm sm:text-base lg:text-lg',
    };
  }
  if (len > 7) {
    // Medium city names like Bengaluru (9 chars), Hyderabad (9 chars)
    return {
      city: 'text-2xl sm:text-3xl lg:text-4xl',
      admin1: 'text-sm sm:text-base lg:text-lg',
    };
  }
  // Short city names like Mumbai (6 chars), Jaipur (6 chars), Goa (3 chars)
  return {
    city: 'text-3xl sm:text-4xl lg:text-5xl',
    admin1: 'text-base sm:text-lg lg:text-xl',
  };
}

function formatCityWithSoftHyphens(name: string): string {
  const knownBreaks: Record<string, string> = {
    'Thiruvananthapuram': 'Thiruvanan\u00ADthapuram',
    'Visakhapatnam': 'Visakha\u00ADpatnam',
    'Bhubaneswar': 'Bhuban\u00ADeswar',
    'Mahabalipuram': 'Mahabali\u00ADpuram',
    'Ramanathapuram': 'Ramanatha\u00ADpuram',
    'Secunderabad': 'Secunder\u00ADabad',
    'Kanchipuram': 'Kanchi\u00ADpuram',
    'Muzaffarnagar': 'Muzaffar\u00ADnagar',
    'Muzaffarpur': 'Muzaffar\u00ADpur',
  };

  if (knownBreaks[name]) {
    return knownBreaks[name];
  }

  // If a single long word > 11 chars has no hyphens or spaces, insert soft hyphen in the middle
  if (name.length > 11 && !name.includes(' ') && !name.includes('-')) {
    const mid = Math.floor(name.length / 2);
    return name.slice(0, mid) + '\u00AD' + name.slice(mid);
  }

  return name;
}

function cleanReason(reason?: string): string {
  if (!reason) return '';

  let cleaned = reason;

  // Remove percentages and raw score numbers in parentheses: e.g. (88%), (25), (30), (240m)
  cleaned = cleaned.replace(/\s*\(\d+%\)/g, '');
  cleaned = cleaned.replace(/\s*\(\d+\)/g, '');
  cleaned = cleaned.replace(/\s*\(\d+m\)/g, '');
  cleaned = cleaned.replace(/\s*\(\d+\+\s*hours\)/g, '');

  // Transform algorithmic internal phrases into natural travel highlights
  cleaned = cleaned.replace(
    /Day anchor landmark with highest city prominence\.?/gi,
    'Iconic city landmark and primary cultural highlight.'
  );
  cleaned = cleaned.replace(
    /Day anchor landmark allocated to afternoon window\.?/gi,
    'Key landmark and highlight of your afternoon itinerary.'
  );
  cleaned = cleaned.replace(
    /Selected as primary high-prominence anchor landmark for Day \d+\.?/gi,
    'Primary city landmark and anchor visit for the day.'
  );
  cleaned = cleaned.replace(
    /Selected for [A-Za-z\s]+ in morning based on high affinity and weather fit\.?/gi,
    'Curated morning visit aligned with your travel style and weather.'
  );
  cleaned = cleaned.replace(
    /Selected for [A-Za-z\s]+ in afternoon based on category affinity\.?/gi,
    'Curated afternoon visit tailored to your travel preferences.'
  );
  cleaned = cleaned.replace(
    /Selected for [A-Za-z\s]+ evening window based on atmosphere and dining fit\.?/gi,
    'Atmospheric evening destination ideal for dining and local culture.'
  );
  cleaned = cleaned.replace(
    /Cumulative exertion index triggered a \d+-minute relaxed morning start window\.?/gi,
    'Relaxed morning start scheduled to balance travel pacing.'
  );
  cleaned = cleaned.replace(
    /Multi-slot continuation: Anchor activity requires [^;]+; afternoon is reserved for relaxed pacing and transit buffer\.?/gi,
    'Extended excursion with built-in relaxation buffers.'
  );
  cleaned = cleaned.replace(
    /Anchor excursion spans into afternoon; reserved relaxation buffer\.?/gi,
    'Extended excursion with built-in relaxation buffer.'
  );
  cleaned = cleaned.replace(
    /Thin candidate pool for [a-z]+ under [A-Z_]+ conditions; emitted explicit FLEX block\.?/gi,
    'Flexible window reserved for spontaneous exploration.'
  );
  cleaned = cleaned.replace(
    /Flexible window scheduled due to thin pool of [a-z]+ options\.?/gi,
    'Flexible window reserved for leisurely exploration.'
  );
  cleaned = cleaned.replace(
    /Morning slot occupied by inbound travel to destination\.?/gi,
    'Inbound travel and arrival window.'
  );
  cleaned = cleaned.replace(
    /Afternoon slot reserved for terminal transit, transfer, and hotel room check-in\.?/gi,
    'Terminal transfer, hotel check-in, and settling in.'
  );
  cleaned = cleaned.replace(
    /Evening dinner and relaxed settling-in following arrival\. No strenuous sightseeing scheduled\.?/gi,
    'Welcome dinner and relaxed evening settling in.'
  );
  cleaned = cleaned.replace(
    /Morning window reserved for arrival transit and check-in logistics\.?/gi,
    'Morning arrival and transfer window.'
  );
  cleaned = cleaned.replace(
    /Afternoon slot reserved for arrival transit and check-in logistics\.?/gi,
    'Afternoon check-in and settling in.'
  );
  cleaned = cleaned.replace(
    /Evening slot reserved for arrival transit and check-in logistics\.?/gi,
    'Evening arrival and settling in.'
  );

  // General vocabulary sanitization
  cleaned = cleaned.replace(/highest city prominence/gi, 'iconic city highlight');
  cleaned = cleaned.replace(/city prominence/gi, 'city highlight');
  cleaned = cleaned.replace(/category affinity/gi, 'travel preferences');
  cleaned = cleaned.replace(/high affinity/gi, 'travel preferences');

  return cleaned.replace(/\s{2,}/g, ' ').replace(/\.\.+/g, '.').trim();
}

function cleanFlexReason(reason?: string): string {
  if (!reason) return '';
  let cleaned = reason;
  cleaned = cleaned.replace(/Thin candidate pool for [a-z]+ under [A-Z_]+ conditions\.?/gi, 'Flexible window for leisure and local discovery.');
  cleaned = cleaned.replace(/thin candidate pool/gi, 'flexible schedule');
  return cleaned.trim();
}

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

      // 2. Try fetching from Supabase database API
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
          <div className="w-8 h-8 border-4 border-[var(--color-tc-ink)]/30 border-t-[#1d6b8f] rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-[var(--color-tc-ink)]/60">Loading your journey...</p>
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

  const destTypo = getDestinationTypography(trip.destination);

  return (
    <div className="h-full flex overflow-hidden bg-transparent">
      {/* Center Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8 flex flex-col">
                {/* Banner Row */}
        <div className="mb-6">
          {/* Full-Bleed Destination Artwork Banner */}
          <div className="w-full relative h-[200px] sm:h-[240px] md:h-[280px] rounded-2xl overflow-hidden border-2 border-[var(--color-tc-sage)]/60 shadow-[4px_4px_0px_rgba(23,60,57,0.05)] bg-[var(--color-tc-cream)]">
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

        {/* Info & Weather Row */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 items-stretch">
          {/* Combined Persona & Destination Card */}
          <div className="w-full lg:flex-1 bg-[var(--color-tc-cream)] pl-2.5 sm:pl-3.5 pr-4 sm:pr-6 py-3 sm:py-3.5 rounded-[1.5rem] shadow-[4px_4px_0px_rgba(23,60,57,0.05)] border-2 border-[var(--color-tc-sage)] flex flex-col justify-center overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-3 sm:gap-4 lg:gap-5 h-full">
              {/* Left: Persona with Pure PNG Logo (Shifted completely left to remove dead space) */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                <div className="relative flex items-center justify-center shrink-0 w-20 h-20 sm:w-24 sm:h-24 -ml-0.5 sm:-ml-1">
                  <Image
                    src={getPersonaArtworkPath(trip.persona)}
                    alt={trip.persona}
                    width={96}
                    height={96}
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-serif text-[var(--color-tc-ink)] leading-tight whitespace-nowrap">
                    {trip.persona}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-[var(--color-tc-teal)] mt-0.5">
                    Persona
                  </p>
                </div>
              </div>

              {/* Middle / Right: Destination & Total Days (Divider moved far left; Dynamic typography for long city names) */}
              <div className="flex-1 sm:border-l-2 sm:border-[var(--color-tc-sage)]/30 sm:pl-4 md:pl-5 pt-3 sm:pt-0 border-t-2 border-[var(--color-tc-sage)]/30 sm:border-t-0 flex flex-col justify-center min-w-0">
                <h2
                  className={`font-bold font-serif text-[var(--color-tc-ink)] leading-[1.1] break-words [hyphens:manual] ${destTypo.city}`}
                  title={trip.destination}
                >
                  {formatCityWithSoftHyphens(trip.destination)}
                </h2>
                {trip.destinationAdmin1 && (
                  <p
                    className={`font-serif font-semibold text-[var(--color-tc-ink)]/70 leading-snug break-words ${destTypo.admin1}`}
                    title={trip.destinationAdmin1}
                  >
                    {trip.destinationAdmin1}
                  </p>
                )}
                <p className="text-xs sm:text-sm font-bold text-[var(--color-tc-teal)] mt-1">
                  {trip.days} {trip.days === 1 ? 'Day Excursion' : 'Days Total'}
                </p>
              </div>
            </div>
          </div>

          {/* Weather Card (Compact & Shrunk) */}
          <div className="w-full lg:w-[250px] xl:w-[280px] shrink-0 flex flex-col">
            <WeatherSummary
              summary={selectedDay.weatherSummary}
              weatherState={selectedDay.weatherState}
              isEstimatedWeather={selectedDay.isEstimatedWeather}
              weatherSource={selectedDay.weatherSource}
              weatherConfidence={selectedDay.weatherConfidence}
              weatherResolution={selectedDay.weatherResolution}
            />
          </div>
        </div>{/* Content Area: Map + Itinerary */}
        <div className="flex flex-col lg:flex-row gap-8 pb-8">
          {/* Left: Interactive Map with Pan-on-Hover */}
          <div className="w-full lg:w-1/3 shrink-0 no-print">
            <div className="sticky top-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-tc-ink)]/60">
                  Interactive Map
                </span>
                <span className="text-[10px] font-semibold text-[var(--color-tc-tangerine)] bg-[var(--color-tc-parchment)] px-2 py-0.5 rounded-full">
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
          <div className="flex-1 bg-[var(--color-tc-cream)] rounded-2xl p-6 lg:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-[var(--color-tc-sage)]/50">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-[var(--color-tc-sage)]/50">
              <div>
                <h2 className="text-2xl font-bold font-serif text-[var(--color-tc-ink)] tracking-tight">
                  Day {selectedDay.dayNumber} Timeline
                </h2>
                <p className="text-xs font-medium text-[var(--color-tc-ink)]/50 mt-0.5">
                  {formatDestinationDate(
                    selectedDay.date,
                    {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    },
                    trip.destinationTimezone
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 no-print">
                
                

                <div className="flex items-center gap-1 bg-[var(--color-tc-parchment)] p-1 rounded-xl">
                  <button
                    disabled={selectedDayIndex === 0}
                    onClick={() =>
                      setSelectedDayIndex((prev) => (prev > 0 ? prev - 1 : prev))
                    }
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      selectedDayIndex === 0 
                        ? 'bg-transparent text-[var(--color-tc-ink)]/70 cursor-not-allowed' 
                        : 'bg-[var(--color-tc-cream)] shadow-2xs text-[var(--color-tc-ink)] hover:text-[var(--color-tc-tangerine)]'
                    }`}
                    title="Previous Day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-[var(--color-tc-ink)] px-2 min-w-[3.5rem] text-center">
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
                        ? 'bg-transparent text-[var(--color-tc-ink)]/70 cursor-not-allowed' 
                        : 'bg-[var(--color-tc-cream)] shadow-2xs text-[var(--color-tc-ink)] hover:text-[var(--color-tc-tangerine)]'
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
                items={selectedDay.morning}
                startIndex={0}
                selectedId={selectedItemId}
                hoveredId={hoveredItemId}
                onSelect={setSelectedItemId}
                onHover={setHoveredItemId}
              />
              <ItinerarySection
                title="Afternoon"
                items={selectedDay.afternoon}
                startIndex={selectedDay.morning.length}
                selectedId={selectedItemId}
                hoveredId={hoveredItemId}
                onSelect={setSelectedItemId}
                onHover={setHoveredItemId}
              />
              <ItinerarySection
                title="Evening"
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
      <div className="w-80 shrink-0 bg-[var(--color-tc-cream)] border-l border-[var(--color-tc-sage)]/50 flex flex-col h-full overflow-y-auto hidden xl:flex no-print">
        {/* Calendar Widget */}
        <div className="px-6 pt-6 py-4">
          <h3 className="text-xl font-bold font-serif text-[var(--color-tc-ink)] mb-4">Journey Calendar</h3>

          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <div key={d} className="text-[10px] font-bold text-[var(--color-tc-ink)]/50">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
            {(() => {
              const { year, month } = parseDateParts(trip.startDate);
              const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
              
              const firstDayOfWeek = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
              const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
              
              const grid = [];
              for (let i = 0; i < offset; i++) {
                grid.push(<div key={`empty-${i}`} className="w-7 h-7 mx-auto" />);
              }
              
              const tripDates = trip.itineraryDays.map(d => ({
                dayNum: parseDateParts(d.date).day,
                tripDayIndex: trip.itineraryDays.indexOf(d),
                id: d.id
              }));

              for (let i = 1; i <= daysInMonth; i++) {
                const tripDayInfo = tripDates.find(td => td.dayNum === i);
                
                if (tripDayInfo) {
                  const isSelected = selectedDayIndex === tripDayInfo.tripDayIndex;
                  let className = 'py-1 text-xs font-bold rounded-xl cursor-pointer transition-all mx-auto w-7 h-7 flex items-center justify-center ';
                  if (isSelected) {
                    className += 'bg-[var(--color-tc-ink)] text-[var(--color-tc-cream)] shadow-[2px_2px_0px_rgba(23,60,57,0.1)] scale-105';
                  } else {
                    className += 'bg-[var(--color-tc-parchment)] text-[var(--color-tc-tangerine)] hover:bg-[var(--color-tc-ink)]/20';
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
                      <div className="py-1 text-xs font-medium text-[var(--color-tc-ink)]/70 w-7 h-7 flex items-center justify-center">
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
          <div className="h-px w-full bg-[var(--color-tc-parchment)]"></div>
        </div>

        {/* Collaborative Day Notes */}
        <div className="flex-1 px-6 pb-6 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold font-serif text-[var(--color-tc-ink)]">
              Day {selectedDay.dayNumber} Notes
            </h3>
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
function ItinerarySection({
  title,
  items,
  startIndex,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: {
  title: string;
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
        <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-[var(--color-tc-ink)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-tc-ink)]"></span>
          {title}
        </h3>
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
                    ? 'bg-[var(--color-tc-saffron)]/10/80 shadow-[4px_4px_0px_rgba(23,60,57,0.15)] border-[var(--color-tc-saffron)] scale-[1.01]'
                    : 'bg-[var(--color-tc-parchment)]/90 shadow-[4px_4px_0px_rgba(23,60,57,0.15)] border-[var(--color-tc-ink)]/40 scale-[1.01]'
                  : 'bg-[var(--color-tc-cream)] hover:bg-[var(--color-tc-parchment)]/60 border-[var(--color-tc-sage)]/50 hover:border-[var(--color-tc-sage)]'
              }`}
            >
              {/* Left Slot Accent Bar */}
              {(isSelected || isHovered) && (
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${
                    isFlex ? 'bg-[var(--color-tc-saffron)]/10' : 'bg-[var(--color-tc-ink)]'
                  }`}
                />
              )}

              {/* Numerical Index Badge */}
              <div
                className={`w-6 h-6 rounded-lg text-xs font-bold font-serif flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isSelected || isHovered
                    ? isFlex
                      ? 'bg-[var(--color-tc-saffron)]/10 text-[var(--color-tc-ink)]'
                      : 'bg-[var(--color-tc-ink)] text-[var(--color-tc-ink)]'
                    : 'bg-[var(--color-tc-parchment)] text-[var(--color-tc-ink)]/60 group-hover:bg-[var(--color-tc-parchment)]'
                }`}
              >
                {index + 1}
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4
                      className={`font-bold font-serif text-sm tracking-tight ${
                        isSelected || isHovered ? 'text-[var(--color-tc-ink)]' : 'text-[var(--color-tc-ink)]'
                      }`}
                    >
                      {item.title}
                    </h4>
                    {item.startTime && item.endTime && (
                      <span className="text-[11px] font-mono font-bold text-[var(--color-tc-ink)]/80 bg-[var(--color-tc-parchment)] px-2 py-0.5 rounded-md flex items-center gap-1 border border-[var(--color-tc-sage)]/60">
                        <Clock className="w-3 h-3 text-[var(--color-tc-tangerine)]" />
                        {item.startTime} – {item.endTime}
                      </span>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.continuationOfId && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-[var(--color-tc-ink)] border border-purple-200">
                        Trail Continuation
                      </span>
                    )}
                    {item.linkedExpeditionId && !item.continuationOfId && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-[var(--color-tc-ink)] border border-indigo-200">
                        Expedition Phase
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                    >
                      {item.category}
                    </span>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        item.indoor
                          ? 'bg-[var(--color-tc-tangerine)]/10 text-[var(--color-tc-tangerine)] border border-[var(--color-tc-tangerine)]'
                          : 'bg-[var(--color-tc-teal)]/10 text-[var(--color-tc-teal)] border border-[var(--color-tc-teal)]'
                      }`}
                    >
                      {item.indoor ? 'Indoor' : 'Outdoor'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[var(--color-tc-ink)]/70 leading-relaxed font-medium">
                  {cleanReason(item.reason)}
                </p>

                {isFlex && item.flexReason && (
                  <p className="mt-1.5 text-[11px] font-bold text-[var(--color-tc-saffron)] bg-[var(--color-tc-saffron)]/10 px-2 py-0.5 rounded-md inline-block">
                    Notice: {cleanFlexReason(item.flexReason)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
