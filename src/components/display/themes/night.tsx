'use client';

import type { CSSProperties } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import type { PrayerTimeEntry } from '@/types/prayer';
import { formatPrayerTime, isRtlLocale } from '@/lib/display-locale';
import { useDisplayClock } from '@/hooks/display/use-display-clock';
import { countdownTo, minutesOf, prayerStates, readBoolean, readString, readText } from './config';
import { Verse, PrayerLabel, formatCountdown, countdownPhrase } from '../parts';

// A dark board that does one thing: be readable from the back of the hall.
// No texture, no lattice, no ornament — the room supplies the atmosphere and
// the screen supplies the times. Everything is ink, one accent, and space.
//
// The accent is used exactly once, on the next prayer, so the eye lands there
// before it lands anywhere else.

const INK = '#0C0D10';
const TEXT = '#F4F5F7';
const MUTED = 'rgba(244,245,247,0.46)';
const RULE = 'rgba(244,245,247,0.10)';

interface Accent {
  line: string;
  wash: string;
  /** Text on top of the accent wash; the wash is translucent, so this is the accent itself. */
  on: string;
}

const AMBER: Accent = { line: '#E8A817', wash: 'rgba(232,168,23,0.13)', on: '#F5C452' };

const ACCENTS: Record<string, Accent> = {
  amber: AMBER,
  mint: { line: '#3FE0A2', wash: 'rgba(63,224,162,0.12)', on: '#6BEBBB' },
  azure: { line: '#4EA8FF', wash: 'rgba(78,168,255,0.13)', on: '#7DC0FF' },
};

function readAccent(value: unknown): Accent {
  const key = readString(value, 'amber');
  // Own keys only: the value comes from saved config, and an inherited name
  // like 'constructor' is not an accent.
  for (const [name, accent] of Object.entries(ACCENTS)) {
    if (name === key) return accent;
  }
  return AMBER;
}

function hasIqamahTime(prayer: PrayerTimeEntry): boolean {
  if (!prayer.iqamahTime) return false;
  return minutesOf(prayer.iqamahTime) - minutesOf(prayer.time) > 0;
}

