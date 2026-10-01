import { NextRequest, NextResponse } from 'next/server';
import { WeatherProvider } from '@/lib/providers/weatherProvider';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

const weatherProvider = new WeatherProvider();

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(ip, { maxRequests: 60, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again shortly.',
          results: [],
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.resetSeconds),
            'X-RateLimit-Limit': String(rateCheck.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

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
