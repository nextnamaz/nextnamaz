import type { PrayerTimesMap } from '@/types/database';
import type { PrayerSourceType, PrayerSourceConfig, VaktijaBaSourceConfig } from '@/types/prayer-config';
import { fetchVaktijaBa } from './vaktija-ba';

type PrayerSourceFetcher = (config: PrayerSourceConfig) => Promise<PrayerTimesMap>;

const providers: Record<string, PrayerSourceFetcher> = {
  vaktija_ba: (config) => {
    const c = config as VaktijaBaSourceConfig;
    return fetchVaktijaBa(c.locationId);
  },
};

export async function fetchPrayerTimes(
  source: PrayerSourceType,
  config: PrayerSourceConfig
): Promise<PrayerTimesMap> {
  if (source === 'manual') {
    throw new Error('Cannot fetch times for manual source');
  }
  const fetcher = providers[source];
  if (!fetcher) {
    throw new Error(`Unknown prayer source: ${source}`);
  }
  return fetcher(config);
}
