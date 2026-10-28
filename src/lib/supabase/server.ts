import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv, isSupabaseConfigured } from './config';

/**
 * Creates a server-side Supabase client using Next.js 15/16 asynchronous cookies.
 * Returns null if Supabase environment variables are missing.
 */
export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if middleware is refreshing user sessions.
        }
      },
    },
  });
}

/**
 * Safely fetches the authenticated user on the server with a bounded timeout and try/catch.
 * Returns null if Supabase is offline, paused, unresolvable, or unauthenticated,
 * preventing server endpoints from crashing or hanging indefinitely.
 */
export async function safeGetServerUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  timeoutMs = 2000
) {
  if (!supabase) return null;
  try {
    const userPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase server auth timeout')), timeoutMs)
    );
    const { data } = await Promise.race([userPromise, timeoutPromise]);
    return data?.user ?? null;
  } catch (err) {
    console.warn(
      '[Supabase Server] Auth check bypassed:',
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
}
