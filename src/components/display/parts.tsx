'use client';

import type { PrayerTimeEntry } from '@/types/prayer';
import type { DisplayLocale } from '@/lib/display-locale';
import { pad } from './themes/config';
import type { Countdown } from './themes/config';

/**
 * Presentational pieces shared by the display themes. Themes differ in
 * ornament and palette, not in what a prayer row or a clock *is*, so these
 * carry the behaviour and leave every colour and size to the caller.
 *
 * All sizes arrive as container-query strings from the theme, so anything
 * built from these scales with the screen and in the settings thumbnails.
 */

// --- Countdown ---

export interface CountdownTextOptions {
  showSeconds?: boolean;
}

/** "03:12:44", or "03:12" without seconds. */
export function formatCountdown(countdown: Countdown, options: CountdownTextOptions = {}): string {
  const base = `${pad(countdown.hours)}:${pad(countdown.minutes)}`;
  return options.showSeconds === false ? base : `${base}:${pad(countdown.seconds)}`;
}

/**
 * The phrase under a countdown, built from the locale rather than hardcoded:
 * "Dhuhr in", "الظهر بعد", "Dhuhr om". Falls back to the bare prayer name if
 * the screen has blanked the joining word.
 */
export function countdownPhrase(prayer: PrayerTimeEntry, locale: DisplayLocale): string {
  const join = locale.labels.until.trim();
  return join ? `${prayer.displayName} ${join}` : prayer.displayName;
}

// --- Clock and names ---

/** "15:56:42" → ["15:56", "42"]. A 12-hour clock keeps its AM/PM with the seconds. */
export function splitClock(time: string): [string, string] {
  const match = /^(\d{1,2}:\d{2})(?::(\d{2}))?\s*(.*)$/.exec(time);
  if (!match) return [time, ''];
  return [match[1] ?? time, [match[2], match[3]].filter(Boolean).join(' ')];
}

/**
 * How much to shrink a name that would not fit: 1 up to `fits` characters,
 * less past it. Long names shrink rather than wrap: "Izlazak sunca",
 * "Sonnenaufgang", "Lever du soleil".
 */
export function shrinkToFit(name: string, fits: number): number {
  return Math.min(1, fits / Math.max(name.length, 1));
}

// --- Verse line ---

interface VerseProps {
  text: string;
  size: string;
  color: string;
  font?: string;
  opacity?: number;
}

/** A single line of Quranic text, set in naskh and never wrapped. */
export function Verse({ text, size, color, font = 'var(--font-naskh)', opacity = 1 }: VerseProps) {
  if (!text) return null;
  return (
    <div
      dir="auto"
      style={{
        position: 'relative',
        fontFamily: font,
        fontSize: size,
        lineHeight: 1.75,
        color,
        opacity,
        textAlign: 'center',
        maxWidth: '100%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {text}
    </div>
  );
}

// --- Moon ---

const SYNODIC_DAYS = 29.530588853;
/** A new moon: 6 January 2000, 18:14 UTC. */
const NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

/**
 * Days since the last new moon, 0 to 29.5. Counted from the mean month, so a
 * real new moon can fall half a day either side: close enough to draw.
 */
export function moonAge(date: Date): number {
  const days = (date.getTime() - NEW_MOON_MS) / 86_400_000;
  return ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
}

interface MoonProps {
  date: Date;
  size: string;
  color: string;
  /** The unlit part, faintly there as on a real night. */
  shadow?: number;
}

/** The moon as it is tonight, lit on the right while waxing, as seen from the north. */
export function Moon({ date, size, color, shadow = 0.14 }: MoonProps) {
  const age = moonAge(date);
  const angle = (age / SYNODIC_DAYS) * 2 * Math.PI;
  // The lit limb is a half circle; the terminator closes it as a half ellipse,
  // bulging toward the limb for a crescent and away from it past the quarter.
  const terminator = Math.abs(Math.cos(angle));
  const sweep = Math.cos(angle) > 0 ? 0 : 1;
  return (
    <svg viewBox="-1 -1 2 2" aria-hidden style={{ width: size, height: size, display: 'block', overflow: 'visible' }}>
      <circle r="1" fill={color} opacity={shadow} />
      <path
        d={`M0 -1 A1 1 0 0 1 0 1 A${terminator} 1 0 0 ${sweep} 0 -1 Z`}
        fill={color}
        transform={age < SYNODIC_DAYS / 2 ? undefined : 'scale(-1 1)'}
      />
    </svg>
  );
}
