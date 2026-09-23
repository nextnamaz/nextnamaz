import { createAdminClient } from '@/lib/supabase/admin';
import type { ScreenEventKind } from '@/types/database';

/**
 * Usage statistics, for the owner's /admin page. Everything here is
 * best-effort: a failure is logged and swallowed, so counting can never break
 * a screen (including before the migration that adds these tables has run).
 */

/** How stale last_seen_at may get before a TV load writes it again. */
const SEEN_EVERY_MS = 10 * 60 * 1000;

export async function logEvent(screenId: string, kind: ScreenEventKind): Promise<void> {
  try {
    const { error } = await createAdminClient().from('screen_events').insert({ screen_id: screenId, kind });
    if (error) console.error('logEvent failed:', error.message);
  } catch (error) {
    console.error('logEvent failed:', error);
  }
}

/** Mark a screen as on air now. Writes at most once per SEEN_EVERY_MS per screen. */
export async function touchLastSeen(screenId: string, now = Date.now()): Promise<void> {
  const cutoff = new Date(now - SEEN_EVERY_MS).toISOString();
  try {
    const { error } = await createAdminClient()
      .from('screens')
      .update({ last_seen_at: new Date(now).toISOString() })
      .eq('id', screenId)
      .or(`last_seen_at.is.null,last_seen_at.lt.${cutoff}`);
    if (error) console.error('touchLastSeen failed:', error.message);
  } catch (error) {
    console.error('touchLastSeen failed:', error);
  }
}
