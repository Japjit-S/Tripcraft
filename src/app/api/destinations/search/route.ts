import { NextRequest, NextResponse } from 'next/server';
import { WeatherProvider } from '@/lib/providers/weatherProvider';

const weatherProvider = new WeatherProvider();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
      });
    }

    const cleanedQuery = query.trim();
    if (cleanedQuery.length > 60) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query is too long (maximum 60 characters).',
          results: [],
        },
        { status: 400 }
      );
    }

    const results = await weatherProvider.searchCities(cleanedQuery, 6);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown geocoding search error';
    return NextResponse.json(
      {
        success: false,
        error: message,
        results: [],
      },
      { status: 500 }
    );
  }
}
