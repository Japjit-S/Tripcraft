export type Persona = 'Backpacker' | 'Culture Seeker' | 'Comfort Traveller' | 'Family';
export type ArrivalMode = 'flight' | 'train' | 'bus';

export interface ItineraryItem {
  id: string;
  title: string;
  category: string;
  reason: string;
  indoor: boolean;
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
