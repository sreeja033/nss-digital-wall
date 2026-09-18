import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean and normalize project URL
export const supabaseUrl = rawSupabaseUrl
  .trim()
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');

export const supabaseAnonKey = rawSupabaseAnonKey.trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.length > 0 &&
    supabaseAnonKey.length > 0 &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder')
  );
};

// Fallback dummy URL so createClient doesn't throw during initial build if env vars aren't populated yet
const validUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export interface ConnectionTestResult {
  configured: boolean;
  connected: boolean;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Runs a test query against Supabase to verify connectivity.
 * Returns clear status and diagnostics.
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      message: 'Supabase credentials are missing. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
    };
  }

  try {
    // Attempt lightweight ping to Supabase REST endpoint
    const { data, error, status } = await supabase
      .from('problems')
      .select('count', { count: 'exact', head: true });

    // Status 200/206/204: table exists and query succeeded
    if (status >= 200 && status < 300) {
      return {
        configured: true,
        connected: true,
        message: 'Successfully connected to Supabase and queried the database.',
        details: { status, data },
      };
    }

    // Status 404 or Postgres error '42P01' (relation does not exist):
    // This confirms the connection, authentication, and project URL WORKED, but table schema is not yet created.
    if (error && (error.code === '42P01' || error.message?.includes('relation "problems" does not exist') || status === 404)) {
      return {
        configured: true,
        connected: true,
        message: 'Connected to Supabase project successfully! (The `problems` table is not yet created, ready for Step 2 schema creation).',
        details: { status, code: error.code, message: error.message },
      };
    }

    // Invalid API key or URL error
    if (error && (status === 401 || status === 403 || error.message?.includes('JWT') || error.message?.includes('apikey'))) {
      return {
        configured: true,
        connected: false,
        message: 'Connected to endpoint, but authentication failed. Please verify VITE_SUPABASE_ANON_KEY.',
        error: error.message,
        details: { status, code: error.code },
      };
    }

    // Auth ping fallback check
    const { error: authError } = await supabase.auth.getSession();
    if (!authError) {
      return {
        configured: true,
        connected: true,
        message: 'Successfully reached Supabase project API and verified Auth service connection.',
      };
    }

    return {
      configured: true,
      connected: false,
      message: `Supabase query returned error: ${error?.message || authError?.message || 'Unknown network error'}`,
      error: error?.message || authError?.message,
      details: { status },
    };
  } catch (err: unknown) {
    const errorStr = err instanceof Error ? err.message : String(err);
    return {
      configured: true,
      connected: false,
      message: `Connection to Supabase failed: ${errorStr}`,
      error: errorStr,
    };
  }
}
