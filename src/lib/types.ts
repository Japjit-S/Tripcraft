import { Persona, ArrivalMode, DestinationArtworkDescriptor } from './types/engine';
export type { Persona, ArrivalMode };

export interface ItineraryItem {
  id: string;
  title: string;
  category: string;
  reason: string;
  indoor: boolean;
  coords?: { lat: number; lon: number };
  isFlex?: boolean;
  flexReason?: string;
}

export interface TripDay {
  id: string;
  dayNumber: number;
  date: string;
  weatherSummary: string;
  morning: ItineraryItem[];
  afternoon: ItineraryItem[];
  evening: ItineraryItem[];
}

export interface Trip {
  id: string;
  destination: string;
  destinationId?: string;
  destinationCountry?: string;
  destinationCountryCode?: string;
  destinationAdmin1?: string;
  destinationCoords?: { lat: number; lon: number };
  bannerUrl?: string;
  artwork?: DestinationArtworkDescriptor;
  persona: Persona;
  startDate: string;
  days: number;
  originCity: string;
  arrivalMode: ArrivalMode;
  arrivalAt: string;
  arrivalTime: string;
  itineraryDays: TripDay[];
}

export interface Profile {
  id: string;
  displayName: string;
}

// Re-export all core engine types
export * from './types/engine';
