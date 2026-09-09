import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getEnv(key: string, fallback = ''): string {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]!;
  }
  return fallback;
}

/**
 * Creates a browser-compatible Supabase client using publishable/anon key.
 */
export function getSupabaseBrowserClient(
  url?: string,
  anonKey?: string
): SupabaseClient {
  const resolvedUrl = url || getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('PROJECT_URL') || 'https://placeholder.supabase.co';
  const resolvedAnonKey = anonKey || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('API_KEY') || 'placeholder-anon-key';

  const isBrowser = typeof window !== 'undefined';

  return createClient(resolvedUrl, resolvedAnonKey, {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
    },
  });
}

/**
 * Creates a privileged administrative Supabase client using the service role key.
 * Strictly for server-side route handlers, background tasks, and backend services.
 * NEVER expose this client to the frontend/browser.
 */
export function getSupabaseAdminClient(
  url?: string,
  serviceRoleKey?: string
): SupabaseClient {
  const resolvedUrl = url || getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('PROJECT_URL') || 'https://placeholder.supabase.co';
  const resolvedKey =
    serviceRoleKey ||
    getEnv('SUPABASE_SERVICE_ROLE_KEY') ||
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    'placeholder-service-role-key';

  return createClient(resolvedUrl, resolvedKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
