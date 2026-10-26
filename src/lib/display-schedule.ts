import type { PrayerTimeEntry } from '@/types/prayer';

export const MINUTES_PER_DAY = 1440;

/**
 * A zero-padded "HH:MM" from 00:00 to 23:59. Range-checked, not merely
 * HH:MM-shaped: minutesOf() cannot parse an impossible clock time, so a
 * prayer holding one would drop out of the schedule.
 */
export const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

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
 * How long a theme shows a prayer as started, before the blackout (if any)
 * takes over. Long enough to read from the back of the hall.
 */
export const PRAYER_STARTING_MINUTES = 1;

/** When the congregation stands: at the prayer's iqamah if it has one, else as it begins. */
function congregationMinute(prayer: PrayerTimeEntry): number | null {
  const iqamah = prayer.iqamahTime === undefined ? null : minutesOf(prayer.iqamahTime);
  return iqamah ?? minutesOf(prayer.time);
}

/**
 * True for `minutes` from the moment the congregation stands: the iqamah,
 * or, without one, once the theme has shown the prayer beginning. Either
 * way the screen never goes dark before that starting minute is over.
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
    const begins = minutesOf(prayer.time);
    const stands = congregationMinute(prayer);
    if (begins === null || stands === null) return false;
    const start = Math.max(stands, begins + PRAYER_STARTING_MINUTES);
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
export const CONTROL_QR_DURATION_MINUTES = 15;

/**
 * True while any congregation stood between DELAY and DELAY + DURATION
 * minutes ago: at its iqamah, or as the prayer began without one. Modulo the
 * day like the blackout, so an Isha window survives midnight. Independent of
 * the blackout: the code is drawn over a dark screen rather than waiting for
 * it to lift.
 */
export function isControlQrNow(prayers: PrayerTimeEntry[], now: Date): boolean {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return prayers.some((prayer) => {
    if (prayer.name === 'sunrise') return false;
    const start = congregationMinute(prayer);
    if (start === null) return false;
    const elapsed = (nowMin - start + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    return (
      elapsed >= CONTROL_QR_DELAY_MINUTES &&
      elapsed < CONTROL_QR_DELAY_MINUTES + CONTROL_QR_DURATION_MINUTES
    );
  });
}


/**
 * The congregational prayer that began less than PRAYER_STARTING_MINUTES
 * ago, or null. Modulo the day like the blackout, for an Isha near midnight.
 */
export function startingPrayer(prayers: PrayerTimeEntry[], now: Date): PrayerTimeEntry | null {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return (
    prayers.find((prayer) => {
      if (prayer.name === 'sunrise') return false;
      const start = minutesOf(prayer.time);
      if (start === null) return false;
      const elapsed = (nowMin - start + MINUTES_PER_DAY) % MINUTES_PER_DAY;
      return elapsed < PRAYER_STARTING_MINUTES;
    }) ?? null
  );
}
