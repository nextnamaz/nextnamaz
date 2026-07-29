'use client';

import type { CSSProperties } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import { formatPrayerTime } from '@/lib/display-locale';
import { useDisplayClock } from '@/hooks/display/use-display-clock';
import { prayerStates, readBoolean, readPalette, readText } from './config';

// All sizing in container-query units so the theme holds up at any scale.

interface Palette {
  ink: string;
  accent: string;
  accentSoft: string;
  gold: string;
  goldSoft: string;
  muted: string;
}

const PALETTES: Record<string, Palette> = {
  green: {
    ink: '#14261d',
    accent: '#1f5138',
    accentSoft: 'rgba(31,81,56,0.09)',
    gold: '#b08422',
    goldSoft: 'rgba(176,132,34,0.34)',
    muted: 'rgba(20,38,29,0.52)',
  },
  burgundy: {
    ink: '#2a1418',
    accent: '#6d2233',
    accentSoft: 'rgba(109,34,51,0.09)',
    gold: '#b08422',
    goldSoft: 'rgba(176,132,34,0.34)',
    muted: 'rgba(42,20,24,0.52)',
  },
  navy: {
    ink: '#131e2e',
    accent: '#1e3a5f',
    accentSoft: 'rgba(30,58,95,0.09)',
    gold: '#a8802b',
    goldSoft: 'rgba(168,128,43,0.34)',
    muted: 'rgba(19,30,46,0.52)',
  },
};

const PAPER = '#f8f4ea';
const SERIF = 'Georgia, "Times New Roman", serif';

/** Thin gold double rule with a small diamond at its centre. */
function Rule({ palette, width }: { palette: Palette; width: string }) {
  return (
    <div
      aria-hidden
      style={{ display: 'flex', alignItems: 'center', gap: '1.2cqmin', width, maxWidth: '100%' }}
    >
      <Line palette={palette} />
      <span
        style={{
          width: '1.1cqmin',
          height: '1.1cqmin',
          flex: '0 0 auto',
          transform: 'rotate(45deg)',
          background: palette.gold,
        }}
      />
      <Line palette={palette} />
    </div>
  );
}

function Line({ palette }: { palette: Palette }) {
  return (
    <span
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5cqmin',
      }}
    >
      <span style={{ height: '1px', background: palette.goldSoft }} />
      <span style={{ height: '1px', background: palette.goldSoft }} />
    </span>
  );
}

