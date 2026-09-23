import { asPrayerTimes } from '@/types/database';
import type { Screen, PrayerTimesMap } from '@/types/database';
import type { PrayerSourceType } from '@/types/prayer-config';
import { fetchPrayerTimes } from '@/lib/prayer-sources';
import { parseSourceConfig } from '@/lib/screen-settings';
import { createAdminClient } from '@/lib/supabase/admin';

const PRAYER_SOURCES: readonly PrayerSourceType[] = [
  'manual',
  'adhan',
  'aladhan',
  'vaktija_ba',
  'vaktija_eu',
  'islamiska_forbundet',
];

function isPrayerSource(value: string): value is PrayerSourceType {
  return (PRAYER_SOURCES as readonly string[]).includes(value);
}

/**
 * Today's times for a screen. Manual → stored times. Live sources → fetch
 * (cached ~1h via the fetchers), falling back to the last stored day when the
 * provider is unreachable. Successful fetches are written back so the fallback
 * stays fresh.
 */
export async function resolveTodayTimes(screen: Screen): Promise<PrayerTimesMap> {
  const source = isPrayerSource(screen.prayer_source) ? screen.prayer_source : 'manual';
  const stored = asPrayerTimes(screen.prayer_times);
  if (source === 'manual') return stored;

  try {
    // Re-validate the stored config: a row written by an older schema (or by
    // hand) must not reach a provider as a half-built request.
    const config = parseSourceConfig(source, screen.prayer_source_config);
    if (config === null) return stored;
    const times = await fetchPrayerTimes(source, config);
    if (JSON.stringify(times) !== JSON.stringify(stored)) {
      await createAdminClient()
        .from('screens')
        .update({ prayer_times: times })
        .eq('id', screen.id);
    }
    return times;
  } catch {
    return stored;
  }
}
