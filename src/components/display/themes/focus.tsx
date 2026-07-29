'use client';

import type { CSSProperties } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import { formatPrayerTime } from '@/lib/display-locale';
import { useDisplayClock } from '@/hooks/display/use-display-clock';
import { countdownTo, pad, prayerStates, readBoolean, readPalette } from './config';

// Every size is a container-query unit so the theme is identical on a 4K TV
// and in a 160px settings thumbnail.

interface Accent {
  base: string;
  onAccent: string;
  soft: string;
  glow: string;
}

const ACCENTS: Record<string, Accent> = {
  emerald: { base: '#10b981', onAccent: '#04231a', soft: 'rgba(16,185,129,0.14)', glow: 'rgba(16,185,129,0.30)' },
  amber: { base: '#f59e0b', onAccent: '#2a1a00', soft: 'rgba(245,158,11,0.14)', glow: 'rgba(245,158,11,0.30)' },
  sky: { base: '#38bdf8', onAccent: '#04202e', soft: 'rgba(56,189,248,0.14)', glow: 'rgba(56,189,248,0.30)' },
  violet: { base: '#a78bfa', onAccent: '#1e1035', soft: 'rgba(167,139,250,0.14)', glow: 'rgba(167,139,250,0.30)' },
  rose: { base: '#fb7185', onAccent: '#2d0710', soft: 'rgba(251,113,133,0.14)', glow: 'rgba(251,113,133,0.30)' },
};

interface Surface {
  bg: string;
  text: string;
  muted: string;
  faint: string;
  line: string;
}

const SURFACES: Record<string, Surface> = {
  dark: {
    bg: '#0b0d10',
    text: '#f5f7fa',
    muted: 'rgba(245,247,250,0.52)',
    faint: 'rgba(245,247,250,0.30)',
    line: 'rgba(245,247,250,0.10)',
  },
  light: {
    bg: '#f6f7f9',
    text: '#0d1117',
    muted: 'rgba(13,17,23,0.55)',
    faint: 'rgba(13,17,23,0.34)',
    line: 'rgba(13,17,23,0.10)',
  },
};

