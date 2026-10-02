export interface PersonaArtworkEntry {
  id: string;
  title: string;
  assetPath: string;
  alt: string;
}

export const PERSONA_ARTWORK: Record<string, PersonaArtworkEntry> = {
  Backpacker: {
    id: 'Backpacker',
    title: 'Backpacker',
    assetPath: '/artwork/persona-backpacker.png',
    alt: 'Backpacker persona mark',
  },
  'Culture Seeker': {
    id: 'Culture Seeker',
    title: 'Culture Seeker',
    assetPath: '/artwork/persona-culture-seeker.png',
    alt: 'Culture Seeker persona mark',
  },
  'Comfort Traveller': {
    id: 'Comfort Traveller',
    title: 'Comfort Traveller',
    assetPath: '/artwork/persona-comfort-traveller.png',
    alt: 'Comfort Traveller persona mark',
  },
  Family: {
    id: 'Family',
    title: 'Family',
    assetPath: '/artwork/persona-family.png',
    alt: 'Family persona mark',
  },
};

export function getPersonaArtworkPath(persona?: string | null): string {
  if (!persona) return '/artwork/persona-culture-seeker.png';
  const norm = persona.toLowerCase().replace(/[^a-z]/g, '');
  if (norm.includes('backpack')) return '/artwork/persona-backpacker.png';
  if (norm.includes('culture') || norm.includes('heritage')) return '/artwork/persona-culture-seeker.png';
  if (norm.includes('comfort') || norm.includes('traveler') || norm.includes('traveller')) return '/artwork/persona-comfort-traveller.png';
  if (norm.includes('family') || norm.includes('kid')) return '/artwork/persona-family.png';
  return '/artwork/persona-culture-seeker.png';
}
