'use client';

import type { CSSProperties } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import type { PrayerState } from './config';
import type { PrayerName, PrayerTimeEntry } from '@/types/prayer';
import { formatLongDate, formatPrayerTime, isRtlLocale } from '@/lib/display-locale';
import { MINUTES_PER_DAY, minutesOf } from '@/lib/display-schedule';
import { DEFAULT_TRANSLATIONS } from '@/lib/locale/presets';
import { useDisplayClock } from '@/hooks/display/use-display-clock';
import { useHydrated } from '@/hooks/display/use-hydrated';
import { countdownTo, prayerStates, readBoolean, readText } from './config';
import { Moon, Verse, countdownPhrase, formatCountdown, startingPhrase, shrinkToFit, splitClock } from '../parts';

// The screen takes the colour of the sky outside: navy through the night,
// blue hour at Fajr, rose at sunrise, blue through the day, red at Maghrib.
// It is worked out from the screen's own prayer times, so it follows the
// seasons and the latitude without being told either.

type Rgb = readonly [number, number, number];

export interface Sky {
  top: Rgb;
  middle: Rgb;
  bottom: Rgb;
  /** How far out the stars and the moon are, 0 to 1. */
  stars: number;
  /** How much cloud is drifting by, 0 to 1. */
  clouds: number;
}

// Deeper than a real sky, so white text holds on every one of them.
export const NIGHT: Sky = { top: [4, 7, 16], middle: [10, 18, 48], bottom: [23, 37, 82], stars: 1, clouds: 0 };
const PREDAWN: Sky = { top: [6, 10, 30], middle: [17, 27, 71], bottom: [43, 53, 119], stars: 0.85, clouds: 0 };
const DAWN: Sky = { top: [15, 26, 69], middle: [47, 58, 126], bottom: [138, 92, 142], stars: 0.35, clouds: 0.15 };
const SUNRISE: Sky = { top: [26, 52, 112], middle: [104, 86, 150], bottom: [192, 80, 106], stars: 0, clouds: 0.55 };
const MORNING: Sky = { top: [18, 64, 127], middle: [36, 98, 168], bottom: [76, 136, 198], stars: 0, clouds: 1 };
export const DAY: Sky = { top: [11, 58, 120], middle: [26, 91, 165], bottom: [59, 128, 200], stars: 0, clouds: 1 };
const AFTERNOON: Sky = { top: [14, 53, 112], middle: [30, 81, 152], bottom: [74, 116, 176], stars: 0, clouds: 1 };
const EVENING: Sky = { top: [24, 48, 110], middle: [66, 78, 150], bottom: [154, 106, 154], stars: 0, clouds: 0.8 };
export const SUNSET: Sky = { top: [38, 30, 92], middle: [122, 50, 104], bottom: [194, 68, 60], stars: 0, clouds: 0.5 };
const DUSK: Sky = { top: [14, 18, 56], middle: [42, 37, 99], bottom: [107, 58, 120], stars: 0.55, clouds: 0.1 };

/** Used for any prayer whose time is missing or unreadable. */
const FALLBACK_MINUTES: Record<PrayerName, number> = {
  fajr: 300,
  sunrise: 390,
  dhuhr: 750,
  asr: 930,
  maghrib: 1110,
  isha: 1200,
};

interface Anchor {
  at: number;
  sky: Sky;
}

