import { createAdminClient } from '@/lib/supabase/admin';
import type { Screen } from '@/types/database';

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fetch a screen by its secret id. Returns null for unknown/malformed ids. */
export async function getScreen(id: string): Promise<Screen | null> {
  if (!UUID_RE.test(id)) return null;
  const { data } = await createAdminClient()
    .from('screens')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}
