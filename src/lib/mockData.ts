import { Trip } from './types';

export const mockJaipurTrip: Trip = {
  id: 'trip-1',
  destination: 'Jaipur',
  persona: 'Culture Seeker',
  startDate: '2026-10-15',
  days: 3,
  originCity: 'New Delhi',
  arrivalMode: 'train',
  arrivalAt: '08:30 AM',
  arrivalTime: '11:45 AM',
  itineraryDays: [
    {
      id: 'day-1',
      dayNumber: 1,
      date: '2026-10-15',
      weatherSummary: 'Clear and sunny, 28°C',
      morning: [
        {
          id: 'item-1',
          title: 'Hawa Mahal',
          category: 'Sightseeing',
          reason: 'A must-see iconic landmark. Best visited early to catch the morning light and avoid crowds.',
          indoor: false,
        },
        {
          id: 'item-2',
          title: 'City Palace',
          category: 'History',
          reason: 'Located right next to Hawa Mahal, offering a deep dive into royal history.',
          indoor: true,
        }
      ],
      afternoon: [
        {
          id: 'item-3',
          title: 'Jantar Mantar',
          category: 'Education',
          reason: 'UNESCO World Heritage site with fascinating astronomical instruments.',
          indoor: false,
        }
      ],
      evening: [
        {
          id: 'item-4',
          title: 'Bapu Bazaar',
          category: 'Shopping',
          reason: 'Perfect for picking up traditional textiles and souvenirs in the evening.',
          indoor: false,
        }
      ]
    },
    {
      id: 'day-2',
      dayNumber: 2,
      date: '2026-10-16',
      weatherSummary: 'Partly cloudy, 26°C',
      morning: [
        {
          id: 'item-5',
          title: 'Amber Fort',
          category: 'History',
          reason: 'Majestic hilltop fort. Requires a few hours to explore fully.',
          indoor: false,
        }
      ],
      afternoon: [
        {
          id: 'item-6',
          title: 'Anokhi Museum of Hand Printing',
          category: 'Museum',
          reason: 'Learn about traditional block printing. Great indoor cultural activity.',
          indoor: true,
        }
      ],
      evening: [
        {
          id: 'item-7',
          title: 'Jal Mahal Viewpoint',
          category: 'Sightseeing',
          reason: 'Beautiful views of the water palace at sunset.',
          indoor: false,
        }
      ]
    },
    {
      id: 'day-3',
      dayNumber: 3,
      date: '2026-10-17',
      weatherSummary: 'Sunny, 29°C',
      morning: [
        {
          id: 'item-8',
          title: 'Albert Hall Museum',
          category: 'Museum',
          reason: 'Rajasthan\'s oldest museum featuring a rich collection of artifacts.',
          indoor: true,
        }
      ],
      afternoon: [
        {
          id: 'item-9',
          title: 'Patrika Gate',
          category: 'Photography',
          reason: 'Vibrant, colourful gates perfect for capturing memories.',
          indoor: false,
        }
      ],
      evening: [
        {
          id: 'item-10',
          title: 'Chokhi Dhani',
          category: 'Dining & Culture',
          reason: 'Immersive Rajasthani village experience with traditional food and entertainment.',
          indoor: false,
        }
      ]
    }
  ]
};

export const mockTripsList: Trip[] = [mockJaipurTrip];

export function getMockTrip(id: string): Trip | undefined {
  return mockTripsList.find((trip) => trip.id === id);
}
