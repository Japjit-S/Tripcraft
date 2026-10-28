import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv, isSupabaseConfigured } from '@/lib/supabase/config';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Fast path 1: If Supabase credentials are not configured, skip immediately
  if (!isSupabaseConfigured()) {
    return response;
  }

  // Fast path 2: Only proceed if client actually sent Supabase auth cookies.
  // This prevents unauthenticated users, evaluators, and crawlers from triggering external network calls.
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token')
  );

  if (!hasAuthCookie) {
    return response;
  }

  try {
    const { url, anonKey } = getSupabaseEnv();

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Guard with a strict 1500ms timeout: if Supabase is paused, down, or DNS fails,
    // it will never exceed Vercel's Edge middleware execution limit (504 Gateway Timeout).
    const userPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase middleware auth timeout')), 1500)
    );

    await Promise.race([userPromise, timeoutPromise]);
  } catch (err) {
    // Graceful degradation: never let an external auth timeout take down the entire public site
    console.warn(
      '[Middleware] Supabase auth refresh skipped:',
      err instanceof Error ? err.message : String(err)
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
