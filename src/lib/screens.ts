import { createAdminClient } from '@/lib/supabase/admin';
import type { Screen } from '@/types/database';

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetch a screen by its secret id. Returns null only when no such screen
 * exists (or the id is malformed). Any other failure, a timeout or a database
 * hiccup, throws: a TV that took a passing error for "deleted" would forget
 * its screen and fall back to setup, which cost a mosque its display on
 * 2026-09-23.
 */
export async function getScreen(id: string): Promise<Screen | null> {
  if (!UUID_RE.test(id)) return null;
  const { data, error } = await createAdminClient()
    .from('screens')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getScreen failed: ${error.message}`);
  return data;
}
