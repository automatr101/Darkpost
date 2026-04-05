import { createClient } from '@supabase/supabase-js';

/**
 * Superuser client for administrative tasks.
 * Uses the SERVICE_ROLE_KEY to bypass RLS.
 * IMPORTANT: Only use this in API routes or server-side scripts.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
