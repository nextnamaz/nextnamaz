import { asPrayerTimes, asRecord } from '@/types/database';
import type { Screen, PrayerTimesMap } from '@/types/database';
import type { PrayerSourceType, PrayerSourceConfig } from '@/types/prayer-config';
import { fetchPrayerTimes } from '@/lib/prayer-sources';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Today's times for a screen. Manual → stored times. Live sources → fetch
 * (cached ~1h via the fetchers), falling back to the last stored day when the
 * provider is unreachable. Successful fetches are written back so the fallback
 * stays fresh.
 */
export async function resolveTodayTimes(screen: Screen): Promise<PrayerTimesMap> {
  const source = (screen.prayer_source || 'manual') as PrayerSourceType;
  const stored = asPrayerTimes(screen.prayer_times);
  if (source === 'manual') return stored;

  try {
    const config = asRecord(screen.prayer_source_config) as unknown as PrayerSourceConfig;
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
