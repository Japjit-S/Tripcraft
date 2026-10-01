import { NextRequest, NextResponse } from 'next/server';
import { resolveDestinationArtwork } from '@/lib/images/imageResolver';

/**
 * POST /api/destinations/artwork
 *
 * Server-side cache-first destination artwork resolution endpoint.
 * Used when upgrading legacy stored trips that lack an artwork descriptor.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, city, country, countryCode, admin1, latitude, longitude } =
      body || {};

    if (!city || typeof city !== 'string' || !city.trim()) {
      return NextResponse.json(
        { success: false, error: 'Destination city is required.' },
        { status: 400 }
      );
    }

    const artwork = await resolveDestinationArtwork({
      id: typeof id === 'string' ? id : undefined,
      city: city.trim(),
      country: typeof country === 'string' ? country : undefined,
      countryCode: typeof countryCode === 'string' ? countryCode : undefined,
      admin1: typeof admin1 === 'string' ? admin1 : undefined,
      latitude: typeof latitude === 'number' ? latitude : undefined,
      longitude: typeof longitude === 'number' ? longitude : undefined,
    });

    return NextResponse.json({
      success: true,
      artwork,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to resolve destination artwork.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