export function MasjidTheme({ prayers, nextPrayer, config, isPortrait, locale }: ThemeProps) {
  const { timeStr, dateStr, date } = useDisplayClock(locale);

  const palette = readPalette(PALETTES, config.palette, 'green');
  const footerText = readText(config.footerText, 'بسم الله الرحمن الرحيم');
  const ornament = readBoolean(config.ornament, true);

  const states = prayerStates(prayers, nextPrayer?.name ?? null, date);
  const hasIqamah = prayers.some((prayer) => prayer.iqamahTime);

  const root: CSSProperties = {
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: PAPER,
    color: palette.ink,
  };

  // Geometric lattice built entirely from CSS gradients — no images, no SVG.
  const ornamentLayer: CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    opacity: 0.055,
    backgroundImage: `
      repeating-linear-gradient(45deg, ${palette.accent} 0 1px, transparent 1px 7cqmin),
      repeating-linear-gradient(-45deg, ${palette.accent} 0 1px, transparent 1px 7cqmin),
      radial-gradient(circle at 50% 50%, ${palette.gold} 0 0.7cqmin, transparent 0.7cqmin)
    `,
    backgroundSize: 'auto, auto, 7cqmin 7cqmin',
  };

  return (
    <div data-theme="masjid" style={root}>
      {ornament && <div aria-hidden style={ornamentLayer} />}

      {/* Header: centred clock framed by gold rules */}
      <div
        style={{
          position: 'relative',
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isPortrait ? '1.4cqmin' : '1cqmin',
          padding: isPortrait ? '4cqmin 5cqmin 3cqmin' : '3cqmin 6cqmin 2.2cqmin',
        }}
      >
        <Rule palette={palette} width={isPortrait ? '68%' : '46%'} />
        <div
          suppressHydrationWarning
          style={{
            fontFamily: SERIF,
            fontSize: isPortrait ? '13cqmin' : '11cqmin',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.015em',
            fontVariantNumeric: 'tabular-nums',
            color: palette.accent,
          }}
        >
          {timeStr}
        </div>
        <div
          suppressHydrationWarning
          style={{
            fontSize: isPortrait ? '3cqmin' : '2.4cqmin',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: palette.muted,
            textAlign: 'center',
          }}
        >
          {dateStr}
        </div>
        <Rule palette={palette} width={isPortrait ? '68%' : '46%'} />
      </div>

      {/* Prayer table */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: isPortrait ? '0 5cqmin' : '0 7cqmin',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2cqmin',
            padding: '1.2cqmin 2.5cqmin',
            fontSize: isPortrait ? '2.5cqmin' : '2cqmin',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: palette.muted,
            borderBottom: `1px solid ${palette.goldSoft}`,
          }}
        >
          <span style={{ flex: 1, textAlign: 'start' }}>{locale.labels.prayer}</span>
          <span style={{ width: '22%', textAlign: 'end' }}>{locale.labels.begins}</span>
          {hasIqamah && (
            <span style={{ width: '22%', textAlign: 'end' }}>{locale.labels.iqamah}</span>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {prayers.map((prayer, index) => {
            const state = states[index];
            const isNext = state === 'next';

            return (
              <div
                key={prayer.name}
                style={{
                  position: 'relative',
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2cqmin',
                  padding: '0 2.5cqmin',
                  borderBottom: `1px solid ${palette.goldSoft}`,
                  background: isNext ? palette.accentSoft : 'transparent',
                  opacity: state === 'past' ? 0.42 : 1,
                }}
              >
                {isNext && (
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      insetInlineStart: 0,
                      top: 0,
                      bottom: 0,
                      width: '0.7cqmin',
                      background: palette.gold,
                    }}
                  />
                )}
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '1.6cqmin',
                    fontSize: isPortrait ? '5cqmin' : '4.2cqmin',
                    fontWeight: isNext ? 700 : 500,
                    color: isNext ? palette.accent : palette.ink,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {prayer.displayName}
                  {isNext && (
                    <span
                      style={{
                        fontSize: isPortrait ? '2.2cqmin' : '1.8cqmin',
                        letterSpacing: '0.24em',
                        textTransform: 'uppercase',
                        color: palette.gold,
                      }}
                    >
                      {locale.labels.next}
                    </span>
                  )}
                </span>
                <span
                  style={{
                    width: '22%',
                    textAlign: 'end',
                    fontFamily: SERIF,
                    fontSize: isPortrait ? '5.4cqmin' : '4.6cqmin',
                    fontWeight: isNext ? 700 : 500,
                    fontVariantNumeric: 'tabular-nums',
                    color: isNext ? palette.accent : palette.ink,
                  }}
                >
                  {formatPrayerTime(prayer.time, locale)}
                </span>
                {hasIqamah && (
                  <span
                    style={{
                      width: '22%',
                      textAlign: 'end',
                      fontFamily: SERIF,
                      fontSize: isPortrait ? '5.4cqmin' : '4.6cqmin',
                      fontVariantNumeric: 'tabular-nums',
                      color: palette.muted,
                    }}
                  >
                    {prayer.iqamahTime ? formatPrayerTime(prayer.iqamahTime, locale) : '—'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer inscription */}
      {footerText && (
        <div
          dir="auto"
          style={{
            position: 'relative',
            flex: '0 0 auto',
            textAlign: 'center',
            padding: isPortrait ? '2.6cqmin 5cqmin' : '2.2cqmin 6cqmin',
            fontFamily: SERIF,
            fontSize: isPortrait ? '3.4cqmin' : '2.8cqmin',
            color: palette.accent,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {footerText}
        </div>
      )}
    </div>
  );
}

export const masjidDefinition: ThemeDefinition = {
  id: 'masjid',
  name: 'Masjid',
  description: 'Warm and traditional, gold on ivory',
  component: MasjidTheme,
  fields: [
    {
      key: 'palette',
      label: 'Colour',
      type: 'select',
      defaultValue: 'green',
      description: 'The accent used for headings and the next prayer',
      options: [
        { value: 'green', label: 'Green' },
        { value: 'burgundy', label: 'Burgundy' },
        { value: 'navy', label: 'Navy' },
      ],
    },
    {
      key: 'footerText',
      label: 'Footer text',
      type: 'text',
      defaultValue: 'بسم الله الرحمن الرحيم',
      description: 'Shown along the bottom. Leave empty to hide.',
    },
    {
      key: 'ornament',
      label: 'Background pattern',
      type: 'switch',
      defaultValue: true,
      description: 'Faint geometric lattice behind the table',
    },
  ],
  defaultConfig: {
    palette: 'green',
    footerText: 'بسم الله الرحمن الرحيم',
    ornament: true,
  },
};
