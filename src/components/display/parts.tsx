'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Sunrise } from 'lucide-react';
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

// --- Prayer name ---

interface PrayerLabelProps {
  prayer: PrayerTimeEntry;
  size: string;
  /** Sunrise is not a prayer; boards conventionally show a sun instead. */
  sunriseGlyph?: boolean;
  sunColor?: string;
  style?: CSSProperties;
}

export function PrayerLabel({
  prayer,
  size,
  sunriseGlyph = true,
  sunColor,
  style,
}: PrayerLabelProps): ReactNode {
  if (sunriseGlyph && prayer.name === 'sunrise') {
    return <Sunrise style={{ width: size, height: size, color: sunColor, ...style }} strokeWidth={2} />;
  }
  return <span style={style}>{prayer.displayName}</span>;
}