export function FocusTheme({ prayers, nextPrayer, config, isPortrait, locale }: ThemeProps) {
  const { timeStr, dateStr, date } = useDisplayClock(locale);

  const surface = readPalette(SURFACES, config.mode, 'dark');
  const accent = readPalette(ACCENTS, config.accent, 'emerald');
  const showSeconds = readBoolean(config.showSeconds, true);

  const countdown = nextPrayer ? countdownTo(nextPrayer.time, date) : null;
  const states = prayerStates(prayers, nextPrayer?.name ?? null, date);

  const root: CSSProperties = {
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: surface.bg,
    color: surface.text,
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div data-theme="focus" style={root}>
      {/* Top strip: live clock + date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '2cqmin',
          padding: isPortrait ? '3.2cqmin 4.5cqmin' : '2.4cqmin 4cqmin',
          borderBottom: `1px solid ${surface.line}`,
          flex: '0 0 auto',
        }}
      >
        <span
          suppressHydrationWarning
          style={{
            fontSize: isPortrait ? '6.4cqmin' : '5cqmin',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          {timeStr}
        </span>
        <span
          suppressHydrationWarning
          style={{
            fontSize: isPortrait ? '3.4cqmin' : '2.7cqmin',
            color: surface.muted,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {dateStr}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: isPortrait ? 'column' : 'row',
        }}
      >
        {/* Hero: the countdown is the largest thing on screen by a wide margin */}
        <div
          style={{
            position: 'relative',
            flex: isPortrait ? '0 0 44%' : '1 1 58%',
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isPortrait ? '4cqmin' : '3cqmin',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 46%, ${accent.glow} 0%, transparent 62%)`,
              pointerEvents: 'none',
            }}
          />

          {nextPrayer && countdown ? (
            <div style={{ position: 'relative', textAlign: 'center', maxWidth: '100%' }}>
              <div
                style={{
                  fontSize: isPortrait ? '3.2cqmin' : '2.6cqmin',
                  letterSpacing: '0.34em',
                  textTransform: 'uppercase',
                  color: surface.muted,
                  marginBottom: '1.4cqmin',
                }}
              >
                {locale.labels.next}
              </div>
              <div
                style={{
                  fontSize: isPortrait ? '8cqmin' : '7cqmin',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: accent.base,
                  marginBottom: isPortrait ? '1.5cqmin' : '1cqmin',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {nextPrayer.displayName}
              </div>
              <div
                suppressHydrationWarning
                style={{
                  fontSize: isPortrait ? '15cqmin' : '16cqmin',
                  fontWeight: 800,
                  lineHeight: 0.92,
                  letterSpacing: '-0.035em',
                  whiteSpace: 'nowrap',
                }}
              >
                {pad(countdown.hours)}:{pad(countdown.minutes)}
                {showSeconds && (
                  <span suppressHydrationWarning style={{ color: surface.faint }}>
                    :{pad(countdown.seconds)}
                  </span>
                )}
              </div>
              <div
                style={{
                  marginTop: isPortrait ? '2cqmin' : '1.8cqmin',
                  fontSize: isPortrait ? '4.4cqmin' : '3.6cqmin',
                  color: surface.muted,
                }}
              >
                {formatPrayerTime(nextPrayer.time, locale)}
              </div>
            </div>
          ) : (
            <div
              suppressHydrationWarning
              style={{
                position: 'relative',
                fontSize: isPortrait ? '6cqmin' : '5cqmin',
                color: surface.muted,
              }}
            >
              {timeStr}
            </div>
          )}
        </div>

        {/* Supporting list: every prayer, with the next one unmistakable */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            // Portrait leaves far more room than the rows need, so spread them
            // instead of clustering them in the middle.
            justifyContent: isPortrait ? 'space-evenly' : 'center',
            padding: isPortrait ? '1.5cqmin 3cqmin 3cqmin' : '2cqmin 3.5cqmin',
            borderTop: isPortrait ? `1px solid ${surface.line}` : undefined,
            borderInlineStart: isPortrait ? undefined : `1px solid ${surface.line}`,
          }}
        >
          {prayers.map((prayer, index) => {
            const state = states[index];
            const isNext = state === 'next';
            const isCurrent = state === 'current';

            return (
              <div
                key={prayer.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '2cqmin',
                  padding: isPortrait ? '1.5cqmin 2.4cqmin' : '1.3cqmin 2.2cqmin',
                  borderRadius: '1.6cqmin',
                  background: isNext ? accent.soft : isCurrent ? `${surface.line}` : 'transparent',
                  opacity: state === 'past' ? 0.38 : 1,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.4cqmin',
                    minWidth: 0,
                    fontSize: isPortrait ? '4.4cqmin' : '3.4cqmin',
                    fontWeight: isNext ? 700 : 500,
                    color: isNext ? accent.base : surface.text,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: '0.9cqmin',
                      height: '0.9cqmin',
                      borderRadius: '50%',
                      flex: '0 0 auto',
                      background: isNext ? accent.base : surface.faint,
                    }}
                  />
                  {prayer.displayName}
                </span>
                <span
                  style={{
                    fontSize: isPortrait ? '4.4cqmin' : '3.4cqmin',
                    fontWeight: isNext ? 700 : 500,
                    color: isNext ? accent.base : surface.muted,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatPrayerTime(prayer.time, locale)}
                  {prayer.iqamahTime && (
                    <span style={{ color: surface.faint, marginInlineStart: '1.2cqmin' }}>
                      {formatPrayerTime(prayer.iqamahTime, locale)}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const focusDefinition: ThemeDefinition = {
  id: 'focus',
  name: 'Focus',
  description: 'Giant countdown to the next prayer',
  component: FocusTheme,
  fields: [
    {
      key: 'mode',
      label: 'Mode',
      type: 'select',
      defaultValue: 'dark',
      description: 'Light or dark base',
      options: [
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light' },
      ],
    },
    {
      key: 'accent',
      label: 'Accent colour',
      type: 'select',
      defaultValue: 'emerald',
      description: 'Highlight for the next prayer and the glow',
      options: [
        { value: 'emerald', label: 'Emerald' },
        { value: 'amber', label: 'Amber' },
        { value: 'sky', label: 'Sky' },
        { value: 'violet', label: 'Violet' },
        { value: 'rose', label: 'Rose' },
      ],
    },
    {
      key: 'showSeconds',
      label: 'Show seconds',
      type: 'switch',
      defaultValue: true,
      description: 'Count down to the second',
    },
  ],
  defaultConfig: {
    mode: 'dark',
    accent: 'emerald',
    showSeconds: true,
  },
};
