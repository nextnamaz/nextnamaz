import { minutesOf } from '@/lib/display-schedule';
import type { PrayerTimesMap } from '@/types/database';
import { PRAYER_NAMES } from '@/types/prayer';
import type { PrayerName } from '@/types/prayer';

/** Every slot of the day but sunrise, which belongs to the sun and not the mosque. */
export const FIXABLE_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const satisfies readonly PrayerName[];
export type FixablePrayer = (typeof FIXABLE_PRAYERS)[number];

/** Prayers a mosque holds at the same "HH:MM" every day, whatever its source says. */
export type FixedTimes = Partial<Record<FixablePrayer, string>>;

export function isFixablePrayer(prayer: PrayerName): prayer is FixablePrayer {
  return (FIXABLE_PRAYERS as readonly PrayerName[]).includes(prayer);
}

/** The slot either side of `prayer` that its time crosses in `day`, or null when it fits. */
export function crossedNeighbour(day: PrayerTimesMap, prayer: PrayerName): PrayerName | null {
  const index = PRAYER_NAMES.indexOf(prayer);
  const before = PRAYER_NAMES[index - 1];
  const after = PRAYER_NAMES[index + 1];
  // A time that cannot be read crosses nothing, and sets no bound for its neighbours.
  const at = minutesOf(day[prayer]);
  if (at === null) return null;
  if (before && at <= (minutesOf(day[before]) ?? -1)) return before;
  if (after && at >= (minutesOf(day[after]) ?? Infinity)) return after;
  return null;
}

/**
 * Today's times with the mosque's fixed times laid over the source's.
 *
 * A fixed time that would put the day out of order steps aside for that day
 * and the source's time shows instead. An Isha fixed at 19:00 for the winter
 * would otherwise come before Maghrib on a summer evening; this way it waits
 * until the evenings draw in, and nobody has to remember to change it.
 */
export function withFixedTimes(times: PrayerTimesMap, fixed: FixedTimes): PrayerTimesMap {
  const day = { ...times, ...fixed };
  const clash = FIXABLE_PRAYERS.find(
    (prayer) => fixed[prayer] !== undefined && crossedNeighbour(day, prayer) !== null
  );
  if (clash === undefined) return day;
  const rest = { ...fixed };
  delete rest[clash];
  return withFixedTimes(times, rest);
}
