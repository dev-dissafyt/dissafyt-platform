import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Authoritative production Supabase endpoint & keys for Ace of Fyt / Dissafyt
const PRODUCTION_SUPABASE_URL = 'https://ddetxmhghairsapcqmto.supabase.co';
const PRODUCTION_SUPABASE_ANON_KEY = 'sb_publishable_tx0YLrjhXskl5A0zQc-V8g_22hcK--u';
// Authoritative server-side service role key (NEVER expose to browser/client bundle)
const PRODUCTION_SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZXR4bWhnaGFpcnNhcGNxbXRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODg1MzcxNiwiZXhwIjoyMTA0NDI5NzE2fQ.eALd6Uhe5QIfVRng5FWjCmbLS5i4HaPEkMuySgvdX48';

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
  // Always use service role authority: explicit arg > env var > authoritative fallback
  // NEVER fall back to publishable anon key on the administrative client
  const resolvedKey =
    serviceRoleKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    PRODUCTION_SUPABASE_SERVICE_ROLE_KEY;

  const resolvedUrl = url || envUrl || PRODUCTION_SUPABASE_URL;

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
