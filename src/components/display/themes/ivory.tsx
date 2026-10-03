'use client';

import type { CSSProperties } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import type { PrayerState } from './config';
import { formatLongDate, formatPrayerTime, isRtlLocale } from '@/lib/display-locale';
import { DEFAULT_TRANSLATIONS } from '@/lib/locale/presets';
import { useDisplayClock } from '@/hooks/display/use-display-clock';
import { useHydrated } from '@/hooks/display/use-hydrated';
import { countdownTo, prayerStates, readChoice } from './config';
import { countdownPhrase, formatCountdown, shrinkToFit, splitClock } from '../parts';

// A mosque's qibla wall in ivory and gold: carved plaster, the clock standing
// in the mihrab under the Basmala, and roundels hanging to either side as in
// Ottoman mosques: Allah and the Prophet, or the caliphs, or Hasan and Husayn.
//
// All the artwork is real and self-hosted under public/themes/ivory, credited
// in CREDITS.txt there: the Basmala in Ottoman thuluth (public domain), the
// roundels recreated from Masjid an-Nabawi (CC BY-SA 4.0, kept as their
// gilding alone), and the carved plaster photographed by KC Shum (Unsplash
// License).
//
// Flat, like a painted wall: no glows, no shadows, no gradients. One gold,
// kept for the calligraphy and the ornament; every number is in the ink.

const ASSETS = '/themes/ivory';
const GOLD = '#B48A2C';
/** The same gold, darkened just enough to read as small text on ivory. */
const GOLD_TEXT = '#9A6F12';
const IVORY = '#FAF6EE';
const HAIRLINE = 'max(1px, 0.14cqmin)';

interface Scheme {
  /** The clock and the times, the next prayer's ground, the roundels' discs. */
  ink: string;
  /** The ink of a prayer that is over. */
  faded: string;
}

// Deep enough that the gold reads on them, as gilding on a levha does.
const SCHEMES: Record<string, Scheme> = {
  navy: { ink: '#18223A', faded: 'rgb(24 34 58 / 0.4)' },
  green: { ink: '#173F31', faded: 'rgb(23 63 49 / 0.4)' },
  burgundy: { ink: '#5B1F2B', faded: 'rgb(91 31 43 / 0.4)' },
  teal: { ink: '#0F3F4A', faded: 'rgb(15 63 74 / 0.4)' },
  black: { ink: '#1C1A17', faded: 'rgb(28 26 23 / 0.4)' },
};

/** Carved plaster. wall.webp is one repeat of the carving, so it tiles without a seam. */
const WALL = `url(${ASSETS}/wall.webp) center / 16cqmin 16cqmin repeat, #F2EBDE`;

const ARABIC = DEFAULT_TRANSLATIONS.ar.prayers;

// --- The mihrab ---

// A pointed arch, as Ottoman mihrabs are drawn, in a 106 by 112 box: sides
// at 3 and 103 rise to the springing line at 62, and two arcs of radius 62
// meet at the apex. Both lines turn on the same two centres, so the band
// between them keeps its width all the way round.
const BOX = { width: 106, height: 112 };
const SPAN = { left: 3, right: 103, spring: 62 };
const RADIUS = 62;

function arch(inset: number): string {
  const r = RADIUS - inset;
  const middle = (SPAN.left + SPAN.right) / 2;
  // Each arc turns on a centre on the springing line, RADIUS in from its side.
  const offset = SPAN.left + RADIUS - middle;
  const apex = SPAN.spring - Math.sqrt(r * r - offset * offset);
  return [
    `M${SPAN.left + inset} ${BOX.height} V${SPAN.spring}`,
    `A${r} ${r} 0 0 1 ${middle} ${apex.toFixed(2)}`,
    `A${r} ${r} 0 0 1 ${SPAN.right - inset} ${SPAN.spring} V${BOX.height}`,
  ].join(' ');
}

