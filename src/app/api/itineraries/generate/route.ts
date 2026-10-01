import { NextRequest, NextResponse } from 'next/server';
import { generateItinerary } from '@/lib/engine';
import { resolveDestinationArtwork } from '@/lib/images/imageResolver';
import { OsmActivityProvider } from '@/lib/providers/osmProvider';
import { WeatherProvider } from '@/lib/providers/weatherProvider';
import { CandidateActivity, Destination, Persona } from '@/lib/types/engine';

const osmProvider = new OsmActivityProvider();
const weatherProvider = new WeatherProvider();

const VALID_PERSONAS: Persona[] = [
  'Backpacker',
  'Culture Seeker',
  'Comfort Traveller',
  'Family',
];

/**
 * POST /api/itineraries/generate
 *
 * Validates inputs, geocodes destination, fetches live/historical weather,
 * retrieves candidate activity pool, and executes the deterministic itinerary engine.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      city,
      startDate,
      days,
      persona,
      originCity,
      arrivalMode,
      arrivalTime,
      arrivalAt,
    } = body;

    // 1. Validation Gates
    if (!city || typeof city !== 'string' || !city.trim()) {
      return NextResponse.json(
        { success: false, error: 'City name is required.' },
        { status: 400 }
      );
    }

    const daysNum = Number(days);
    if (!Number.isInteger(daysNum) || daysNum < 1 || daysNum > 7) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duration must be an integer between 1 and 7 days.',
        },
        { status: 400 }
      );
    }

    if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return NextResponse.json(
        { success: false, error: 'Start date must be in YYYY-MM-DD format.' },
        { status: 400 }
      );
    }

    if (!persona || !VALID_PERSONAS.includes(persona)) {
      return NextResponse.json(
        {
          success: false,
          error: `Persona must be one of: ${VALID_PERSONAS.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    // 2. Geocoding & Disambiguation
    let destination: Destination | null = null;
    if (
      body.latitude !== undefined &&
      body.longitude !== undefined &&
      typeof body.latitude === 'number' &&
      typeof body.longitude === 'number'
    ) {
      destination = {
        id: body.destinationId || `dest:${city.toLowerCase().replace(/\s+/g, '-')}`,
        city: body.cityName || city.split(',')[0].trim(),
        country: body.country || '',
        countryCode: body.countryCode || '',
        admin1: body.admin1 || '',
        latitude: body.latitude,
        longitude: body.longitude,
      };
    } else {
      destination = await weatherProvider.geocodeCity(city, {
        admin1: body.admin1,
        country: body.country,
        countryCode: body.countryCode,
      });
    }

    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          error: `Unable to geocode city "${city}". Please check the spelling.`,
        },
        { status: 404 }
      );
    }

    // 3. Weather Forecast (with 16-day horizon fallback)
    const weatherForecast = await weatherProvider.fetchForecast({
      latitude: destination.latitude,
      longitude: destination.longitude,
      startDate,
      days: daysNum,
    });

    if (!weatherForecast || weatherForecast.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to retrieve meteorological data for destination.',
        },
        { status: 502 }
      );
    }

    // 4. Procedural Candidate Activity Sourcing (Live Wikipedia GeoSearch + OpenStreetMap)
    let candidates: CandidateActivity[] = [];
    try {
      candidates = await osmProvider.getCandidates(destination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to retrieve procedural activities for ${destination.city}: ${message}`,
        },
        { status: 502 }
      );
    }

    if (candidates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No candidate activities could be found for ${destination.city}.`,
        },
        { status: 422 }
      );
    }

    // 5. Deterministic Engine Execution
    const output = generateItinerary({
      destination,
      startDate,
      days: daysNum,
      persona,
      originCity,
      arrivalMode,
      arrivalAt: arrivalTime || arrivalAt,
      weatherForecast,
      candidates,
    });

    if (!output.success) {
      return NextResponse.json(
        {
          success: false,
          error: output.blockReason || 'Itinerary generation blocked by rules.',
          auditLog: output.auditLog,
          warnings: output.warnings,
          feasibilityStatus: output.feasibilityStatus,
        },
        { status: 422 }
      );
    }

    // 6. Server-Side Destination Artwork Resolution (Non-Blocking Fallback Guaranteed)
    const artwork = await resolveDestinationArtwork(destination);
    const enrichedDestination = {
      ...destination,
      imageUrl: artwork.imageUrl || artwork.assetPath,
      artwork,
    };

    // 7. Return Structured Itinerary, Artwork Descriptor & Audit Trail
    return NextResponse.json({
      success: true,
      destination: enrichedDestination,
      artwork,
      persona,
      startDate,
      days: daysNum,
      originCity: originCity || '',
      arrivalMode: arrivalMode || 'flight',
      arrivalTime: arrivalTime || arrivalAt || '10:00 AM',
      itineraryDays: output.itineraryDays,
      auditLog: output.auditLog,
      warnings: output.warnings,
      feasibilityStatus: output.feasibilityStatus,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Internal server error during itinerary generation.';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