function anchors(prayers: PrayerTimeEntry[]): Anchor[] {
  const at = (name: PrayerName) => {
    const entry = prayers.find((p) => p.name === name);
    return (entry ? minutesOf(entry.time) : null) ?? FALLBACK_MINUTES[name];
  };
  const fajr = at('fajr');
  const sunrise = at('sunrise');
  const dhuhr = at('dhuhr');
  const asr = at('asr');
  const maghrib = at('maghrib');
  // A northern summer puts Isha after midnight.
  const ishaClock = at('isha');
  const isha = ishaClock < maghrib ? ishaClock + MINUTES_PER_DAY : ishaClock;

  const points: Anchor[] = [
    { at: fajr - 45, sky: NIGHT },
    { at: fajr, sky: PREDAWN },
    { at: Math.max(sunrise - 25, (fajr + sunrise) / 2), sky: DAWN },
    { at: sunrise + 10, sky: SUNRISE },
    { at: Math.min(sunrise + 80, (sunrise + dhuhr) / 2), sky: MORNING },
    { at: dhuhr, sky: DAY },
    { at: asr, sky: AFTERNOON },
    { at: Math.max(maghrib - 45, (asr + maghrib) / 2), sky: EVENING },
    { at: maghrib, sky: SUNSET },
    { at: Math.min(maghrib + 30, (maghrib + isha) / 2), sky: DUSK },
    { at: isha + 30, sky: NIGHT },
  ];
  // Times that arrive out of order (a bad source, a hand-typed day) must not
  // run the sky backwards: each anchor comes at least a minute after the last.
  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const point = points[i];
    if (previous && point) point.at = Math.max(point.at, previous.at + 1);
  }
  return points;
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/** The sky at a minute of the day, blended between the anchors either side. */
export function skyAt(prayers: PrayerTimeEntry[], minute: number): Sky {
  const points = anchors(prayers);
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return NIGHT;
  // Past midnight, but before a late Isha's night has fallen.
  const m = minute < first.at && minute + MINUTES_PER_DAY <= last.at ? minute + MINUTES_PER_DAY : minute;
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    if (!from || !to || m > to.at) continue;
    if (m < from.at) return NIGHT;
    const t = (m - from.at) / (to.at - from.at);
    return {
      top: mix(from.sky.top, to.sky.top, t),
      middle: mix(from.sky.middle, to.sky.middle, t),
      bottom: mix(from.sky.bottom, to.sky.bottom, t),
      stars: from.sky.stars + (to.sky.stars - from.sky.stars) * t,
      clouds: from.sky.clouds + (to.sky.clouds - from.sky.clouds) * t,
    };
  }
  return NIGHT;
}

function rgb(color: Rgb): string {
  return `rgb(${color[0]} ${color[1]} ${color[2]})`;
}

// --- Stars, moon and clouds ---

interface Star {
  x: number;
  y: number;
  size: number;
  glow: number;
  /** Seconds per twinkle, for the few that twinkle. */
  twinkle: number | null;
  delay: number;
}

/** A fixed scatter, the same on every screen: denser toward the top, as a real sky is. */
const STARS: Star[] = (() => {
  let seed = 20261002;
  // mulberry32: small, and even enough that the stars never fall into rows.
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: 64 }, (_, i) => ({
    x: random() * 100,
    y: random() ** 1.6 * 66,
    size: 0.14 + random() ** 3 * 0.3,
    glow: 0.35 + random() * 0.65,
    twinkle: i % 5 === 0 ? 2.6 + random() * 3.4 : null,
    delay: random(),
  }));
})();

/** Where a background of `size` percent goes so that its centre lands at `center` percent. */
const centred = (center: number, size: number) => (size >= 100 ? 50 : ((center - size / 2) / (100 - size)) * 100);

/**
 * One puff of a cloud: a solid core with a soft edge, so overlapping puffs
 * build a brighter middle. Gradients, not a blur filter, so drifting the
 * cloud never makes the TV repaint it.
 */
const puff = (cx: number, cy: number, w: number, h: number) =>
  `radial-gradient(closest-side, #fff 0%, #fff 45%, rgb(255 255 255 / 0) 100%) ${centred(cx, w)}% ${centred(cy, h)}% / ${w}% ${h}% no-repeat`;

/** A fair-weather cumulus: puffs heaped on a flat base. */
const CLOUD = [
  puff(50, 78, 96, 40),
  puff(30, 60, 36, 62),
  puff(50, 42, 40, 84),
  puff(68, 56, 32, 60),
  puff(82, 70, 22, 40),
].join(', ');

