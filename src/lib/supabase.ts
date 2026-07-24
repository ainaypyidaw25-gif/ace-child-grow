// Supabase client (single managed backend). Created from environment variables.
// When env is absent (e.g. this foundation/demo build), the app runs in an
// in-memory demo mode and never fabricates a backend connection.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True only when real Supabase env values are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && url.startsWith('http'));
}

let client: SupabaseClient | null = null;

/** Returns the Supabase client, or null in demo mode (no env configured). */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
