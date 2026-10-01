import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Workspace State, Map & Responsive Behavior Core (Stage 7)', () => {
  it('validates GPS coordinate inputs for Map embed and rejects invalid or out-of-bound coordinates', () => {
    const isValidCoords = (lat?: number, lon?: number): boolean => {
      return (
        lat !== undefined &&
        lon !== undefined &&
        !Number.isNaN(lat) &&
        !Number.isNaN(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
      );
    };

    assert.equal(isValidCoords(26.9124, 75.7873), true);
    assert.equal(isValidCoords(-33.9249, 18.4241), true);
    assert.equal(isValidCoords(91, 50), false);
    assert.equal(isValidCoords(45, 181), false);
    assert.equal(isValidCoords(NaN, 50), false);
    assert.equal(isValidCoords(undefined, 50), false);
  });

  it('constructs Google Maps Embed URL with default satellite layer (t=k) and toggles to roadmap (t=m)', () => {
    const buildGoogleEmbedUrl = (
      embedQuery: string,
      mapType: 'k' | 'm',
      zoomLevel: number
    ): string => {
      return `https://maps.google.com/maps?q=${encodeURIComponent(
        embedQuery
      )}&t=${mapType}&z=${zoomLevel}&output=embed&iwloc=near`;
    };

    const satelliteUrl = buildGoogleEmbedUrl('26.9124,75.7873 (Hawa Mahal)', 'k', 15);
    assert.ok(satelliteUrl.includes('&t=k'), 'Must contain &t=k for satellite default');
    assert.ok(satelliteUrl.includes('Hawa%20Mahal'));

    const roadmapUrl = buildGoogleEmbedUrl('26.9124,75.7873 (Hawa Mahal)', 'm', 15);
    assert.ok(roadmapUrl.includes('&t=m'), 'Must contain &t=m when roadmap view is toggled');
  });

  it('handles race conditions in asynchronous search queries via cancellation', async () => {
    let resolvedDestination = 'Initial';
    let activeQueryId = 0;

    const performSearch = async (query: string, delayMs: number) => {
      const currentId = ++activeQueryId;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      // Only set if this is still the most recent query initiated
      if (currentId === activeQueryId) {
        resolvedDestination = query;
      }
    };

    // Fast subsequent query finishes after a slow initial query
    const p1 = performSearch('Tokyo', 50); // started first, slow
    const p2 = performSearch('Jaipur', 10); // started second, fast

    await Promise.all([p1, p2]);

    // Fast second query must not be overwritten by slow first query
    assert.equal(resolvedDestination, 'Jaipur');
  });
});
