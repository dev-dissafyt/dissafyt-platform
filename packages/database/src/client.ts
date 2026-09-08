import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PROJECT_URL || '';
const defaultAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.API_KEY || '';
const defaultServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Creates a browser-compatible Supabase client using publishable/anon key.
 */
export function getSupabaseBrowserClient(
  url = defaultUrl,
  anonKey = defaultAnonKey
): SupabaseClient {
  if (!url || !anonKey) {
    console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
  }
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Creates a privileged administrative Supabase client using the service role key.
 * Strictly for server-side route handlers, background tasks, and backend services.
 * NEVER expose this client to the frontend/browser.
 */
export function getSupabaseAdminClient(
  url = defaultUrl,
  serviceRoleKey = defaultServiceRoleKey
): SupabaseClient {
  if (!url || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY and Supabase URL are required for admin client operations.'
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
