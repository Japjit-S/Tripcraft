import {
  ActivityProvider,
  CandidateActivity,
  Destination,
} from '../types/engine';

import agraPack from './curated/agra.json';
import delhiPack from './curated/delhi.json';
import goaPack from './curated/goa.json';
import jaipurPack from './curated/jaipur.json';
import udaipurPack from './curated/udaipur.json';
import varanasiPack from './curated/varanasi.json';

const CURATED_PACKS: Record<string, CandidateActivity[]> = {
  jaipur: jaipurPack as CandidateActivity[],
  delhi: delhiPack as CandidateActivity[],
  agra: agraPack as CandidateActivity[],
  varanasi: varanasiPack as CandidateActivity[],
  udaipur: udaipurPack as CandidateActivity[],
  goa: goaPack as CandidateActivity[],
};

const CITY_ALIASES: Record<string, string> = {
  'new delhi': 'delhi',
  'dilli': 'delhi',
  'amer': 'jaipur',
  'banaras': 'varanasi',
  'kashi': 'varanasi',
  'panaji': 'goa',
  'panjim': 'goa',
  'north goa': 'goa',
  'south goa': 'goa',
};

/**
 * Normalizes city string to match supported curated pack keys.
 */
function resolveCityKey(cityName: string): string | null {
  const cleaned = cityName.trim().toLowerCase();
  if (CURATED_PACKS[cleaned]) {
    return cleaned;
  }
  if (CITY_ALIASES[cleaned]) {
    return CITY_ALIASES[cleaned];
  }
  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    if (cleaned.includes(alias) || alias.includes(cleaned)) {
      return canonical;
    }
  }
  for (const key of Object.keys(CURATED_PACKS)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return key;
    }
  }
  return null;
}

/**
 * Provider A: Hand-curated candidate activity provider.
 * Delivers offline, high-fidelity activity pools for top flagship destinations.
 */
export class CuratedPackProvider implements ActivityProvider {
  /**
   * Returns list of canonically supported curated city names.
   */
  getAvailableCities(): string[] {
    return Object.keys(CURATED_PACKS).map(
      (c) => c.charAt(0).toUpperCase() + c.slice(1)
    );
  }

  /**
   * Checks if a destination city has a curated pack available.
   */
  hasPack(cityName: string): boolean {
    return resolveCityKey(cityName) !== null;
  }

  /**
   * Retrieves normalized candidates for the given destination.
   */
  async getCandidates(dest: Destination): Promise<CandidateActivity[]> {
    const key = resolveCityKey(dest.city);
    if (!key || !CURATED_PACKS[key]) {
      const supported = this.getAvailableCities().join(', ');
      throw new Error(
        `No curated pack available for destination "${dest.city}". Curated destinations include: ${supported}.`
      );
    }

    // Return a clone to ensure immutability
    return JSON.parse(JSON.stringify(CURATED_PACKS[key])) as CandidateActivity[];
  }
}