/** The niche: plain ivory inside a double gold line. */
function Mihrab() {
  return (
    <svg viewBox={`0 0 ${BOX.width} ${BOX.height}`} aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
      <path d={`${arch(0)} Z`} fill={IVORY} />
      <g fill="none" stroke={GOLD} strokeLinecap="round">
        <path d={arch(0)} strokeWidth={0.7} />
        <path d={arch(2.4)} strokeWidth={0.3} />
      </g>
    </svg>
  );
}

// --- The roundels ---

interface Roundel {
  file: string;
  label: string;
}

const ALLAH: Roundel = { file: 'allah', label: 'الله' };
const MUHAMMAD: Roundel = { file: 'muhammad', label: 'محمد ﷺ' };
const ABU_BAKR: Roundel = { file: 'abu-bakr', label: 'أبو بكر' };
const UMAR: Roundel = { file: 'umar', label: 'عمر' };
const UTHMAN: Roundel = { file: 'uthman', label: 'عثمان' };
const ALI: Roundel = { file: 'ali', label: 'علي' };
const HASAN: Roundel = { file: 'hasan', label: 'الحسن' };
const HUSAYN: Roundel = { file: 'husayn', label: 'الحسين' };

/** A pair as it hangs either side of the mihrab: the first on the right as you face it. */
type Pair = readonly [Roundel, Roundel];

/** Each choice is the pairs it shows in turn; one pair stays put. */
const ROUNDELS: Record<string, readonly Pair[]> = {
  allah: [[ALLAH, MUHAMMAD]],
  caliphs: [
    [ABU_BAKR, UMAR],
    [UTHMAN, ALI],
  ],
  hasanayn: [[HASAN, HUSAYN]],
  none: [],
};

/** How long each pair hangs before the next takes its place. */
const TURN_MS = 30_000;

/**
 * A roundel: a disc in the screen's ink, gilded with the original
 * calligraphy, which is kept as a mask so the gold matches the rest of the
 * theme whatever the ink. Several can share a slot and take turns, fading
 * from one to the next.
 */
function Medallion({ roundels, shown, size, ink }: { roundels: readonly Roundel[]; shown: number; size: string; ink: string }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {roundels.map((roundel, i) => {
        const gilding = `url(${ASSETS}/roundels/${roundel.file}.svg) center / contain no-repeat`;
        return (
          <div
            key={roundel.file}
            role="img"
            aria-label={roundel.label}
            aria-hidden={i !== shown}
            style={{ position: 'absolute', inset: 0, opacity: i === shown ? 1 : 0, transition: 'opacity 1.5s ease' }}
          >
            {/* The artwork's disc: radius 1089 about the centre of a 2274 square. */}
            <div style={{ position: 'absolute', inset: '2.11%', borderRadius: '50%', background: ink }} />
            <div style={{ position: 'absolute', inset: 0, background: GOLD, WebkitMask: gilding, mask: gilding }} />
          </div>
        );
      })}
    </div>
  );
}

