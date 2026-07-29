'use client';

import type { CSSProperties } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import { formatPrayerTime } from '@/lib/display-locale';
import { useDisplayClock } from '@/hooks/display/use-display-clock';
import { prayerStates, readPalette, readBoolean } from './config';
import { HorseshoeArch, StarField, Shamsa } from './ornament';

// The Córdoba arcade: each prayer sits under its own horseshoe arch, and the
// next prayer's arch is lit like a lamp has been hung in it.

interface Palette {
  night: string;
  deep: string;
  gold: string;
  goldBright: string;
  ink: string;
  muted: string;
}

const PALETTES: Record<string, Palette> = {
  midnight: {
    night: '#0a1631',
    deep: '#060d1f',
    gold: '#c9a227',
    goldBright: '#f0cf6b',
    ink: '#f3ead2',
    muted: 'rgba(243,234,210,0.50)',
  },
  emerald: {
    night: '#08251f',
    deep: '#041511',
    gold: '#c9a227',
    goldBright: '#f0cf6b',
    ink: '#f1ead6',
    muted: 'rgba(241,234,214,0.50)',
  },
  plum: {
    night: '#25102a',
    deep: '#14071a',
    gold: '#c99227',
    goldBright: '#f0c46b',
    ink: '#f4e9de',
    muted: 'rgba(244,233,222,0.50)',
  },
};

export function AndalusiTheme({ prayers, nextPrayer, config, isPortrait, locale }: ThemeProps) {
  const { timeStr, dateStr, date } = useDisplayClock(locale);
  const palette = readPalette(PALETTES, config.palette, 'midnight');
  const showPattern = readBoolean(config.pattern, true);
  const states = prayerStates(prayers, nextPrayer?.name ?? null, date);

  const root: CSSProperties = {
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: `radial-gradient(ellipse at 50% 0%, ${palette.night} 0%, ${palette.deep} 78%)`,
    color: palette.ink,
    fontFamily: 'var(--font-naskh)',
  };

  return (
    <div data-theme="andalusi" style={root}>
      {showPattern && <StarField color={palette.gold} opacity={0.13} density={8} />}

      {/* Crown: clock and date between two rosettes */}
      <div
        style={{
          position: 'relative',
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.8cqmin',
          padding: isPortrait ? '5.5cqmin 4cqmin 2cqmin' : '5cqmin 4cqmin 2cqmin',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5cqmin', maxWidth: '100%' }}>
          <Shamsa color={palette.gold} size={isPortrait ? '5cqmin' : '4.5cqmin'} opacity={0.9} />
          <span
            suppressHydrationWarning
            style={{
              fontSize: isPortrait ? '11cqmin' : '9.5cqmin',
              fontWeight: 700,
              lineHeight: 1,
              color: palette.goldBright,
              letterSpacing: '0.01em',
            }}
          >
            {timeStr}
          </span>
          <Shamsa color={palette.gold} size={isPortrait ? '5cqmin' : '4.5cqmin'} opacity={0.9} />
        </div>
        <span
          suppressHydrationWarning
          style={{
            fontSize: isPortrait ? '3.2cqmin' : '2.6cqmin',
            letterSpacing: '0.32em',
            color: palette.muted,
          }}
        >
          {dateStr}
        </span>
      </div>

      {/* The arcade */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: isPortrait ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gridTemplateRows: isPortrait ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
          gap: isPortrait ? '2cqmin' : '1.5cqmin',
          padding: isPortrait ? '1cqmin 4cqmin 4cqmin' : '0 5cqmin 3cqmin',
          placeItems: 'center',
        }}
      >
        {prayers.map((prayer, index) => {
          const state = states[index];
          const isNext = state === 'next';
          const isPast = state === 'past';

          return (
            <div
              key={prayer.name}
              style={{
                position: 'relative',
                // Lock the 5:6 proportion the arch is drawn at, so it keeps
                // its horseshoe shape whatever the cell happens to be.
                aspectRatio: '5 / 6',
                height: '100%',
                maxWidth: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isPortrait ? '0.8cqmin' : '0.6cqmin',
                paddingBottom: '4%',
                opacity: isPast ? 0.42 : 1,
              }}
            >
              <HorseshoeArch
                stroke={isNext ? palette.goldBright : palette.gold}
                strokeWidth={isNext ? 4.5 : 2.6}
                glow={isNext ? palette.goldBright : undefined}
              />

              <span
                style={{
                  position: 'relative',
                  fontSize: isPortrait ? '4.2cqmin' : '3.6cqmin',
                  letterSpacing: '0.16em',
                  color: isNext ? palette.goldBright : palette.muted,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {prayer.displayName}
              </span>
              <span
                style={{
                  position: 'relative',
                  fontSize: isPortrait ? '8.6cqmin' : '7.4cqmin',
                  fontWeight: 700,
                  lineHeight: 1,
                  color: isNext ? palette.goldBright : palette.ink,
                }}
              >
                {formatPrayerTime(prayer.time, locale)}
              </span>
              {prayer.iqamahTime && (
                <span
                  style={{
                    position: 'relative',
                    fontSize: isPortrait ? '3.2cqmin' : '2.6cqmin',
                    color: palette.muted,
                  }}
                >
                  {formatPrayerTime(prayer.iqamahTime, locale)}
                </span>
              )}
              {isNext && (
                <span
                  style={{
                    position: 'relative',
                    fontSize: isPortrait ? '2.6cqmin' : '2.2cqmin',
                    letterSpacing: '0.3em',
                    color: palette.gold,
                  }}
                >
                  {locale.labels.next}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const andalusiDefinition: ThemeDefinition = {
  id: 'andalusi',
  name: 'Andalusi',
  description: 'Córdoba arcade — a horseshoe arch for every prayer',
  component: AndalusiTheme,
  fields: [
    {
      key: 'palette',
      label: 'Colour',
      type: 'select',
      defaultValue: 'midnight',
      description: 'The ground the gold sits on',
      options: [
        { value: 'midnight', label: 'Midnight blue' },
        { value: 'emerald', label: 'Deep emerald' },
        { value: 'plum', label: 'Plum' },
      ],
    },
    {
      key: 'pattern',
      label: 'Star lattice',
      type: 'switch',
      defaultValue: true,
      description: 'Geometric tessellation behind the arcade',
    },
  ],
  defaultConfig: {
    palette: 'midnight',
    pattern: true,
  },
};