export function NightTheme({ prayers, nextPrayer, config, isPortrait, locale }: ThemeProps) {
  const { timeStr, dateStr, date } = useDisplayClock(locale);
  const accent = readAccent(config.accent);
  const verse = readText(config.verse, '');
  const showSeconds = readBoolean(config.showSeconds, false);

  const states = prayerStates(prayers, nextPrayer?.name ?? null, date);
  const countdown = nextPrayer ? countdownTo(nextPrayer.time, date) : null;
  const showIqamah = prayers.some(hasIqamahTime);
  const rtl = isRtlLocale(locale);

  /** Pick a size for the current orientation. */
  const t = (portrait: string, landscape: string) => (isPortrait ? portrait : landscape);

  const root: CSSProperties = {
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: INK,
    color: TEXT,
    fontVariantNumeric: 'tabular-nums',
    direction: rtl ? 'rtl' : 'ltr',
    padding: t('5cqmin 5cqmin 4cqmin', '3.5cqmin 6cqmin'),
  };

  // Landscape is far wider than a prayer list needs; a centred column keeps
  // the name and the time from drifting to opposite edges of a 65" screen.
  const column: CSSProperties = {
    width: '100%',
    maxWidth: t('100%', '68%'),
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  };

  const rowBase: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: showIqamah ? '1fr auto auto' : '1fr auto',
    alignItems: 'center',
    columnGap: t('4cqmin', '3cqmin'),
    padding: t('0 2.5cqmin', '0 2.5cqmin'),
    borderTop: `1px solid ${RULE}`,
    flex: 1,
    minHeight: 0,
  };

  const nameSize = t('5.2cqmin', '3.5cqmin');
  const timeSize = t('5.6cqmin', '3.8cqmin');

  return (
    <div data-theme="night" style={root}>
      <div style={column}>
        {/* Clock */}
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingBottom: t('3cqmin', '2cqmin'),
          }}
        >
          <div
            style={{
              fontSize: t('15cqmin', '11cqmin'),
              lineHeight: 1,
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            {showSeconds ? timeStr : timeStr.split(':').slice(0, 2).join(':')}
          </div>
          <div
            style={{
              fontSize: t('3.2cqmin', '2.1cqmin'),
              color: MUTED,
              marginTop: t('1.2cqmin', '0.9cqmin'),
              letterSpacing: '0.04em',
            }}
          >
            {dateStr}
          </div>
        </header>

        {/* Prayer rows. The next prayer is the only thing wearing the accent. */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {prayers.map((prayer, i) => {
            const state = states[i];
            const isNext = state === 'next';
            const isPast = state === 'past';

            return (
              <div
                key={prayer.name}
                style={{
                  ...rowBase,
                  background: isNext ? accent.wash : 'transparent',
                  boxShadow: isNext ? `inset ${rtl ? '-' : ''}0.6cqmin 0 0 0 ${accent.line}` : undefined,
                  color: isNext ? accent.on : isPast ? MUTED : TEXT,
                  opacity: isPast ? 0.55 : 1,
                }}
              >
                <PrayerLabel
                  prayer={prayer}
                  size={nameSize}
                  sunColor={MUTED}
                  style={{
                    fontSize: nameSize,
                    fontWeight: isNext ? 600 : 400,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                />

                <span style={{ fontSize: timeSize, fontWeight: isNext ? 700 : 500 }}>
                  {formatPrayerTime(prayer.time, locale)}
                </span>

                {showIqamah && (
                  // Empty, not a hidden dash: the column keeps its width via
                  // minWidth, and a screen reader is not told "em dash" for
                  // every sunrise row.
                  <span
                    style={{
                      fontSize: timeSize,
                      fontWeight: isNext ? 700 : 500,
                      minWidth: '4ch',
                      textAlign: rtl ? 'left' : 'right',
                    }}
                  >
                    {prayer.iqamahTime && hasIqamahTime(prayer)
                      ? formatPrayerTime(prayer.iqamahTime, locale)
                      : ''}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Countdown */}
        {countdown && nextPrayer && (
          <footer
            style={{
              borderTop: `1px solid ${RULE}`,
              paddingTop: t('3cqmin', '2cqmin'),
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: t('2.9cqmin', '2cqmin'),
                color: MUTED,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {countdownPhrase(nextPrayer, locale)}
            </div>
            <div
              style={{
                fontSize: t('9cqmin', '6.5cqmin'),
                lineHeight: 1.05,
                fontWeight: 600,
                color: accent.on,
                letterSpacing: '-0.01em',
              }}
            >
              {formatCountdown(countdown, { showSeconds: true })}
            </div>
          </footer>
        )}

        {verse && (
          <div style={{ paddingTop: t('2.5cqmin', '1.6cqmin'), textAlign: 'center' }}>
            <Verse text={verse} size={t('3.4cqmin', '2.3cqmin')} color={MUTED} />
          </div>
        )}
      </div>
    </div>
  );
}

export const nightDefinition: ThemeDefinition = {
  id: 'night',
  name: 'Night',
  description: 'Dark board, one accent on the next prayer, nothing else',
  component: NightTheme,
  fields: [
    {
      key: 'accent',
      label: 'Accent',
      type: 'select',
      defaultValue: 'amber',
      description: 'Marks the next prayer and the countdown',
      options: [
        { value: 'amber', label: 'Amber' },
        { value: 'mint', label: 'Mint' },
        { value: 'azure', label: 'Azure' },
      ],
    },
    {
      key: 'verse',
      label: 'Verse',
      type: 'text',
      defaultValue: '',
      description: 'Optional line under the countdown. Empty to hide.',
    },
    {
      key: 'showSeconds',
      label: 'Show seconds',
      type: 'switch',
      defaultValue: false,
      description: 'Seconds on the clock',
    },
  ],
  defaultConfig: {
    accent: 'amber',
    verse: '',
    showSeconds: false,
  },
};
