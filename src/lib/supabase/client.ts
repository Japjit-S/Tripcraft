import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnv, isSupabaseConfigured } from './config';

/**
 * Creates a browser-side Supabase client.
 * Returns null if Supabase environment variables are missing.
 */
export function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