const CLOUDS = [
  { top: 4, width: 44, height: 16, seconds: 260, start: 0.12, alpha: 0.2 },
  { top: 13, width: 30, height: 11, seconds: 340, start: 0.58, alpha: 0.15 },
  { top: 1, width: 24, height: 9, seconds: 300, start: 0.86, alpha: 0.13 },
];

// Transform and opacity only, so the TV's compositor moves them without
// repainting the screen. Held still for anyone who has asked for less motion.
const DETAIL_MOTION = `
@keyframes sky-twinkle { 50% { opacity: 0.12; } }
@keyframes sky-drift { from { transform: translateX(-60cqw); } to { transform: translateX(105cqw); } }
.sky-twinkle { animation: sky-twinkle ease-in-out infinite; }
.sky-drift { animation: sky-drift linear infinite; will-change: transform; }
@media (prefers-reduced-motion: reduce) { .sky-twinkle, .sky-drift { animation: none; } }
`;

interface SkyDetailsProps {
  sky: Sky;
  date: Date;
  isPortrait: boolean;
}

function SkyDetails({ sky, date, isPortrait }: SkyDetailsProps) {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{DETAIL_MOTION}</style>
      {sky.stars > 0.01 && (
        <div style={{ position: 'absolute', inset: 0, opacity: sky.stars }}>
          {STARS.map((star, i) => (
            <span
              key={i}
              className={star.twinkle ? 'sky-twinkle' : undefined}
              style={{
                position: 'absolute',
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}cqmin`,
                height: `${star.size}cqmin`,
                borderRadius: '50%',
                background: '#fff',
                opacity: star.glow,
                animationDuration: star.twinkle ? `${star.twinkle}s` : undefined,
                animationDelay: star.twinkle ? `${-star.delay * star.twinkle}s` : undefined,
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              top: isPortrait ? '2.5cqh' : '9cqh',
              right: isPortrait ? '5cqw' : '9cqw',
              borderRadius: '50%',
              boxShadow: '0 0 5cqmin 1cqmin rgb(246 241 222 / 0.16)',
            }}
          >
            <Moon date={date} size={isPortrait ? '6cqmin' : '6.5cqmin'} color="#F6F1DE" />
          </div>
        </div>
      )}
      {sky.clouds > 0.01 &&
        CLOUDS.map((cloud, i) => (
          <div
            key={i}
            className="sky-drift"
            style={{
              position: 'absolute',
              left: 0,
              top: `${cloud.top}%`,
              width: `${cloud.width}cqmin`,
              height: `${cloud.height}cqmin`,
              background: CLOUD,
              opacity: cloud.alpha * sky.clouds,
              animationDuration: `${cloud.seconds}s`,
              animationDelay: `${-cloud.start * cloud.seconds}s`,
            }}
          />
        ))}
    </div>
  );
}

// --- Theme ---

const ARABIC_NAMES = DEFAULT_TRANSLATIONS.ar.prayers;

export function SkyTheme({ prayers, nextPrayer: upcoming, config, isPortrait, locale, startingPrayer }: ThemeProps) {
  // A prayer that has just begun stays the highlighted one for its first minute.
  const nextPrayer = startingPrayer ?? upcoming;
  const starting = !!startingPrayer;
  const { timeStr, date } = useDisplayClock(locale);
  // Nothing read off the clock is drawn until the TV's own clock is in charge.
  const live = useHydrated();
  const rtl = isRtlLocale(locale);
  // An Arabic or Urdu screen already names the prayers in Arabic script.
  const showArabic = readBoolean(config.arabicNames, true) && !rtl;
  const showDetails = readBoolean(config.details, true);
  const line = readText(config.verse, '');

  const states: PrayerState[] = live
    ? prayerStates(prayers, nextPrayer?.name ?? null, date)
    : prayers.map(() => 'upcoming');
  const countdown = live && nextPrayer ? countdownTo(nextPrayer.time, date) : null;
  const sky = live ? skyAt(prayers, date.getHours() * 60 + date.getMinutes()) : NIGHT;
  const [clock, seconds] = splitClock(timeStr);

  /** Pick a size for the current orientation. */
  const t = (portrait: string, landscape: string) => (isPortrait ? portrait : landscape);

  /** The next prayer is lifted out of the sky on a white card; past ones fade back into it. */
  const cell = (state: PrayerState | undefined): CSSProperties => ({
    borderRadius: '2.4cqmin',
    background: state === 'next' ? '#fff' : 'transparent',
    color: state === 'next' ? rgb(sky.top) : '#fff',
    opacity: state === 'past' ? 0.5 : 1,
    boxShadow: state === 'next' ? '0 1.2cqmin 4cqmin rgb(0 0 0 / 0.22)' : undefined,
    textShadow: state === 'next' ? 'none' : undefined,
  });

  const arabicName = (prayer: PrayerTimeEntry, size: string, lineHeight: number) =>
    showArabic && (
      <span
        lang="ar"
        dir="rtl"
        style={{ fontFamily: 'var(--font-naskh)', fontSize: size, lineHeight, opacity: 0.72 }}
      >
        {ARABIC_NAMES[prayer.name]}
      </span>
    );

  const root: CSSProperties = {
    position: 'relative',
    // The details sit behind the text but above the sky.
    isolation: 'isolate',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    color: '#fff',
    // Lifts the white text off a cloud drifting behind it.
    textShadow: '0 0.2cqmin 1.6cqmin rgb(0 0 0 / 0.16)',
    background: `linear-gradient(180deg, ${rgb(sky.top)} 0%, ${rgb(sky.middle)} 58%, ${rgb(sky.bottom)} 100%)`,
    fontVariantNumeric: 'tabular-nums',
    direction: rtl ? 'rtl' : 'ltr',
    padding: t('7cqmin 5cqmin 5cqmin', '5cqmin 5cqmin 4.5cqmin'),
  };

  // Every line keeps its height before it has anything to say, so nothing
  // shifts when the clock and the countdown arrive.
  const header = (
    <header
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        visibility: live ? undefined : 'hidden',
      }}
    >
      <div dir="ltr" style={{ display: 'flex', alignItems: 'baseline', lineHeight: 0.9 }}>
        <span style={{ fontSize: t('min(27cqw, 15cqh)', '25cqmin'), fontWeight: 600, letterSpacing: '-0.035em' }}>
          {live ? clock : '00:00'}
        </span>
        {live && seconds && (
          <span
            style={{
              fontSize: t('min(8cqw, 4.5cqh)', '7cqmin'),
              fontWeight: 500,
              opacity: 0.6,
              marginInlineStart: '0.35em',
            }}
          >
            {seconds}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: t('min(4.6cqw, 2.6cqh)', '3.8cqmin'),
          fontWeight: 500,
          opacity: 0.82,
          marginTop: t('2cqmin', '1.6cqmin'),
        }}
      >
        {live ? formatLongDate(date, locale) : '\u00a0'}
      </div>
      <div style={{ marginTop: t('4cqmin', '3cqmin'), fontSize: t('min(5.4cqw, 3cqh)', '4.6cqmin'), fontWeight: 500 }}>
        {starting && nextPrayer ? (
          <b className="prayer-starting">{startingPhrase(nextPrayer, locale)}</b>
        ) : countdown && nextPrayer ? (
          <>
            <span style={{ opacity: 0.82 }}>{countdownPhrase(nextPrayer, locale)} </span>
            <span style={{ fontWeight: 650 }}>{formatCountdown(countdown, { showSeconds: true })}</span>
          </>
        ) : (
          '\u00a0'
        )}
      </div>
    </header>
  );

  const details = live && showDetails ? <SkyDetails sky={sky} date={date} isPortrait={isPortrait} /> : null;

  const footer = line ? (
    <div style={{ paddingTop: t('3cqmin', '2.4cqmin'), textAlign: 'center' }}>
      <Verse text={line} size={t('min(4.4cqw, 2.5cqh)', '3.2cqmin')} color="rgb(255 255 255 / 0.78)" />
    </div>
  ) : null;

  if (isPortrait) {
    return (
      <div data-theme="sky" style={root}>
        {details}
        {header}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '1.2cqmin',
            marginTop: '5cqmin',
          }}
        >
          {prayers.map((prayer, i) => (
            <div
              key={prayer.name}
              style={{
                ...cell(states[i]),
                flex: 1,
                minHeight: 0,
                maxHeight: '14cqh',
                display: 'grid',
                gridTemplateColumns: showArabic ? 'minmax(0, 1fr) auto auto' : 'minmax(0, 1fr) auto',
                alignItems: 'center',
                columnGap: '4.5cqmin',
                padding: '0 4cqmin',
              }}
            >
              <span
                style={{
                  fontSize: `calc(min(6.4cqw, 3.6cqh) * ${shrinkToFit(prayer.displayName, 8.5)})`,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {prayer.displayName}
              </span>
              {arabicName(prayer, 'min(5.6cqw, 3.2cqh)', 1)}
              <span style={{ fontSize: 'min(9cqw, 5cqh)', fontWeight: 650, letterSpacing: '-0.02em' }}>
                {formatPrayerTime(prayer.time, locale)}
              </span>
            </div>
          ))}
        </div>
        {footer}
      </div>
    );
  }

  const nameSize = 'min(4.4cqmin, 2.5cqw)';

  return (
    <div data-theme="sky" style={root}>
      {details}
      {/* The clock floats in the open sky above the row of prayers. */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {header}
      </div>
      <div style={{ display: 'flex', gap: '1.2cqmin' }}>
        {prayers.map((prayer, i) => (
          <div
            key={prayer.name}
            style={{
              ...cell(states[i]),
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2.6cqmin 1cqmin 2.8cqmin',
            }}
          >
            {/* A fixed line box, so a shrunk long name keeps its time in line with the rest. */}
            <span
              style={{
                height: `calc(${nameSize} * 1.25)`,
                display: 'flex',
                alignItems: 'center',
                maxWidth: '100%',
                fontSize: `calc(${nameSize} * ${shrinkToFit(prayer.displayName, 8.5)})`,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{prayer.displayName}</span>
            </span>
            {arabicName(prayer, nameSize, 1.5)}
            <span
              style={{
                fontSize: 'min(8.5cqmin, 4.7cqw)',
                lineHeight: 1.05,
                fontWeight: 650,
                letterSpacing: '-0.02em',
                marginTop: '0.8cqmin',
              }}
            >
              {formatPrayerTime(prayer.time, locale)}
            </span>
          </div>
        ))}
      </div>
      {footer}
    </div>
  );
}

export const skyDefinition: ThemeDefinition = {
  id: 'sky',
  name: 'Sky',
  description: 'Changes with the sky outside',
  component: SkyTheme,
  fields: [
    {
      key: 'arabicNames',
      label: 'Arabic names',
      type: 'switch',
      defaultValue: true,
      description: 'Each prayer’s Arabic name beside its own',
    },
    {
      key: 'details',
      label: 'Stars and clouds',
      type: 'switch',
      defaultValue: true,
      description: 'Stars and tonight’s moon at night, slow clouds by day',
    },
    {
      // 'verse', as Night called it, so screens moved over from Night keep their line.
      key: 'verse',
      label: 'Bottom line',
      type: 'text',
      defaultValue: '',
      description: 'A verse or a short notice. Empty to hide.',
    },
  ],
  defaultConfig: {
    arabicNames: true,
    details: true,
    verse: '',
  },
};
