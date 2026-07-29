'use client';

import type { CSSProperties } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import { formatPrayerTime } from '@/lib/display-locale';
import { useDisplayClock } from '@/hooks/display/use-display-clock';
import { prayerStates, readBoolean, readPalette } from './config';

// A departure board: pure black, one emissive colour, huge tabular numerals.
// Every size is a container-query unit so it reads the same at any scale.

const ACCENTS: Record<string, string> = {
  amber: '#ffb300',
  green: '#22e06a',
  cyan: '#22d3ee',
  white: '#f5f5f5',
};

const MONO = 'ui-monospace, "SF Mono", "Roboto Mono", Menlo, Consolas, monospace';

export function BoardTheme({ prayers, nextPrayer, config, isPortrait, locale }: ThemeProps) {
  const { timeStr, dateStr, date } = useDisplayClock(locale);

  const accent = readPalette(ACCENTS, config.accent, 'amber');
  const showSeconds = readBoolean(config.showSeconds, true);
  const zebra = readBoolean(config.zebra, false);

  const states = prayerStates(prayers, nextPrayer?.name ?? null, date);
  const hasIqamah = prayers.some((prayer) => prayer.iqamahTime);

  // The clock string already carries seconds; drop them when switched off.
  const clock = showSeconds ? timeStr : timeStr.replace(/[:.]\d{2}$/, '');

  const root: CSSProperties = {
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: '#000',
    color: accent,
    fontFamily: MONO,
    fontVariantNumeric: 'tabular-nums',
  };

  const cell: CSSProperties = {
    fontSize: isPortrait ? '3cqmin' : '2.2cqmin',
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
  };

  return (
    <div data-theme="board" style={root}>
      {/* Clock bar */}
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: isPortrait ? 'column' : 'row',
          alignItems: isPortrait ? 'center' : 'baseline',
          justifyContent: 'space-between',
          gap: isPortrait ? '1cqmin' : '3cqmin',
          padding: isPortrait ? '4cqmin 5cqmin 3cqmin' : '3cqmin 5cqmin 2.5cqmin',
          borderBottom: `0.7cqmin solid ${accent}`,
        }}
      >
        <span
          suppressHydrationWarning
          style={{
            fontSize: isPortrait ? '13cqmin' : '11cqmin',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {clock}
        </span>
        <span
          suppressHydrationWarning
          style={{
            fontSize: isPortrait ? '3.2cqmin' : '2.6cqmin',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            opacity: 0.75,
          }}
        >
          {dateStr}
        </span>
      </div>

      {/* Column headers */}
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '2cqmin',
          padding: isPortrait ? '2cqmin 5cqmin' : '1.6cqmin 5cqmin',
          opacity: 0.6,
        }}
      >
        <span style={{ ...cell, flex: 1, textAlign: 'start' }}>{locale.labels.prayer}</span>
        <span style={{ ...cell, width: '26%', textAlign: 'end' }}>{locale.labels.begins}</span>
        {hasIqamah && (
          <span style={{ ...cell, width: '26%', textAlign: 'end' }}>{locale.labels.iqamah}</span>
        )}
      </div>

      {/* Rows */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {prayers.map((prayer, index) => {
          const state = states[index];
          const isNext = state === 'next';
          const isCurrent = state === 'current';
          const inverted = isNext;

          return (
            <div
              key={prayer.name}
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '2cqmin',
                padding: isPortrait ? '0 5cqmin' : '0 5cqmin',
                background: inverted
                  ? accent
                  : zebra && index % 2 === 1
                    ? 'rgba(255,255,255,0.05)'
                    : 'transparent',
                color: inverted ? '#000' : accent,
                opacity: state === 'past' ? 0.35 : 1,
              }}
            >
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2cqmin',
                  fontSize: isPortrait ? '5.6cqmin' : '4.8cqmin',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {prayer.displayName}
                {(isNext || isCurrent) && (
                  <span
                    style={{
                      flex: '0 0 auto',
                      fontSize: isPortrait ? '2.4cqmin' : '2cqmin',
                      letterSpacing: '0.24em',
                      padding: '0.5cqmin 1.2cqmin',
                      border: `1px solid ${inverted ? '#000' : accent}`,
                      opacity: 0.9,
                    }}
                  >
                    {isNext ? locale.labels.next : locale.labels.now}
                  </span>
                )}
              </span>
              <span
                style={{
                  width: '26%',
                  textAlign: 'end',
                  fontSize: isPortrait ? '7cqmin' : '6cqmin',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                {formatPrayerTime(prayer.time, locale)}
              </span>
              {hasIqamah && (
                <span
                  style={{
                    width: '26%',
                    textAlign: 'end',
                    fontSize: isPortrait ? '7cqmin' : '6cqmin',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    opacity: prayer.iqamahTime ? 0.8 : 0.3,
                  }}
                >
                  {prayer.iqamahTime ? formatPrayerTime(prayer.iqamahTime, locale) : '--:--'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const boardDefinition: ThemeDefinition = {
  id: 'board',
  name: 'Board',
  description: 'High-contrast departure board for large halls',
  component: BoardTheme,
  fields: [
    {
      key: 'accent',
      label: 'Colour',
      type: 'select',
      defaultValue: 'amber',
      description: 'The only colour on screen',
      options: [
        { value: 'amber', label: 'Amber' },
        { value: 'green', label: 'Green' },
        { value: 'cyan', label: 'Cyan' },
        { value: 'white', label: 'White' },
      ],
    },
    {
      key: 'showSeconds',
      label: 'Show seconds',
      type: 'switch',
      defaultValue: true,
      description: 'Seconds on the main clock',
    },
    {
      key: 'zebra',
      label: 'Row banding',
      type: 'switch',
      defaultValue: false,
      description: 'Faint alternating row shading',
    },
  ],
  defaultConfig: {
    accent: 'amber',
    showSeconds: true,
    zebra: false,
  },
};
