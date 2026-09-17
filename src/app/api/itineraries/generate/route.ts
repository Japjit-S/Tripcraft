import { NextRequest, NextResponse } from 'next/server';
import { generateItinerary } from '@/lib/engine';
import { CuratedPackProvider } from '@/lib/providers/curatedPackProvider';
import { OsmActivityProvider } from '@/lib/providers/osmProvider';
import { WeatherProvider } from '@/lib/providers/weatherProvider';
import { CandidateActivity, Persona } from '@/lib/types/engine';

const curatedProvider = new CuratedPackProvider();
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

    // 2. Geocoding
    const destination = await weatherProvider.geocodeCity(city);
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

    // 4. Candidate Activity Sourcing (Provider A with fallback to Provider B)
    let candidates: CandidateActivity[] = [];

    if (curatedProvider.hasPack(destination.city)) {
      candidates = await curatedProvider.getCandidates(destination);
    } else {
      try {
        candidates = await osmProvider.getCandidates(destination);
      } catch (err: any) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to retrieve open-data activities for ${destination.city}: ${err.message}`,
          },
          { status: 502 }
        );
      }
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

    // 6. Return Structured Itinerary & Audit Trail
    return NextResponse.json({
      success: true,
      destination,
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
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error during itinerary generation.',
      },
      { status: 500 }
    );
  }
}
