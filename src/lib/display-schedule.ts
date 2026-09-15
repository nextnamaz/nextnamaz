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

/**
 * The control QR window, measured from each congregational prayer.
 *
 * A kiosk (a Pi in a wall bracket, a TV with no remote) has nothing to wiggle,
 * so the activity overlay can never be summoned and whoever set the screen up
 * is the only person who can reach its settings. Showing a small code shortly
 * after each prayer puts the link in front of the people actually standing in
 * the room, at the one moment they are there and free.
 *
 * The delay lets the congregation pray first; the window is deliberately long
 * enough to outlast the sunnah that follows.
 */
export const CONTROL_QR_DELAY_MINUTES = 10;
export const CONTROL_QR_DURATION_MINUTES = 20;

/**
 * True while any congregational prayer began between DELAY and
 * DELAY + DURATION minutes ago. Modulo the day like the blackout, so an Isha
 * window survives midnight. Independent of the blackout: the code is drawn
 * over a dark screen rather than waiting for it to lift.
 */
export function isControlQrNow(prayers: PrayerTimeEntry[], now: Date): boolean {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return prayers.some((prayer) => {
    if (prayer.name === 'sunrise') return false;
    const start = minutesOf(prayer.time);
    if (start === null) return false;
    const elapsed = (nowMin - start + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    return (
      elapsed >= CONTROL_QR_DELAY_MINUTES &&
      elapsed < CONTROL_QR_DELAY_MINUTES + CONTROL_QR_DURATION_MINUTES
    );
  });
}
