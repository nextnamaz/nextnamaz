import type { PrayerTimeEntry } from '@/types/prayer';

export const MINUTES_PER_DAY = 1440;

/** Minutes since midnight for a "HH:MM" string, or null if unparseable. */
export function minutesOf(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * True while any congregational prayer began less than `minutes` ago.
 *
 * The window is measured modulo the day, so a late Isha blackout keeps the
 * screen dark across midnight instead of snapping back on at 00:00.
 */
export function isBlackoutNow(
  prayers: PrayerTimeEntry[],
  minutes: number,
  now: Date
): boolean {
  if (minutes <= 0) return false;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return prayers.some((prayer) => {
    if (prayer.name === 'sunrise') return false;
    const start = minutesOf(prayer.time);
    if (start === null) return false;
    const elapsed = (nowMin - start + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    return elapsed < minutes;
  });
}