export function IvoryTheme({ prayers, nextPrayer, config, isPortrait, locale }: ThemeProps) {
  const { timeStr, date } = useDisplayClock(locale);
  // Nothing read off the clock is drawn until the TV's own clock is in charge.
  const live = useHydrated();
  const rtl = isRtlLocale(locale);
  const { ink, faded } = readChoice(SCHEMES, config.color, 'navy');
  const pairs = readChoice(ROUNDELS, config.roundels, 'allah');
  const turn = live && pairs.length > 1 ? Math.floor(date.getTime() / TURN_MS) % pairs.length : 0;

  const states: PrayerState[] = live
    ? prayerStates(prayers, nextPrayer?.name ?? null, date)
    : prayers.map(() => 'upcoming');
  const countdown = live && nextPrayer ? countdownTo(nextPrayer.time, date) : null;
  const [clock] = splitClock(timeStr);

  /** Pick a size for the current orientation. */
  const t = (portrait: string, landscape: string) => (isPortrait ? portrait : landscape);

  const emblem: CSSProperties = {
    height: t('min(22cqw, 12cqh)', '24cqh'),
    aspectRatio: '1064 / 1397',
    background: GOLD,
    WebkitMask: `url(${ASSETS}/basmala.svg) center / contain no-repeat`,
    mask: `url(${ASSETS}/basmala.svg) center / contain no-repeat`,
  };

  // Every line keeps its height before it has anything to say, so nothing
  // shifts when the clock and the countdown arrive.
  const face = (
    <div
      style={{
        position: 'absolute',
        inset: '12% 11% 3%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        textAlign: 'center',
      }}
    >
      <div style={emblem} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: t('min(3cqw, 1.7cqh)', '2cqmin') }}>
        <div
          dir="ltr"
          style={{
            fontSize: t('min(16cqw, 9cqh)', 'min(15cqmin, 8.4cqw)'),
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            visibility: live ? undefined : 'hidden',
          }}
        >
          {live ? clock : '00:00'}
        </div>
        <div style={{ fontSize: t('min(4.2cqw, 2.3cqh)', '3.2cqmin'), opacity: 0.65, marginTop: '0.8cqmin', visibility: live ? undefined : 'hidden' }}>
          {live ? formatLongDate(date, locale) : '\u00a0'}
        </div>
        <div
          style={{
            fontSize: t('min(4.4cqw, 2.5cqh)', '3.4cqmin'),
            marginTop: t('1.6cqw', '1.2cqmin'),
            whiteSpace: 'nowrap',
            visibility: live ? undefined : 'hidden',
          }}
        >
          {countdown && nextPrayer ? (
            <>
              {countdownPhrase(nextPrayer, locale)}{' '}
              <b>{formatCountdown(countdown, { showSeconds: true })}</b>
            </>
          ) : (
            '\u00a0'
          )}
        </div>
      </div>
    </div>
  );

  const mihrab = (
    <div style={{ position: 'relative', height: t('min(80cqw, 45cqh)', '70cqh'), aspectRatio: `${BOX.width} / ${BOX.height}`, flexShrink: 0 }}>
      <Mihrab />
      {face}
    </div>
  );

  // The timetable: one ruled band, set into the wall like an inlaid board,
  // with the next prayer filled in the ink. Not six floating cards.
  const band = (
    <div
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: isPortrait ? '1fr' : 'repeat(6, minmax(0, 1fr))',
        background: IVORY,
        borderTop: `${HAIRLINE} solid ${GOLD}`,
        borderBottom: `${HAIRLINE} solid ${GOLD}`,
      }}
    >
      {prayers.map((prayer, i) => {
        const state = states[i];
        const next = state === 'next';
        const past = state === 'past';
        // A hairline between neighbours, along the run of the band.
        const divider = `${HAIRLINE} solid rgb(180 138 44 / 0.4)`;
        const arabic = (
          <span
            lang="ar"
            dir="rtl"
            style={{
              fontFamily: 'var(--font-naskh)',
              fontWeight: 700,
              fontSize: t('min(5.6cqw, 3.1cqh)', '3.6cqmin'),
              lineHeight: 1.4,
              color: next ? GOLD : past ? 'rgb(154 111 18 / 0.45)' : GOLD_TEXT,
            }}
          >
            {ARABIC[prayer.name]}
          </span>
        );
        const name = !rtl && (
          <span
            style={{
              fontSize: `calc(${t('min(4.6cqw, 2.6cqh)', '2.8cqmin')} * ${shrinkToFit(prayer.displayName, 11)})`,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {prayer.displayName}
          </span>
        );
        const time = (
          <span style={{ fontSize: t('min(8cqw, 4.4cqh)', '6cqmin'), fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {formatPrayerTime(prayer.time, locale)}
          </span>
        );
        return (
          <div
            key={prayer.name}
            style={{
              background: next ? ink : undefined,
              color: next ? IVORY : past ? faded : ink,
              ...(isPortrait
                ? {
                    display: 'grid',
                    gridTemplateColumns: rtl ? 'minmax(0, 1fr) auto' : 'auto minmax(0, 1fr) auto',
                    alignItems: 'center',
                    columnGap: '4cqw',
                    padding: 'min(2cqw, 1.1cqh) 5cqw',
                    borderTop: i > 0 ? divider : undefined,
                  }
                : {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '1.6cqmin 1cqmin 1.8cqmin',
                    borderInlineStart: i > 0 ? divider : undefined,
                  }),
            }}
          >
            {arabic}
            {name}
            {time}
          </div>
        );
      })}
    </div>
  );

  const root: CSSProperties = {
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: WALL,
    color: ink,
    fontVariantNumeric: 'tabular-nums',
    direction: rtl ? 'rtl' : 'ltr',
    padding: t('min(7cqw, 4cqh) 6cqw min(6cqw, 3.4cqh)', '4.5cqmin 6cqmin 5cqmin'),
  };

  /** The roundels on one side, as you face the mihrab; nothing when the screen has none. */
  const side = (which: 0 | 1, size: string) =>
    pairs.length > 0 && <Medallion roundels={pairs.map((pair) => pair[which])} shown={turn} size={size} ink={ink} />;

  // In both orientations the mihrab stands on the band, as a niche stands on
  // the floor; whatever room is left goes above it, as wall.
  if (isPortrait) {
    return (
      <div data-theme="ivory" style={root}>
        <div style={{ flex: 1, minHeight: 0 }} />
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
          {mihrab}
          {/* The roundels stand in the corners the arch leaves free: the first
              of the pair on the right as you face the qibla. */}
          <div style={{ position: 'absolute', left: 0, top: 0 }}>{side(1, 'min(19cqw, 10.5cqh)')}</div>
          <div style={{ position: 'absolute', right: 0, top: 0 }}>{side(0, 'min(19cqw, 10.5cqh)')}</div>
        </div>
        {band}
      </div>
    );
  }

  return (
    <div data-theme="ivory" style={root}>
      <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
        {/* The first of the pair on the right as you face the qibla, whichever
            way the screen's language runs: an RTL grid starts on the right. */}
        <div style={{ justifySelf: 'center' }}>{side(rtl ? 0 : 1, '30cqh')}</div>
        <div style={{ alignSelf: 'end' }}>{mihrab}</div>
        <div style={{ justifySelf: 'center' }}>{side(rtl ? 1 : 0, '30cqh')}</div>
      </div>
      {band}
    </div>
  );
}

export const ivoryDefinition: ThemeDefinition = {
  id: 'ivory',
  name: 'Ivory',
  description: 'Ivory and gold, framed like a mihrab',
  component: IvoryTheme,
  fields: [
    {
      key: 'color',
      label: 'Color',
      type: 'select',
      defaultValue: 'navy',
      description: 'The clock, the times and the roundels',
      options: [
        { value: 'navy', label: 'Navy' },
        { value: 'green', label: 'Green' },
        { value: 'burgundy', label: 'Burgundy' },
        { value: 'teal', label: 'Teal' },
        { value: 'black', label: 'Black' },
      ],
    },
    {
      key: 'roundels',
      label: 'Roundels',
      type: 'select',
      defaultValue: 'allah',
      description: 'The names that hang either side of the mihrab',
      options: [
        { value: 'allah', label: 'Allah and Muhammad ﷺ' },
        { value: 'caliphs', label: 'The four caliphs, two at a time' },
        { value: 'hasanayn', label: 'Hasan and Husayn' },
        { value: 'none', label: 'None' },
      ],
    },
  ],
  defaultConfig: {
    color: 'navy',
    roundels: 'allah',
  },
};
