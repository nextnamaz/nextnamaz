'use client';

import type { CSSProperties } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import { formatPrayerTime } from '@/lib/display-locale';
import { useDisplayClock } from '@/hooks/display/use-display-clock';
import { prayerStates, readPalette, readText, readBoolean } from './config';
import { Parchment, IlluminatedBand, Shamsa } from './ornament';

// An illuminated manuscript page: aged paper, a calligraphic invocation at the
// head, and the prayers set as ruled entries with gold leader dots.

interface Palette {
  paper: string;
  paperEdge: string;
  band: string;
  ink: string;
  muted: string;
  rubric: string;
  gold: string;
  stain: string;
}

const PALETTES: Record<string, Palette> = {
  lapis: {
    paper: '#f6ead0',
    paperEdge: '#ecdcb6',
    band: '#16336b',
    ink: '#241a0c',
    muted: 'rgba(36,26,12,0.55)',
    rubric: '#9c2b1b',
    gold: '#c9a227',
    stain: '#6b4a1f',
  },
  emerald: {
    paper: '#f6ead0',
    paperEdge: '#eadcb8',
    band: '#0e4436',
    ink: '#1e1a0d',
    muted: 'rgba(30,26,13,0.55)',
    rubric: '#9c2b1b',
    gold: '#c9a227',
    stain: '#4a4520',
  },
  vermilion: {
    paper: '#f7ecd6',
    paperEdge: '#eedfbe',
    band: '#7a1f14',
    ink: '#2a1a0e',
    muted: 'rgba(42,26,14,0.55)',
    rubric: '#7a1f14',
    gold: '#c9a227',
    stain: '#6b3a1f',
  },
};

export function ManuscriptTheme({ prayers, nextPrayer, config, isPortrait, locale }: ThemeProps) {
  const { timeStr, dateStr, date } = useDisplayClock(locale);
  const palette = readPalette(PALETTES, config.palette, 'lapis');
  const invocation = readText(config.invocation, 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');
  const aged = readBoolean(config.aged, true);
  const states = prayerStates(prayers, nextPrayer?.name ?? null, date);

  const root: CSSProperties = {
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: `radial-gradient(ellipse at 50% 40%, ${palette.paper} 0%, ${palette.paperEdge} 100%)`,
    color: palette.ink,
    fontFamily: 'var(--font-naskh)',
  };

  return (
    <div data-theme="manuscript" style={root}>
      {aged && <Parchment tint={palette.stain} />}
      <IlluminatedBand
        band={palette.band}
        gold={palette.gold}
        width={isPortrait ? '5cqmin' : '4.5cqmin'}
        countLong={isPortrait ? 9 : 13}
        countShort={isPortrait ? 13 : 7}
      />

      {/* Head of the page: the invocation, then the hour */}
      <div
        style={{
          position: 'relative',
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isPortrait ? '1cqmin' : '0.6cqmin',
          padding: isPortrait ? '9cqmin 10cqmin 2cqmin' : '8cqmin 12cqmin 1.5cqmin',
        }}
      >
        {invocation && (
          <div
            dir="auto"
            style={{
              fontFamily: 'var(--font-ruqaa)',
              fontSize: isPortrait ? '7.6cqmin' : '6.4cqmin',
              lineHeight: 1.45,
              color: palette.rubric,
              textAlign: 'center',
              maxWidth: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {invocation}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2.2cqmin',
            marginTop: isPortrait ? '1cqmin' : '0.5cqmin',
          }}
        >
          <Shamsa color={palette.gold} size={isPortrait ? '4cqmin' : '3.4cqmin'} />
          <span
            suppressHydrationWarning
            style={{
              fontSize: isPortrait ? '10.5cqmin' : '8.8cqmin',
              fontWeight: 700,
              lineHeight: 1,
              color: palette.ink,
            }}
          >
            {timeStr}
          </span>
          <Shamsa color={palette.gold} size={isPortrait ? '4cqmin' : '3.4cqmin'} />
        </div>
        <span
          suppressHydrationWarning
          style={{
            fontSize: isPortrait ? '3cqmin' : '2.5cqmin',
            letterSpacing: '0.26em',
            color: palette.muted,
          }}
        >
          {dateStr}
        </span>
      </div>

      {/* Ruled entries */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          // Portrait has far more height than six entries need; spread them
          // down the page rather than stranding them in the middle.
          justifyContent: isPortrait ? 'space-evenly' : 'center',
          gap: isPortrait ? '0.5cqmin' : '0.2cqmin',
          padding: isPortrait ? '0 11cqmin 9cqmin' : '0 14cqmin 8.5cqmin',
        }}
      >
        {prayers.map((prayer, index) => {
          const state = states[index];
          const isNext = state === 'next';

          return (
            <div
              key={prayer.name}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: isPortrait ? '2cqmin' : '1.6cqmin',
                padding: isPortrait ? '1.4cqmin 2cqmin' : '1.1cqmin 2cqmin',
                borderRadius: '0.8cqmin',
                background: isNext ? `${palette.gold}1f` : 'transparent',
                opacity: state === 'past' ? 0.45 : 1,
              }}
            >
              {isNext ? (
                <Shamsa color={palette.rubric} size={isPortrait ? '3cqmin' : '2.4cqmin'} />
              ) : (
                <span style={{ width: isPortrait ? '3cqmin' : '2.4cqmin', flex: '0 0 auto' }} />
              )}
              <span
                style={{
                  fontSize: isPortrait ? '6cqmin' : '5.2cqmin',
                  fontWeight: isNext ? 700 : 400,
                  color: isNext ? palette.rubric : palette.ink,
                  whiteSpace: 'nowrap',
                }}
              >
                {prayer.displayName}
              </span>

              <span aria-hidden style={{ flex: 1, minWidth: '2cqmin' }} />

              {prayer.iqamahTime && (
                <span
                  style={{
                    fontSize: isPortrait ? '3.2cqmin' : '2.8cqmin',
                    color: palette.muted,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {locale.labels.iqamah} {formatPrayerTime(prayer.iqamahTime, locale)}
                </span>
              )}
              <span
                style={{
                  fontSize: isPortrait ? '6.8cqmin' : '6cqmin',
                  fontWeight: 700,
                  color: isNext ? palette.rubric : palette.ink,
                  whiteSpace: 'nowrap',
                }}
              >
                {formatPrayerTime(prayer.time, locale)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const manuscriptDefinition: ThemeDefinition = {
  id: 'manuscript',
  name: 'Manuscript',
  description: 'Illuminated page — calligraphy on aged parchment',
  component: ManuscriptTheme,
  fields: [
    {
      key: 'palette',
      label: 'Ink',
      type: 'select',
      defaultValue: 'sepia',
      description: 'The colour of the rubrics',
      options: [
        { value: 'sepia', label: 'Sepia and vermilion' },
        { value: 'indigo', label: 'Indigo' },
        { value: 'olive', label: 'Olive' },
      ],
    },
    {
      key: 'invocation',
      label: 'Invocation',
      type: 'text',
      defaultValue: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      description: 'Calligraphic line at the head of the page. Empty to hide.',
    },
    {
      key: 'aged',
      label: 'Aged paper',
      type: 'switch',
      defaultValue: true,
      description: 'Grain and staining on the parchment',
    },
  ],
  defaultConfig: {
    palette: 'sepia',
    invocation: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    aged: true,
  },
};
