import {
  ActivityProvider,
  CandidateActivity,
  CuratedCityKey,
  Destination,
} from '../types/engine';
import {
  DestinationIdentityInput,
  resolveCuratedCityKey,
} from '../images/canonicalDestination';

import agraPack from './curated/agra.json';
import delhiPack from './curated/delhi.json';
import goaPack from './curated/goa.json';
import jaipurPack from './curated/jaipur.json';
import udaipurPack from './curated/udaipur.json';
import varanasiPack from './curated/varanasi.json';

const CURATED_PACKS: Record<CuratedCityKey, CandidateActivity[]> = {
  jaipur: jaipurPack as CandidateActivity[],
  delhi: delhiPack as CandidateActivity[],
  agra: agraPack as CandidateActivity[],
  varanasi: varanasiPack as CandidateActivity[],
  udaipur: udaipurPack as CandidateActivity[],
  goa: goaPack as CandidateActivity[],
};

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
  hasPack(cityOrDest: string | DestinationIdentityInput): boolean {
    return resolveCuratedCityKey(cityOrDest) !== null;
  }

  /**
   * Retrieves normalized candidates for the given destination.
   */
  async getCandidates(dest: Destination): Promise<CandidateActivity[]> {
    const key = resolveCuratedCityKey(dest);
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
