'use client';

import type { CSSProperties } from 'react';
import { Sunrise } from 'lucide-react';
import type { ThemeProps, ThemeDefinition } from './index';
import type { PrayerTimeEntry } from '@/types/prayer';
import { formatPrayerTime } from '@/lib/display-locale';
import { useDisplayClock } from '@/hooks/display/use-display-clock';
import {
  countdownTo,
  minutesOf,
  pad,
  prayerStates,
  readBoolean,
  readPalette,
  readText,
} from './config';
import { MihrabNiche } from './ornament';

// A dark prayer-hall board: the mihrab sunk into the ground tone-on-tone, a
// flip clock, the ayat set in naskh, and one luminous accent carrying the next
// prayer and the countdown. Both orientations use the same vertical stack —
// only the type scale and the column width change — so a TV shows the same
// composition as the portrait board it is modelled on.

interface Palette {
  bg: string;
  niche: string;
  nicheEdge: string;
  tile: string;
  text: string;
  muted: string;
  rule: string;
  accent: string;
  accentWash: string;
  sun: string;
}

const PALETTES: Record<string, Palette> = {
  mint: {
    bg: '#0b0e17',
    niche: '#141824',
    nicheEdge: 'rgba(255,255,255,0.09)',
    tile: '#1b1f2b',
    text: '#f2f5f8',
    muted: 'rgba(242,245,248,0.55)',
    rule: 'rgba(255,255,255,0.09)',
    accent: '#3fe0a2',
    accentWash: 'rgba(63,224,162,0.14)',
    sun: '#f5c451',
  },
  amber: {
    bg: '#0e0c0a',
    niche: '#191510',
    nicheEdge: 'rgba(255,255,255,0.09)',
    tile: '#221d17',
    text: '#f7f3ee',
    muted: 'rgba(247,243,238,0.55)',
    rule: 'rgba(255,255,255,0.09)',
    accent: '#f0b544',
    accentWash: 'rgba(240,181,68,0.14)',
    sun: '#f0b544',
  },
  azure: {
    bg: '#080e18',
    niche: '#101b28',
    nicheEdge: 'rgba(255,255,255,0.09)',
    tile: '#16202e',
    text: '#eef4fa',
    muted: 'rgba(238,244,250,0.55)',
    rule: 'rgba(255,255,255,0.09)',
    accent: '#4cc9f0',
    accentWash: 'rgba(76,201,240,0.14)',
    sun: '#f5c451',
  },
};

const SANS = 'var(--font-inter), ui-sans-serif, system-ui, sans-serif';
const NASKH = 'var(--font-naskh)';

/** Minutes between a prayer and its iqamah, for the "+20" column. */
function iqamahOffset(prayer: PrayerTimeEntry): number | null {
  if (!prayer.iqamahTime) return null;
  const delta = minutesOf(prayer.iqamahTime) - minutesOf(prayer.time);
  return delta > 0 ? delta : null;
}

