'use client';

import type { CSSProperties } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import { formatPrayerTime } from '@/lib/display-locale';
import { useDisplayClock } from '@/hooks/display/use-display-clock';
import { prayerStates, readPalette, readBoolean } from './config';
import { TileField } from './ornament';

// Moroccan zellij: cut-tile mosaic behind ivory cartouches, one per prayer,
// lettered in a squared Kufic hand.

interface Palette {
  base: string;
  star: string;
  accentTile: string;
  card: string;
  cardMuted: string;
  cardEdge: string;
  ink: string;
  muted: string;
  gold: string;
  live: string;
}

const PALETTES: Record<string, Palette> = {
  emerald: {
    base: '#0d5a4e',
    star: '#0a4238',
    accentTile: '#d9b451',
    card: '#f6f1e2',
    cardMuted: '#d5d3bd',
    cardEdge: '#d8cba6',
    ink: '#123b33',
    muted: 'rgba(18,59,51,0.58)',
    gold: '#a9822c',
    live: '#0d5a4e',
  },
  cobalt: {
    base: '#12467e',
    star: '#0d3159',
    accentTile: '#e0bb5c',
    card: '#f4f1e6',
    cardMuted: '#cdcdc0',
    cardEdge: '#cfc7ab',
    ink: '#12294a',
    muted: 'rgba(18,41,74,0.58)',
    gold: '#a9822c',
    live: '#12467e',
  },
  terracotta: {
    base: '#9c4a2a',
    star: '#71341c',
    accentTile: '#e2be6a',
    card: '#f7efe0',
    cardMuted: '#dbcdba',
    cardEdge: '#dcc8a8',
    ink: '#4a2216',
    muted: 'rgba(74,34,22,0.58)',
    gold: '#a9822c',
    live: '#9c4a2a',
  },
};

export function ZellijTheme({ prayers, nextPrayer, config, isPortrait, locale }: ThemeProps) {
  const { timeStr, dateStr, date } = useDisplayClock(locale);
  const palette = readPalette(PALETTES, config.palette, 'emerald');
  const showTiles = readBoolean(config.tiles, true);
  const states = prayerStates(prayers, nextPrayer?.name ?? null, date);

  const root: CSSProperties = {
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: palette.base,
    color: palette.card,
    fontFamily: 'var(--font-kufi)',
  };

  return (
    <div data-theme="zellij" style={root}>
      {showTiles && (
        <TileField
          base={palette.base}
          star={palette.star}
          accent={palette.accentTile}
          density={isPortrait ? 5 : 7}
        />
      )}

      {/* Clock band */}
      <div
        style={{
          position: 'relative',
          flex: '0 0 auto',
          margin: isPortrait ? '4cqmin 4cqmin 0' : '3.5cqmin 5cqmin 0',
          padding: isPortrait ? '2.4cqmin 4cqmin' : '2cqmin 4cqmin',
          background: palette.card,
          border: `0.5cqmin solid ${palette.gold}`,
          borderRadius: '1.4cqmin',
          display: 'flex',
          flexDirection: isPortrait ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isPortrait ? '0.4cqmin' : '3cqmin',
          boxShadow: '0 1cqmin 3cqmin rgba(0,0,0,0.28)',
        }}
      >
        <span
          suppressHydrationWarning
          style={{
            fontSize: isPortrait ? '11cqmin' : '9.5cqmin',
            fontWeight: 700,
            lineHeight: 1,
            color: palette.ink,
            letterSpacing: '0.02em',
          }}
        >
          {timeStr}
        </span>
        <span
          suppressHydrationWarning
          style={{
            fontSize: isPortrait ? '3cqmin' : '2.6cqmin',
            letterSpacing: '0.22em',
            color: palette.muted,
          }}
        >
          {dateStr}
        </span>
      </div>

      {/* Cartouches */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: isPortrait ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gridTemplateRows: isPortrait ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
          gap: isPortrait ? '3cqmin' : '2.5cqmin',
          padding: isPortrait ? '4cqmin' : '3cqmin 5cqmin 4cqmin',
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
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isPortrait ? '0.8cqmin' : '0.5cqmin',
                padding: isPortrait ? '2cqmin 1.5cqmin' : '1.6cqmin 1.5cqmin',
                background: isNext ? palette.live : isPast ? palette.cardMuted : palette.card,
                border: `${isNext ? '0.7cqmin' : '0.4cqmin'} solid ${palette.gold}`,
                borderRadius: '1.4cqmin',
                boxShadow: isNext
                  ? `0 0 3cqmin ${palette.accentTile}88, 0 1cqmin 2cqmin rgba(0,0,0,0.3)`
                  : '0 0.8cqmin 2cqmin rgba(0,0,0,0.26)',
              }}
            >
              <span
                style={{
                  fontSize: isPortrait ? '4cqmin' : '3.4cqmin',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: isNext ? palette.accentTile : palette.muted,
                  opacity: isPast ? 0.6 : 1,
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
                  fontSize: isPortrait ? '9.5cqmin' : '8.6cqmin',
                  fontWeight: 700,
                  lineHeight: 1,
                  color: isNext ? palette.card : palette.ink,
                  opacity: isPast ? 0.55 : 1,
                }}
              >
                {formatPrayerTime(prayer.time, locale)}
              </span>
              {prayer.iqamahTime && (
                <span
                  style={{
                    fontSize: isPortrait ? '3cqmin' : '2.6cqmin',
                    color: isNext ? palette.accentTile : palette.muted,
                  }}
                >
                  {formatPrayerTime(prayer.iqamahTime, locale)}
                </span>
              )}
              {isNext && (
                <span
                  style={{
                    fontSize: isPortrait ? '2.2cqmin' : '1.9cqmin',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: palette.accentTile,
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

export const zellijDefinition: ThemeDefinition = {
  id: 'zellij',
  name: 'Zellij',
  description: 'Moroccan tilework with ivory cartouches',
  component: ZellijTheme,
  fields: [
    {
      key: 'palette',
      label: 'Tile colour',
      type: 'select',
      defaultValue: 'emerald',
      description: 'The glaze of the mosaic',
      options: [
        { value: 'emerald', label: 'Emerald' },
        { value: 'cobalt', label: 'Cobalt' },
        { value: 'terracotta', label: 'Terracotta' },
      ],
    },
    {
      key: 'tiles',
      label: 'Mosaic',
      type: 'switch',
      defaultValue: true,
      description: 'Cut-tile pattern behind the cartouches',
    },
  ],
  defaultConfig: {
    palette: 'emerald',
    tiles: true,
  },
};
