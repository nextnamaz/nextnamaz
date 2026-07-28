import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Service-role client — server only, never import from client code.
 * All DB access goes through this; the anon key has no table access.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