/** One flip-clock tile, split across the middle like a real split-flap. */
function FlipUnit({ value, palette, size }: { value: string; palette: Palette; size: string }) {
  return (
    <span
      suppressHydrationWarning
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: palette.tile,
        borderRadius: '1.4cqmin',
        padding: '0.7cqmin 1.5cqmin',
        lineHeight: 1,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: '-0.03em',
        color: palette.text,
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
}

function Ayah({ text, palette, size }: { text: string; palette: Palette; size: string }) {
  if (!text) return null;
  return (
    <div
      dir="auto"
      style={{
        position: 'relative',
        fontFamily: NASKH,
        fontSize: size,
        lineHeight: 1.75,
        color: palette.text,
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

export function MihrabTheme({ prayers, nextPrayer, config, isPortrait, locale }: ThemeProps) {
  const { timeStr, dateStr, date } = useDisplayClock(locale);
  const palette = readPalette(PALETTES, config.palette, 'mint');
  const ayahTop = readText(config.ayahTop, 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا');
  const ayahBottom = readText(
    config.ayahBottom,
    'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا'
  );
  const showSeconds = readBoolean(config.showSeconds, true);

  const states = prayerStates(prayers, nextPrayer?.name ?? null, date);
  const countdown = nextPrayer ? countdownTo(nextPrayer.time, date) : null;
  // With no iqamah data the offset column is dead weight.
  const hasIqamah = prayers.some((prayer) => iqamahOffset(prayer) !== null);

  const parts = timeStr.split(':');
  const hh = parts[0] ?? '00';
  const mm = parts[1] ?? '00';
  const ss = parts.length >= 3 ? parts[2] : '';

  /** Pick a size for the current orientation. */
  const t = (portrait: string, landscape: string) => (isPortrait ? portrait : landscape);
  const clockSize = t('13cqmin', '9.5cqmin');

  const root: CSSProperties = {
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: palette.bg,
    color: palette.text,
    fontFamily: SANS,
    fontVariantNumeric: 'tabular-nums',
    padding: t('4cqmin 4cqmin 3cqmin', '2.5cqmin 4cqmin 2.5cqmin'),
  };

  // A landscape screen is far wider than this board needs; holding the stack
  // in a centred column keeps the proportions of the portrait original.
  const column: CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: t('100%', '72%'),
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  return (
    <div data-theme="mihrab" style={root}>
      {/* The niche is sunk into the ground behind the head of the board */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: t('2%', '20%'),
          right: t('2%', '20%'),
          height: t('42%', '58%'),
        }}
      >
        <MihrabNiche fill={palette.niche} edge={palette.nicheEdge} />
      </div>

      <div style={column}>
        {/* Head: date, flip clock, verse */}
        <div
          style={{
            position: 'relative',
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: t('1.6cqmin', '1cqmin'),
            paddingBottom: t('2cqmin', '1.4cqmin'),
          }}
        >
          <span
            suppressHydrationWarning
            style={{
              fontSize: t('2.9cqmin', '2.2cqmin'),
              letterSpacing: '0.08em',
              color: palette.muted,
            }}
          >
            {dateStr}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7cqmin' }}>
            <FlipUnit value={hh} palette={palette} size={clockSize} />
            <span style={{ fontSize: clockSize, fontWeight: 700, lineHeight: 1 }}>:</span>
            <FlipUnit value={mm} palette={palette} size={clockSize} />
            {showSeconds && ss && (
              <span
                suppressHydrationWarning
                style={{
                  fontSize: t('6cqmin', '4.4cqmin'),
                  fontWeight: 600,
                  alignSelf: 'flex-end',
                  paddingBottom: t('1.2cqmin', '0.9cqmin'),
                }}
              >
                {ss}
              </span>
            )}
          </div>

          <Ayah text={ayahTop} palette={palette} size={t('5.4cqmin', '3.8cqmin')} />
        </div>

        {/* Prayer table */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {prayers.map((prayer, index) => {
            const state = states[index];
            const isNext = state === 'next';
            const offset = iqamahOffset(prayer);
            const isSunrise = prayer.name === 'sunrise';

            return (
              <div
                key={prayer.name}
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2cqmin',
                  padding: '0 3cqmin',
                  borderTop: index === 0 ? undefined : `1px solid ${palette.rule}`,
                  background: isNext
                    ? `linear-gradient(90deg, transparent 0%, ${palette.accentWash} 20%, ${palette.accentWash} 80%, transparent 100%)`
                    : 'transparent',
                  color: isNext ? palette.accent : palette.text,
                  opacity: state === 'past' ? 0.62 : 1,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: t('4cqmin', '3cqmin'),
                    fontWeight: 500,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {isSunrise ? (
                    <Sunrise
                      style={{
                        width: t('7cqmin', '5cqmin'),
                        height: t('7cqmin', '5cqmin'),
                        color: palette.sun,
                      }}
                      strokeWidth={2}
                    />
                  ) : (
                    prayer.displayName
                  )}
                </span>

                <span
                  style={{
                    fontSize: t('6.4cqmin', '4.8cqmin'),
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    textAlign: 'center',
                  }}
                >
                  {formatPrayerTime(prayer.time, locale)}
                </span>

                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'end',
                    fontSize: t('3.6cqmin', '2.8cqmin'),
                    color: isNext ? palette.accent : palette.muted,
                  }}
                >
                  {hasIqamah && offset !== null ? `+${offset}` : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Foot: verse, then the countdown to the next prayer */}
        <div
          style={{
            position: 'relative',
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: t('0.6cqmin', '0.3cqmin'),
            paddingTop: t('2cqmin', '1.4cqmin'),
          }}
        >
          <Ayah text={ayahBottom} palette={palette} size={t('4cqmin', '3cqmin')} />
          {countdown && nextPrayer && (
            <>
              <div
                suppressHydrationWarning
                style={{
                  fontSize: t('11cqmin', '8cqmin'),
                  fontWeight: 700,
                  lineHeight: 1.08,
                  letterSpacing: '-0.02em',
                  color: palette.accent,
                }}
              >
                {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
              </div>
              <div
                style={{
                  fontSize: t('3cqmin', '2.2cqmin'),
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: palette.muted,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {nextPrayer.displayName} · {locale.labels.next}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const mihrabDefinition: ThemeDefinition = {
  id: 'mihrab',
  name: 'Mihrab',
  description: 'Dark prayer board with a sunken niche and countdown',
  component: MihrabTheme,
  fields: [
    {
      key: 'palette',
      label: 'Accent',
      type: 'select',
      defaultValue: 'mint',
      description: 'The colour of the next prayer and the countdown',
      options: [
        { value: 'mint', label: 'Mint' },
        { value: 'amber', label: 'Amber' },
        { value: 'azure', label: 'Azure' },
      ],
    },
    {
      key: 'ayahTop',
      label: 'Verse (above)',
      type: 'text',
      defaultValue: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
      description: 'Shown under the clock. Empty to hide.',
    },
    {
      key: 'ayahBottom',
      label: 'Verse (below)',
      type: 'text',
      defaultValue: 'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا',
      description: 'Shown under the table. Empty to hide.',
    },
    {
      key: 'showSeconds',
      label: 'Show seconds',
      type: 'switch',
      defaultValue: true,
      description: 'Seconds beside the clock',
    },
  ],
  defaultConfig: {
    palette: 'mint',
    ayahTop: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    ayahBottom: 'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا',
    showSeconds: true,
  },
};
