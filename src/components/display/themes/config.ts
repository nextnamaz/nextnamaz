/**
 * Theme config arrives as Record<string, unknown> (it round-trips through
 * JSONB), so every read goes through a typed guard with a fallback.
 */

/**
 * A text value, keeping an empty string, so a user can clear a text field to
 * hide the element it drives.
 */
export function readText(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

export function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Pick an entry by its key, falling back to a known-good one. */
export function readChoice<T, K extends string>(choices: Record<K, T>, value: unknown, fallback: K): T {
  // Own keys only: the key comes from saved config, and an inherited name
  // like 'constructor' is not a choice.
  for (const [key, choice] of Object.entries<T>(choices)) {
    if (key === value) return choice;
  }
  return choices[fallback];
}

export interface Countdown {
  hours: number;
  minutes: number;
  seconds: number;
}

/** Minutes since midnight for a "HH:MM" string. */
export function minutesOf(time: string): number {
  // A malformed time yields NaN rather than 0, so it never reads as midnight:
  // callers compare against this value and must fail closed, not land on "past".
  const [hours = NaN, minutes = NaN] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Time remaining until the next occurrence of "HH:MM", relative to `now`. */
export function countdownTo(time: string, now: Date): Countdown {
  const [hours = NaN, minutes = NaN] = time.split(':').map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  // Within its first minute a target is "now", not tomorrow: a countdown that
  // is a tick behind must read 00:00:00, never 23:59:59.
  if (target.getTime() <= now.getTime() - 60_000) {
    target.setDate(target.getDate() + 1);
  }
  const total = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export type PrayerState = 'past' | 'current' | 'next' | 'upcoming';

/**
 * Classify each prayer for display. "current" is the prayer whose time it is:
 * the latest to have begun, except that sunrise ends Fajr's time without
 * starting a prayer of its own. Everything before it is "past". Sunrise is
 * never a target, so it is only ever past or upcoming.
 */
export function prayerStates(
  times: { name: string; time: string }[],
  nextName: string | null,
  now: Date
): PrayerState[] {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let currentIndex = -1;
  times.forEach((entry, index) => {
    if (minutesOf(entry.time) <= nowMinutes) {
      currentIndex = entry.name === 'sunrise' ? -1 : index;
    }
  });

  return times.map((entry, index) => {
    if (entry.name === nextName) return 'next';
    if (index === currentIndex) return 'current';
    if (minutesOf(entry.time) <= nowMinutes) return 'past';
    return 'upcoming';
  });
}
