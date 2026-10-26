import { MINUTES_PER_DAY, minutesOf } from '@/lib/display-schedule';
import { isFixablePrayer } from '@/lib/fixed-times';
import type { FixablePrayer } from '@/lib/fixed-times';
import type { PrayerTimeEntry } from '@/types/prayer';

/** When a prayer's congregation stands: some minutes after it begins, or at a set time. */
export type IqamahRule = { after: number } | { at: string };

/** The prayers that have an iqamah. A prayer without a rule has none. */
export type IqamahRules = Partial<Record<FixablePrayer, IqamahRule>>;

/** Where a prayer's wait starts when it is first given an iqamah. */
export const DEFAULT_IQAMAH_MINUTES = 10;

/** The longest wait a rule can set, in minutes. */
export const MAX_IQAMAH_MINUTES = 60;

/** "HH:MM" for minutes since midnight, which must fall within the day. */
export function clockTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** A prayer's iqamah for a day it begins at `begins`, or null past midnight. */
export function iqamahOf(begins: string, rule: IqamahRule): string | null {
  if ('at' in rule) return rule.at;
  const start = minutesOf(begins);
  if (start === null || start + rule.after >= MINUTES_PER_DAY) return null;
  return clockTime(start + rule.after);
}

/**
 * The day's prayers, in order, each with its iqamah if it has one. An iqamah
 * only counts between its prayer's beginning and the next slot of the day
 * (sunrise, for Fajr): one that falls outside, such as a 19:30 Isha iqamah
 * on a summer day when Isha begins at 22:40, is left out for that day, as a
 * fixed time out of order is.
 */
export function withIqamah(prayers: PrayerTimeEntry[], rules: IqamahRules): PrayerTimeEntry[] {
  return prayers.map((prayer, i) => {
    const rule = isFixablePrayer(prayer.name) ? rules[prayer.name] : undefined;
    const iqamah = rule ? iqamahOf(prayer.time, rule) : null;
    if (iqamah === null || !withinPrayer(iqamah, prayer.time, prayers[i + 1]?.time)) return prayer;
    return { ...prayer, iqamahTime: iqamah };
  });
}

/** Whether `iqamah` falls from `begins` up to, not including, `next`. */
function withinPrayer(iqamah: string, begins: string, next: string | undefined): boolean {
  const at = minutesOf(iqamah);
  const start = minutesOf(begins);
  if (at === null || start === null || at < start) return false;
  const end = next === undefined ? null : minutesOf(next);
  return end === null || at < end;
}

/**
 * The prayer whose time has begun and whose congregation has yet to stand,
 * or null. While there is one, the TV counts down to its iqamah rather than
 * to the next prayer.
 */
export function awaitingIqamah(prayers: PrayerTimeEntry[], now: Date): PrayerTimeEntry | null {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return (
    prayers.find((prayer) => {
      if (!prayer.iqamahTime) return false;
      const start = minutesOf(prayer.time);
      const at = minutesOf(prayer.iqamahTime);
      return start !== null && at !== null && start <= nowMin && nowMin < at;
    }) ?? null
  );
}
