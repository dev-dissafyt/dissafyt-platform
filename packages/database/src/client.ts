import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Authoritative production Supabase endpoint & key for Ace of Fyt / Dissafyt
const PRODUCTION_SUPABASE_URL = 'https://ddetxmhghairsapcqmto.supabase.co';
const PRODUCTION_SUPABASE_ANON_KEY = 'sb_publishable_tx0YLrjhXskl5A0zQc-V8g_22hcK--u';

let cachedBrowserClient: SupabaseClient | null = null;
let cachedAdminClient: SupabaseClient | null = null;

/**
 * Creates a browser-compatible Supabase client using publishable/anon key.
 *
 * NOTE: Literal process.env.NEXT_PUBLIC_* references are required so Next.js / Webpack
 * statically inlines the values into the client-side bundle.
 * Uses a singleton pattern in the browser to prevent multiple GoTrueClient warnings.
 */
export function getSupabaseBrowserClient(
  url?: string,
  anonKey?: string
): SupabaseClient {
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser && cachedBrowserClient) {
    return cachedBrowserClient;
  }

  // Explicit static property accesses for Next.js bundle inlining
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PROJECT_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.API_KEY;

  const resolvedUrl = url || envUrl || PRODUCTION_SUPABASE_URL;
  const resolvedAnonKey = anonKey || envKey || PRODUCTION_SUPABASE_ANON_KEY;

  const client = createClient(resolvedUrl, resolvedAnonKey, {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
    },
  });

  if (isBrowser) {
    cachedBrowserClient = client;
  }

  return client;
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
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PROJECT_URL;
  const envKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.API_KEY;

  const resolvedUrl = url || envUrl || PRODUCTION_SUPABASE_URL;
  const resolvedKey = serviceRoleKey || envKey || PRODUCTION_SUPABASE_ANON_KEY;

  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  cachedAdminClient = createClient(resolvedUrl, resolvedKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedAdminClient;
}
