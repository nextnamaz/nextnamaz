/**
 * Theme config arrives as Record<string, unknown> (it round-trips through
 * JSONB), so every read goes through a typed guard with a fallback.
 */

export function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

/**
 * Like readString but keeps an empty string, so a user can clear a text field
 * to hide the element it drives.
 */
export function readText(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

export function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Pick a palette entry by key, falling back to a known-good one. */
export function readPalette<T>(
  palettes: Record<string, T>,
  value: unknown,
  fallback: string
): T {
  const key = readString(value, fallback);
  return palettes[key] ?? palettes[fallback];
}

export interface Countdown {
  hours: number;
  minutes: number;
  seconds: number;
}

/** Minutes since midnight for a "HH:MM" string. */
export function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Time remaining until the next occurrence of "HH:MM", relative to `now`. */
export function countdownTo(time: string, now: Date): Countdown {
  const [hours, minutes] = time.split(':').map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  if (target.getTime() <= now.getTime()) {
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
 * Classify each prayer for display. "current" is the most recent prayer that
 * has already begun; everything before it is "past". Sunrise is never a
 * target, so it is only ever past or upcoming.
 */
export function prayerStates(
  times: { name: string; time: string }[],
  nextName: string | null,
  now: Date
): PrayerState[] {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let currentIndex = -1;
  times.forEach((entry, index) => {
    if (entry.name !== 'sunrise' && minutesOf(entry.time) <= nowMinutes) {
      currentIndex = index;
    }
  });

  return times.map((entry, index) => {
    if (entry.name === nextName) return 'next';
    if (index === currentIndex) return 'current';
    if (minutesOf(entry.time) <= nowMinutes) return 'past';
    return 'upcoming';
  });
}
