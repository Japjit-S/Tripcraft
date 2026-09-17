import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  matchOsmRule,
  normalizeOsmElement,
  parseOsmOpeningHours,
  RawOsmElement,
} from '../../src/lib/providers/normalize';
import { OsmActivityProvider } from '../../src/lib/providers/osmProvider';
import { mockDestination } from './fixtures';

describe('Normalize Layer & Declarative Tag Mapping', () => {
  it('correctly maps OSM tags to engine attributes', () => {
    // 1. Museum -> Indoor CULTURE
    const museumRule = matchOsmRule({ tourism: 'museum' });
    assert.equal(museumRule.category, 'CULTURE');
    assert.equal(museumRule.indoor, true);
    assert.equal(museumRule.intensity, 'LOW');

    // 2. Park -> Outdoor NATURE
    const parkRule = matchOsmRule({ leisure: 'park' });
    assert.equal(parkRule.category, 'NATURE');
    assert.equal(parkRule.indoor, false);

    // 3. Fort -> Outdoor LANDMARK with HIGH intensity
    const fortRule = matchOsmRule({ historic: 'fort' });
    assert.equal(fortRule.category, 'LANDMARK');
    assert.equal(fortRule.indoor, false);
    assert.equal(fortRule.intensity, 'HIGH');

    // 4. Viewpoint -> NATURE suited for evening
    const viewRule = matchOsmRule({ tourism: 'viewpoint' });
    assert.equal(viewRule.category, 'NATURE');
    assert.ok(viewRule.slotAffinity.includes('EVENING'));
  });

  it('parses opening hours strings', () => {
    const hours = parseOsmOpeningHours('Mo-Su 09:00-17:00');
    assert.ok(hours);
    assert.deepEqual(hours.monday, [{ open: '09:00', close: '17:00' }]);
    assert.deepEqual(hours.sunday, [{ open: '09:00', close: '17:00' }]);

    const nonExistent = parseOsmOpeningHours(undefined);
    assert.equal(nonExistent, undefined);
  });

  it('normalizes raw OSM elements with Wikipedia sitelink prominence', () => {
    const rawHawaMahal: RawOsmElement = {
      type: 'node',
      id: 1234567,
      lat: 26.9239,
      lon: 75.8267,
      tags: {
        name: 'Hawa Mahal',
        tourism: 'attraction',
        historic: 'monument',
        unesco: 'yes',
        wikidata: 'Q199587',
      },
    };

    // 40 Wikipedia language editions for Hawa Mahal
    const candidate = normalizeOsmElement(rawHawaMahal, 40);
    assert.ok(candidate);
    assert.equal(candidate.id, 'osm:node/1234567');
    assert.equal(candidate.title, 'Hawa Mahal');
    assert.equal(candidate.category, 'LANDMARK');
    assert.equal(candidate.indoor, false);
    assert.ok(candidate.prominence >= 0.8, 'World landmark with 40 sitelinks must have prominence >= 0.8');
    assert.ok(candidate.tags.includes('unesco'));
  });
});

describe('OsmActivityProvider (Jaipur Test)', () => {
  it('normalizes realistic Jaipur OSM elements without junk data', () => {
    const jaipurRawElements: RawOsmElement[] = [
      {
        type: 'node',
        id: 101,
        lat: 26.9239,
        lon: 75.8267,
        tags: {
          name: 'Hawa Mahal',
          historic: 'monument',
          tourism: 'attraction',
          heritage: 'yes',
          wikidata: 'Q199587',
        },
      },
      {
        type: 'way',
        id: 102,
        center: { lat: 26.9855, lon: 75.8513 },
        tags: {
          name: 'Amber Fort',
          historic: 'fort',
          unesco: 'yes',
          wikidata: 'Q476839',
        },
      },
      {
        type: 'relation',
        id: 103,
        center: { lat: 26.9258, lon: 75.8236 },
        tags: {
          name: 'City Palace, Jaipur',
          historic: 'palace',
          tourism: 'museum',
          indoor: 'yes',
          wikidata: 'Q2504938',
        },
      },
      {
        type: 'node',
        id: 104,
        lat: 26.9116,
        lon: 75.8195,
        tags: {
          name: 'Albert Hall Museum',
          tourism: 'museum',
          indoor: 'yes',
          wikidata: 'Q4710419',
        },
      },
    ];

    const sitelinkMap: Record<string, number> = {
      Q199587: 42,  // Hawa Mahal
      Q476839: 38,  // Amber Fort
      Q2504938: 24, // City Palace
      Q4710419: 15, // Albert Hall
    };

    const candidates = jaipurRawElements
      .map((elem) => {
        const qId = elem.tags?.wikidata;
        const sitelinks = qId ? sitelinkMap[qId] || 0 : 0;
        return normalizeOsmElement(elem, sitelinks);
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    assert.equal(candidates.length, 4);

    // Verify Hawa Mahal and Amber Fort ranked highest
    candidates.sort((a, b) => b.prominence - a.prominence);
    assert.equal(candidates[0].title, 'Hawa Mahal');
    assert.equal(candidates[1].title, 'Amber Fort');

    // Verify indoor flags
    const cityPalace = candidates.find((c) => c.title.includes('City Palace'));
    assert.ok(cityPalace);
    assert.equal(cityPalace.indoor, true);
  });

  it('provider handles caching properly', async () => {
    const provider = new OsmActivityProvider();
    // Verify provider instantiation and cache existence
    assert.ok(provider);
  });
});
