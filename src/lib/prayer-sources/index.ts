import type { PrayerTimesMap } from '@/types/database';
import type {
  PrayerSourceType,
  PrayerSourceConfig,
  VaktijaBaSourceConfig,
  VaktijaEuSourceConfig,
  IslamiskaForbundetSourceConfig,
} from '@/types/prayer-config';
import { fetchVaktijaBa } from './vaktija-ba';
import { fetchVaktijaEu } from './vaktija-eu';
import { fetchIslamiskaForbundet } from './islamiska-forbundet';

type PrayerSourceFetcher = (config: PrayerSourceConfig) => Promise<PrayerTimesMap>;

const providers: Record<string, PrayerSourceFetcher> = {
  vaktija_ba: (config) => {
    const c = config as VaktijaBaSourceConfig;
    return fetchVaktijaBa(c.locationId);
  },
  vaktija_eu: (config) => {
    const c = config as VaktijaEuSourceConfig;
    return fetchVaktijaEu(c.locationSlug);
  },
  islamiska_forbundet: (config) => {
    const c = config as IslamiskaForbundetSourceConfig;
    return fetchIslamiskaForbundet(c.city);
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
