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

// --- Flip clock ---

interface FlipClockProps {
  /** Formatted clock string, e.g. "22:00:59". */
  time: string;
  size: string;
  secondsSize?: string;
  showSeconds?: boolean;
  tile: string;
  color: string;
  gap?: string;
  radius?: string;
}

/**
 * Split-flap clock: hours and minutes on tiles, seconds trailing at a smaller
 * size beside them.
 */
export function FlipClock({
  time,
  size,
  secondsSize,
  showSeconds = true,
  tile,
  color,
  gap = '0.7cqmin',
  radius = '1.4cqmin',
}: FlipClockProps) {
  const parts = time.split(':');
  const hours = parts[0] ?? '00';
  const minutes = parts[1] ?? '00';
  const seconds = parts.length >= 3 ? parts[2] : '';

  const unit = (value: string) => (
    <span
      suppressHydrationWarning
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: tile,
        borderRadius: radius,
        padding: '0.7cqmin 1.5cqmin',
        lineHeight: 1,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: '-0.03em',
        color,
      }}
    >
      {value}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: '0.2cqmin',
          background: 'rgba(0,0,0,0.55)',
        }}
      />
    </span>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      {unit(hours)}
      <span style={{ fontSize: size, fontWeight: 700, lineHeight: 1, color }}>:</span>
      {unit(minutes)}
      {showSeconds && seconds && (
        <span
          suppressHydrationWarning
          style={{
            fontSize: secondsSize ?? size,
            fontWeight: 600,
            color,
            alignSelf: 'flex-end',
            paddingBottom: '1cqmin',
          }}
        >
          {seconds}
        </span>
      )}
    </div>
  );
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
