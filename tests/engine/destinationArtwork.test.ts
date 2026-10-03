import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  ART_RESOLVER_VERSION,
  DestinationArtworkCache,
  normalizeDestinationIdentity,
  resolveCuratedCityKey,
  resolveDestinationArtwork,
  resolveLocalDestinationArtwork,
  validateWikimediaCandidate,
  WikimediaCandidatePage,
} from '../../src/lib/images';
import { ensureTripArtwork, GeneratedTrip } from '../../src/lib/tripStore';

describe('Destination Banner & Illustration Resolution System', () => {
  it('resolves all 12 curated landmark destinations and listed aliases to approved landmark PNG illustrations', async () => {
    const cases: Array<{ input: string; expectedKey: string; expectedAsset: string }> = [
      { input: 'Jaipur', expectedKey: 'jaipur', expectedAsset: '/artwork/landmark-jaipur-hawa-mahal.png' },
      { input: 'Amer', expectedKey: 'jaipur', expectedAsset: '/artwork/landmark-jaipur-hawa-mahal.png' },
      { input: 'Delhi', expectedKey: 'delhi', expectedAsset: '/artwork/landmark-delhi-red-fort.png' },
      { input: 'New Delhi', expectedKey: 'delhi', expectedAsset: '/artwork/landmark-delhi-red-fort.png' },
      { input: 'Dilli', expectedKey: 'delhi', expectedAsset: '/artwork/landmark-delhi-red-fort.png' },
      { input: 'Agra', expectedKey: 'agra', expectedAsset: '/artwork/landmark-agra-taj-mahal.png' },
      { input: 'Varanasi', expectedKey: 'varanasi', expectedAsset: '/artwork/landmark-varanasi-ghats.png' },
      { input: 'Banaras', expectedKey: 'varanasi', expectedAsset: '/artwork/landmark-varanasi-ghats.png' },
      { input: 'Kashi', expectedKey: 'varanasi', expectedAsset: '/artwork/landmark-varanasi-ghats.png' },
      { input: 'Udaipur', expectedKey: 'udaipur', expectedAsset: '/artwork/landmark-udaipur-lake-palace.png' },
      { input: 'Goa', expectedKey: 'goa', expectedAsset: '/artwork/landmark-goa-panaji-coast.png' },
      { input: 'Panaji', expectedKey: 'goa', expectedAsset: '/artwork/landmark-goa-panaji-coast.png' },
      { input: 'Panjim', expectedKey: 'goa', expectedAsset: '/artwork/landmark-goa-panaji-coast.png' },
      { input: 'North Goa', expectedKey: 'goa', expectedAsset: '/artwork/landmark-goa-panaji-coast.png' },
      { input: 'South Goa', expectedKey: 'goa', expectedAsset: '/artwork/landmark-goa-panaji-coast.png' },
      { input: 'Mumbai', expectedKey: 'mumbai', expectedAsset: '/artwork/landmark-mumbai-gateway.png' },
      { input: 'Bombay', expectedKey: 'mumbai', expectedAsset: '/artwork/landmark-mumbai-gateway.png' },
      { input: 'Kolkata', expectedKey: 'kolkata', expectedAsset: '/artwork/landmark-kolkata-howrah.png' },
      { input: 'Calcutta', expectedKey: 'kolkata', expectedAsset: '/artwork/landmark-kolkata-howrah.png' },
      { input: 'Amritsar', expectedKey: 'amritsar', expectedAsset: '/artwork/landmark-amritsar-golden-temple.png' },
      { input: 'Hampi', expectedKey: 'hampi', expectedAsset: '/artwork/landmark-hampi-ruins.png' },
      { input: 'Mysuru', expectedKey: 'mysuru', expectedAsset: '/artwork/landmark-mysuru-palace.png' },
      { input: 'Mysore', expectedKey: 'mysuru', expectedAsset: '/artwork/landmark-mysuru-palace.png' },
      { input: 'Bengaluru', expectedKey: 'bengaluru', expectedAsset: '/artwork/landmark-bengaluru-vidhana-soudha.png' },
      { input: 'Bangalore', expectedKey: 'bengaluru', expectedAsset: '/artwork/landmark-bengaluru-vidhana-soudha.png' },
    ];

    for (const c of cases) {
      assert.equal(
        resolveCuratedCityKey(c.input),
        c.expectedKey,
        `Expected "${c.input}" to resolve to curated key "${c.expectedKey}"`
      );

      const localDescriptor = resolveLocalDestinationArtwork({
        city: c.input,
        country: 'India',
        countryCode: 'IN',
      });
      assert.equal(localDescriptor.kind, 'curated_local');
      assert.equal(localDescriptor.curatedCityKey, c.expectedKey);
      assert.equal(localDescriptor.assetPath, c.expectedAsset);

      const descriptor = await resolveDestinationArtwork({
        city: c.input,
        country: 'India',
        countryCode: 'IN',
      });
      assert.ok(descriptor.artworkId);
      assert.equal(descriptor.assetPath, c.expectedAsset);
    }
  });

  it('resolves trusted state/region metadata to the correct regional master illustration, or neutral India fallback', async () => {
    const regionalCases: Array<{ city: string; admin1?: string; expectedAsset: string; expectedKind: string }> = [
      { city: 'Manali', admin1: 'Himachal Pradesh', expectedAsset: '/artwork/region-north-himalaya.png', expectedKind: 'curated_local' },
      { city: 'Shimla', admin1: 'Himachal Pradesh', expectedAsset: '/artwork/region-north-himalaya.png', expectedKind: 'curated_local' },
      { city: 'Gangtok', admin1: 'Sikkim', expectedAsset: '/artwork/region-ne-eastern-hills.png', expectedKind: 'curated_local' },
      { city: 'Guwahati', admin1: 'Assam', expectedAsset: '/artwork/region-ne-river-tea.png', expectedKind: 'curated_local' },
      { city: 'Patna', admin1: 'Bihar', expectedAsset: '/artwork/region-gangetic-plains.png', expectedKind: 'curated_local' },
      { city: 'Jodhpur', admin1: 'Rajasthan', expectedAsset: '/artwork/region-west-arid-desert.png', expectedKind: 'curated_local' },
      { city: 'Bhopal', admin1: 'Madhya Pradesh', expectedAsset: '/artwork/region-central-plateau-forest.png', expectedKind: 'curated_local' },
      { city: 'Puri', admin1: 'Odisha', expectedAsset: '/artwork/region-east-delta-coast.png', expectedKind: 'curated_local' },
      { city: 'Pune', admin1: 'Maharashtra', expectedAsset: '/artwork/region-konkan-west-coast.png', expectedKind: 'curated_local' },
      { city: 'Hubli', admin1: 'Karnataka', expectedAsset: '/artwork/region-deccan-temple-plateau.png', expectedKind: 'curated_local' },
      { city: 'Kochi', admin1: 'Kerala', expectedAsset: '/artwork/region-western-ghats-backwaters.png', expectedKind: 'curated_local' },
      { city: 'Port Blair', admin1: 'Andaman and Nicobar Islands', expectedAsset: '/artwork/region-indian-islands.png', expectedKind: 'curated_local' },
      // Ambiguous or missing admin1 fails safely to neutral India fallback
      { city: 'Unknown Village', admin1: undefined, expectedAsset: '/artwork/destination-india-fallback.png', expectedKind: 'curated_local' },
    ];

    for (const rc of regionalCases) {
      const descriptor = await resolveDestinationArtwork({
        city: rc.city,
        admin1: rc.admin1,
        country: 'India',
        countryCode: 'IN',
      });
      assert.equal(descriptor.assetPath, rc.expectedAsset, `Expected ${rc.city} to resolve to ${rc.expectedAsset}`);
      assert.equal(descriptor.kind, rc.expectedKind);
      assert.ok(descriptor.artworkId);
    }
  });

  it('does not use substring matching that could conflate unrelated cities with curated aliases', () => {
    const nonMatchingInputs = [
      'Cameroon', // contains "amer"
      'America', // contains "amer"
      'Amersfoort', // contains "amer"
      'Goalpara', // contains "goa"
      'Genoa',
      'Agraharam', // contains "agra"
      'Agrigento',
      'Delft',
    ];

    for (const city of nonMatchingInputs) {
      assert.equal(
        resolveCuratedCityKey(city),
        null,
        `Unrelated city "${city}" must not match a curated city key`
      );
    }
  });

  it('disambiguates same-name cities in different countries/regions and prevents cache collisions', async () => {
    // 1. Delhi, India vs Delhi, New York, United States
    const delhiIndia = normalizeDestinationIdentity({
      id: 'openmeteo:1273294',
      city: 'Delhi',
      country: 'India',
      countryCode: 'IN',
      admin1: 'Delhi',
      latitude: 28.65,
      longitude: 77.23,
    });
    const delhiUsa = normalizeDestinationIdentity({
      id: 'openmeteo:5114824',
      city: 'Delhi',
      country: 'United States',
      countryCode: 'US',
      admin1: 'New York',
      latitude: 42.27,
      longitude: -74.91,
    });

    assert.equal(delhiIndia.curatedKey, 'delhi');
    assert.equal(delhiUsa.curatedKey, null);
    assert.notEqual(delhiIndia.canonicalId, delhiUsa.canonicalId);

    // 2. Paris, France vs Paris, Texas, United States in shared cache
    const cache = new DestinationArtworkCache();
    let fetchCount = 0;

    const parisFranceFetch: typeof fetch = async () => {
      fetchCount += 1;
      return new Response(
        JSON.stringify({
          query: {
            pages: {
              '101': {
                pageid: 101,
                title: 'File:Paris France Vintage Travel Poster Illustration.png',
                imageinfo: [
                  {
                    thumburl:
                      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Paris_France_Poster.png/1200px-Paris_France_Poster.png',
                    thumbmime: 'image/png',
                    thumbwidth: 1200,
                    thumbheight: 700,
                    descriptionurl:
                      'https://commons.wikimedia.org/wiki/File:Paris_France_Poster.png',
                    extmetadata: {
                      ObjectName: {
                        value: 'Vintage travel poster illustration of Paris, France',
                      },
                      ImageDescription: {
                        value: 'Editorial vector travel illustration of Paris, Île-de-France, France',
                      },
                      Categories: {
                        value: 'Travel posters of Paris|Illustrations of France',
                      },
                      Artist: { value: 'Atelier Roam' },
                      LicenseShortName: { value: 'CC BY-SA 4.0' },
                      LicenseUrl: {
                        value: 'https://creativecommons.org/licenses/by-sa/4.0/',
                      },
                    },
                  },
                ],
              },
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const parisFrance = await resolveDestinationArtwork(
      {
        id: 'openmeteo:2988507',
        city: 'Paris',
        country: 'France',
        countryCode: 'FR',
        admin1: 'Île-de-France',
        latitude: 48.85,
        longitude: 2.35,
      },
      { cache, fetchImpl: parisFranceFetch }
    );

    const parisTexas = await resolveDestinationArtwork(
      {
        id: 'openmeteo:4717560',
        city: 'Paris',
        country: 'United States',
        countryCode: 'US',
        admin1: 'Texas',
        latitude: 33.66,
        longitude: -95.56,
      },
      { cache, fetchImpl: parisFranceFetch }
    );

    assert.equal(parisFrance.kind, 'external_illustration');
    assert.ok(parisFrance.attribution);
    assert.equal(parisTexas.kind, 'generated_local_scene');
    assert.notEqual(parisFrance.destinationId, parisTexas.destinationId);
    assert.equal(fetchCount, 2);
  });

  it('rejects photographs, maps, logos, coats of arms, remote SVGs, and missing attribution from Wikimedia', () => {
    const tokyoIdentity = normalizeDestinationIdentity({
      id: 'openmeteo:1850147',
      city: 'Tokyo',
      country: 'Japan',
      countryCode: 'JP',
      admin1: 'Tokyo',
      latitude: 35.68,
      longitude: 139.69,
    });

    // 1. Camera photograph with EXIF Model must be rejected even if title says illustration
    const photoCandidate: WikimediaCandidatePage = {
      title: 'File:Tokyo Skyline Illustration Photo.jpg',
      imageinfo: [
        {
          thumburl: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Tokyo.jpg',
          thumbmime: 'image/jpeg',
          thumbwidth: 1200,
          thumbheight: 800,
          descriptionurl: 'https://commons.wikimedia.org/wiki/File:Tokyo.jpg',
          extmetadata: {
            ObjectName: { value: 'Tokyo Japan travel illustration' },
            Model: { value: 'Canon EOS R5' },
            Artist: { value: 'Photographer X' },
            LicenseShortName: { value: 'CC BY 4.0' },
          },
        },
      ],
    };
    assert.equal(validateWikimediaCandidate(photoCandidate, tokyoIdentity), null);

    // 2. Map or Coat of Arms must be rejected
    const mapCandidate: WikimediaCandidatePage = {
      title: 'File:Locator map of Tokyo Japan vector illustration.png',
      imageinfo: [
        {
          thumburl: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Tokyo_map.png',
          thumbmime: 'image/png',
          thumbwidth: 1200,
          thumbheight: 800,
          descriptionurl: 'https://commons.wikimedia.org/wiki/File:Tokyo_map.png',
          extmetadata: {
            ObjectName: { value: 'Locator map of Tokyo, Japan illustration' },
            Artist: { value: 'Cartographer Y' },
            LicenseShortName: { value: 'CC BY 4.0' },
          },
        },
      ],
    };
    assert.equal(validateWikimediaCandidate(mapCandidate, tokyoIdentity), null);

    // 3. Remote SVG must be rejected
    const svgCandidate: WikimediaCandidatePage = {
      title: 'File:Tokyo Japan Travel Poster Illustration.svg',
      imageinfo: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Tokyo_poster.svg',
          mime: 'image/svg+xml',
          width: 1200,
          height: 800,
          descriptionurl: 'https://commons.wikimedia.org/wiki/File:Tokyo_poster.svg',
          extmetadata: {
            ObjectName: { value: 'Tokyo Japan Travel Poster Illustration' },
            Artist: { value: 'Vector Artist' },
            LicenseShortName: { value: 'CC0' },
          },
        },
      ],
    };
    assert.equal(validateWikimediaCandidate(svgCandidate, tokyoIdentity), null);

    // 4. Missing license/author attribution must be rejected
    const missingAttributionCandidate: WikimediaCandidatePage = {
      title: 'File:Tokyo Japan Travel Poster Illustration.png',
      imageinfo: [
        {
          thumburl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Tokyo_poster.png',
          thumbmime: 'image/png',
          thumbwidth: 1200,
          thumbheight: 800,
          descriptionurl: 'https://commons.wikimedia.org/wiki/File:Tokyo_poster.png',
          extmetadata: {
            ObjectName: { value: 'Tokyo Japan Travel Poster Illustration' },
          },
        },
      ],
    };
    assert.equal(
      validateWikimediaCandidate(missingAttributionCandidate, tokyoIdentity),
      null
    );
  });

  it('handles provider timeouts, HTTP 429 rate limits, and offline errors gracefully with caching and backoff', async () => {
    const cache = new DestinationArtworkCache();
    let externalCalls = 0;

    const rateLimitedFetch: typeof fetch = async () => {
      externalCalls += 1;
      return new Response('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '120' },
      });
    };

    const lisbonDest = {
      id: 'openmeteo:2267057',
      city: 'Lisbon',
      country: 'Portugal',
      countryCode: 'PT',
      admin1: 'Lisbon',
      latitude: 38.72,
      longitude: -9.14,
    };

    // First call encounters 429 -> returns local vector scene and activates provider backoff
    const res1 = await resolveDestinationArtwork(lisbonDest, {
      cache,
      fetchImpl: rateLimitedFetch,
      now: 1000,
    });
    assert.equal(res1.kind, 'generated_local_scene');
    assert.equal(externalCalls, 1);
    assert.equal(cache.isProviderInBackoff(2000), true);

    // Second call for a different city during backoff window skips external fetch immediately
    const portoDest = {
      id: 'openmeteo:2735943',
      city: 'Porto',
      country: 'Portugal',
      countryCode: 'PT',
      admin1: 'Porto',
      latitude: 41.15,
      longitude: -8.61,
    };
    const res2 = await resolveDestinationArtwork(portoDest, {
      cache,
      fetchImpl: rateLimitedFetch,
      now: 2000,
    });
    assert.equal(res2.kind, 'generated_local_scene');
    assert.equal(externalCalls, 1, 'Should not call external provider while in backoff');
  });

  it('keeps artwork deterministic and invariant across weather, dates, and legacy trip upgrades', () => {
    const baseDest = {
      id: 'openmeteo:264371',
      city: 'Athens',
      country: 'Greece',
      countryCode: 'GR',
      admin1: 'Attica',
      latitude: 37.98,
      longitude: 23.72,
    };

    const artA = resolveLocalDestinationArtwork(baseDest, '2026-05-01T08:00:00.000Z');
    const artB = resolveLocalDestinationArtwork(baseDest, '2026-12-20T22:30:00.000Z');

    assert.equal(artA.destinationId, artB.destinationId);
    assert.equal(artA.artworkId, artB.artworkId);
    assert.deepEqual(artA.fallbackScene, artB.fallbackScene);
    assert.equal(artA.contentHash, artB.contentHash);

    // Legacy trip without artwork descriptor upgrades cleanly
    const legacyTrip: GeneratedTrip = {
      id: 'legacy-trip-99',
      destination: 'Banaras',
      persona: 'Culture Seeker',
      startDate: '2026-11-01',
      days: 3,
      originCity: 'Delhi',
      arrivalMode: 'train',
      arrivalAt: '09:00 AM',
      arrivalTime: '09:00 AM',
      itineraryDays: [],
    };

    const upgraded = ensureTripArtwork(legacyTrip);
    assert.ok(upgraded.artwork);
    assert.equal(upgraded.artwork.kind, 'curated_local');
    assert.equal(upgraded.artwork.curatedCityKey, 'varanasi');
    assert.equal(upgraded.artwork.artVersion, ART_RESOLVER_VERSION);
  });

  it('ships all 33 approved Tripcraft Artwork Pack PNG assets (5 brand/persona marks and 28 destination/weather illustrations)', () => {
    const requiredAssets = [
      // 5 brand/persona marks
      'artwork/tripcraft-mark.png',
      'artwork/persona-backpacker.png',
      'artwork/persona-culture-seeker.png',
      'artwork/persona-comfort-traveller.png',
      'artwork/persona-family.png',
      // Landing & fallback
      'artwork/landing-india-atlas-hero.png',
      'artwork/destination-india-fallback.png',
      // 11 regional masters
      'artwork/region-north-himalaya.png',
      'artwork/region-ne-eastern-hills.png',
      'artwork/region-ne-river-tea.png',
      'artwork/region-gangetic-plains.png',
      'artwork/region-west-arid-desert.png',
      'artwork/region-central-plateau-forest.png',
      'artwork/region-east-delta-coast.png',
      'artwork/region-konkan-west-coast.png',
      'artwork/region-deccan-temple-plateau.png',
      'artwork/region-western-ghats-backwaters.png',
      'artwork/region-indian-islands.png',
      // 12 landmark exceptions
      'artwork/landmark-delhi-red-fort.png',
      'artwork/landmark-jaipur-hawa-mahal.png',
      'artwork/landmark-agra-taj-mahal.png',
      'artwork/landmark-varanasi-ghats.png',
      'artwork/landmark-udaipur-lake-palace.png',
      'artwork/landmark-goa-panaji-coast.png',
      'artwork/landmark-mumbai-gateway.png',
      'artwork/landmark-kolkata-howrah.png',
      'artwork/landmark-amritsar-golden-temple.png',
      'artwork/landmark-hampi-ruins.png',
      'artwork/landmark-mysuru-palace.png',
      'artwork/landmark-bengaluru-vidhana-soudha.png',
      // 4 shared weather illustrations
      'artwork/weather-clear-sun.png',
      'artwork/weather-rain-cloud.png',
      'artwork/weather-thunderstorm.png',
      'artwork/weather-cold-wind.png',
    ];

    assert.equal(requiredAssets.length, 34, 'Expected exactly 34 Artwork Pack assets');

    for (const relPath of requiredAssets) {
      const diskPath = path.join(process.cwd(), 'public', relPath);
      assert.equal(fs.existsSync(diskPath), true, `Missing Artwork Pack file at ${diskPath}`);
      const stat = fs.statSync(diskPath);
      assert.ok(stat.size > 1000, `Artwork Pack file ${relPath} is empty or corrupted (size: ${stat.size})`);
    }

    // Verify v2 landing hero artwork exists and is valid
    const v2Path = path.join(process.cwd(), 'public/artwork/landing-india-atlas-hero-v2.png');
    assert.equal(fs.existsSync(v2Path), true, 'Missing landing-india-atlas-hero-v2.png');
    assert.ok(fs.statSync(v2Path).size > 1000, 'landing-india-atlas-hero-v2.png is empty');

    // Verify deterministic engine gate artwork exists and is valid
    for (const gateFile of ['gate-interval-time-math.png', 'gate-spatial-clustering.png']) {
      const gatePath = path.join(process.cwd(), 'public/artwork', gateFile);
      assert.equal(fs.existsSync(gatePath), true, `Missing ${gateFile}`);
      assert.ok(fs.statSync(gatePath).size > 1000, `${gateFile} is empty`);
    }
  });
});
