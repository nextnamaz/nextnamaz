'use client';

import type { CSSProperties } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import type { PrayerState } from './config';
import type { PrayerTimeEntry } from '@/types/prayer';
import { formatLongDate, formatPrayerTime, isRtlLocale } from '@/lib/display-locale';
import type { DisplayLocale } from '@/lib/display-locale';
import { minutesOf } from '@/lib/display-schedule';
import { useDisplayClock } from '@/hooks/display/use-display-clock';
import { useHydrated } from '@/hooks/display/use-hydrated';
import { prayerStates } from './config';
import { EarthView } from '../earth-view';
import type { EarthFrame, EarthLine } from '../earth-view';

// The Earth from orbit, as it is this minute, beside a table of the times. The
// mosque is fixed; the sun, the night and the clouds move round it. Each
// prayer has a line on the Earth: everywhere it is that prayer's moment right
// now. The next one comes in from the east and crosses the gold dot exactly
// at its time; the last one carries on west. Close to a prayer the Earth
// glides in on the mosque to show the line arriving, then back out.

const SPACE = '#02040A';
const INK = '#F5F7FB';
const MUTED = '#8B95A7';
const PAST = 'rgb(245 247 251 / 0.34)';
const GOLD = '#E8A817';
const RULE = 'rgb(255 255 255 / 0.1)';

/**
 * The views, from the whole Earth to closest in on the mosque, which stays on
 * its pin. The nearer the next prayer, the closer the view: the first steps
 * keep space and the Earth's curved edge in sight, the last comes down over
 * the city to watch the line arrive.
 */
export const GLOBE_LEVELS: Record<'landscape' | 'portrait', EarthFrame[]> = {
  landscape: [
    { cx: 0.75, cy: 0.66, r: 0.62, pinX: 0.64, pinY: 0.44 },
    { cx: 0.78, cy: 1.2, r: 1.15, pinX: 0.7, pinY: 0.62 },
    { cx: 0.76, cy: 2.04, r: 2.0, pinX: 0.71, pinY: 0.62 },
    { cx: 0.71, cy: 1.0, r: 3.6, pinX: 0.71, pinY: 0.62 },
  ],
  portrait: [
    { cx: 0.22, cy: 0.89, r: 0.5, pinX: 0.33, pinY: 0.76 },
    { cx: 0.55, cy: 1.15, r: 0.95, pinX: 0.6, pinY: 0.86 },
    { cx: 0.55, cy: 1.54, r: 1.6, pinX: 0.6, pinY: 0.86 },
    { cx: 0.6, cy: 1.1, r: 3.0, pinX: 0.6, pinY: 0.86 },
  ],
};

/** Minutes before a prayer that each closer view begins, and how long the closest holds after it. */
const ZOOM_MINUTES = [30, 10, 3];
const HOLD_AFTER = 5;

/** Which view to show, 0 the whole Earth to 3 closest in, given the minutes to the next prayer and since the last. */
export function zoomLevel(minutesTo: number, minutesSince: number): number {
  if (minutesSince <= HOLD_AFTER) return ZOOM_MINUTES.length;
  return ZOOM_MINUTES.filter((minutes) => minutesTo <= minutes).length;
}

/** "15:56:42" → ["15:56", "42"]. A 12-hour clock keeps its AM/PM with the seconds. */
function splitClock(time: string): [string, string] {
  const match = /^(\d{1,2}:\d{2})(?::(\d{2}))?\s*(.*)$/.exec(time);
  if (!match) return [time, ''];
  return [match[1] ?? time, [match[2], match[3]].filter(Boolean).join(' ')];
}

/** Long names shrink rather than wrap: "Izlazak sunca", "Sonnenaufgang". */
function nameScale(name: string, fits: number): number {
  return Math.min(1, fits / Math.max(name.length, 1));
}

interface Moment {
  prayer: PrayerTimeEntry;
  at: number;
}

/**
 * The next prayer moment after now and the last one before it, sunrise
 * included: it is the line the morning is waiting for.
 */
export function moments(prayers: PrayerTimeEntry[], now: Date): { next: Moment | null; last: Moment | null } {
  const all: Moment[] = [];
  for (const prayer of prayers) {
    const minutes = minutesOf(prayer.time);
    if (minutes === null) continue;
    for (const shift of [-1, 0, 1]) {
      const at = new Date(now);
      at.setDate(at.getDate() + shift);
      at.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      all.push({ prayer, at: at.getTime() });
    }
  }
  const t = now.getTime();
  const after = all.filter((m) => m.at > t).sort((a, b) => a.at - b.at);
  const before = all.filter((m) => m.at <= t).sort((a, b) => b.at - a.at);
  return { next: after[0] ?? null, last: before[0] ?? null };
}

interface LineLabelProps {
  id: string;
  moment: Moment;
  locale: DisplayLocale;
  strong: boolean;
}

/**
 * A label riding on a prayer line a little north of the mosque: a dot on the
 * line and the words beside it, lifted off the map by a dark halo, the arrow
 * pointing the way the line moves.
 */
function LineLabel({ id, moment, locale, strong }: LineLabelProps) {
  return (
    <div data-pin={`line-${id}`} style={{ position: 'absolute', left: 0, top: 0, opacity: 0, willChange: 'transform', transition: 'opacity 0.6s' }}>
      <span
        style={{
          position: 'absolute',
          width: '0.9cqmin',
          height: '0.9cqmin',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: strong ? GOLD : 'rgb(255 255 255 / 0.75)',
        }}
      />
      <div
        data-label-box
        style={{
          position: 'absolute',
          left: '1.2cqmin',
          top: 0,
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.45em',
          whiteSpace: 'nowrap',
          fontSize: strong ? '1.9cqmin' : '1.5cqmin',
          fontWeight: 700,
          color: strong ? GOLD : 'rgb(255 255 255 / 0.72)',
          textShadow: '0 0 0.5cqmin rgb(2 4 10 / 0.95), 0 0 1.2cqmin rgb(2 4 10 / 0.85)',
        }}
      >
        <span aria-hidden style={{ display: 'inline-block', transform: 'rotate(calc(var(--west, 3.1416rad) - 3.1416rad))' }}>
          ←
        </span>
        <span>{moment.prayer.displayName}</span>
        <span style={{ color: strong ? INK : 'inherit', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {formatPrayerTime(moment.prayer.time, locale)}
        </span>
      </div>
    </div>
  );
}

/** The city's name by its beam of light; the Earth view places it clear of the prayer labels. */
function BeamLabel({ name }: { name: string }) {
  return (
    <div data-beam-label style={{ position: 'absolute', left: 0, top: 0, opacity: 0, willChange: 'transform', transition: 'opacity 0.6s' }}>
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          whiteSpace: 'nowrap',
          padding: '0.3cqmin 1cqmin',
          borderRadius: '999px',
          fontSize: '1.8cqmin',
          fontWeight: 600,
          color: INK,
          background: 'rgb(2 4 10 / 0.72)',
          border: '1px solid rgb(232 168 23 / 0.45)',
        }}
      >
        {name}
      </span>
    </div>
  );
}

function SunMark() {
  return (
    <div data-pin="sun" style={{ position: 'absolute', left: 0, top: 0, opacity: 0, willChange: 'transform' }}>
      <span
        style={{
          position: 'absolute',
          width: '7cqmin',
          height: '7cqmin',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #FFFDF0 0%, #FFE38A 26%, rgb(255 200 70 / 0.45) 50%, rgb(255 200 70 / 0) 72%)',
        }}
      />
    </div>
  );
}

interface TableProps {
  prayers: PrayerTimeEntry[];
  states: PrayerState[];
  locale: DisplayLocale;
  nameSize: string;
  timeSize: string;
  rowPad: string;
  /** The gold row has just begun rather than being next: it blinks. */
  starting: boolean;
  style?: CSSProperties;
}

/** The six times as a table: a header, one row each, the next filled gold, the past faded. */
function TimesTable({ prayers, states, locale, nameSize, timeSize, rowPad, starting, style }: TableProps) {
  const iqamah = prayers.some((p) => p.iqamahTime);
  const columns = iqamah ? 'minmax(0, 1fr) auto auto' : 'minmax(0, 1fr) auto';
  const cell: CSSProperties = { padding: `${rowPad} 2.6cqmin`, display: 'flex', alignItems: 'center' };
  const head: CSSProperties = { ...cell, paddingBlock: '1.2cqmin', fontSize: `calc(${nameSize} * 0.62)`, fontWeight: 600, color: MUTED };
  return (
    <div
      role="table"
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        // The rows share whatever height the table is given, so it can never run off the screen.
        gridTemplateRows: `auto repeat(${prayers.length}, minmax(0, 1fr))`,
        border: `1px solid ${RULE}`,
        borderRadius: '1.8cqmin',
        overflow: 'hidden',
        // Near solid, so the stars stay round the table and out from behind the times.
        background: 'rgb(8 11 19 / 0.86)',
        ...style,
      }}
    >
      <div role="row" style={{ display: 'contents' }}>
        <div role="columnheader" style={{ ...head, background: 'rgb(255 255 255 / 0.06)' }}>
          {locale.labels.prayer}
        </div>
        <div role="columnheader" style={{ ...head, justifyContent: 'flex-end', background: 'rgb(255 255 255 / 0.06)' }}>
          {locale.labels.begins}
        </div>
        {iqamah && (
          <div role="columnheader" style={{ ...head, justifyContent: 'flex-end', background: 'rgb(255 255 255 / 0.06)' }}>
            {locale.labels.iqamah}
          </div>
        )}
      </div>
      {prayers.map((prayer, i) => {
        const state = states[i];
        const isNext = state === 'next';
        const color = isNext ? GOLD : state === 'past' ? PAST : INK;
        // The row is display: contents, so its cells carry the animation.
        const pulse = isNext && starting ? 'prayer-starting' : undefined;
        const row: CSSProperties = {
          ...cell,
          borderTop: `1px solid ${RULE}`,
          background: isNext ? 'rgb(232 168 23 / 0.16)' : undefined,
          color,
        };
        return (
          <div key={prayer.name} role="row" style={{ display: 'contents' }}>
            <div
              role="cell"
              className={pulse}
              style={{
                ...row,
                boxShadow: isNext ? `inset 0.5cqmin 0 0 ${GOLD}` : undefined,
                minWidth: 0,
                overflow: 'hidden',
                fontSize: `calc(${nameSize} * ${nameScale(prayer.displayName, 13)})`,
                fontWeight: isNext ? 700 : 500,
                whiteSpace: 'nowrap',
              }}
            >
              {prayer.displayName}
            </div>
            <div role="cell" className={pulse} style={{ ...row, justifyContent: 'flex-end', fontSize: timeSize, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {formatPrayerTime(prayer.time, locale)}
            </div>
            {iqamah && (
              <div role="cell" className={pulse} style={{ ...row, justifyContent: 'flex-end', fontSize: timeSize, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {prayer.iqamahTime ? formatPrayerTime(prayer.iqamahTime, locale) : ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function GlobeTheme({ prayers, nextPrayer: upcoming, isPortrait, locale, place, startingPrayer }: ThemeProps) {
  // A prayer that has just begun stays the highlighted one for its first minute.
  const nextPrayer = startingPrayer ?? upcoming;
  const starting = !!startingPrayer;
  const { timeStr, date } = useDisplayClock(locale);
  // Nothing read off the clock is drawn until the TV's own clock is in charge.
  const live = useHydrated();
  const rtl = isRtlLocale(locale);

  const states: PrayerState[] = live
    ? prayerStates(prayers, nextPrayer?.name ?? null, date)
    : prayers.map(() => 'upcoming');
  const [clock, seconds] = splitClock(timeStr);

  // The lines on the Earth, and how close in to be: the nearer the prayer, the closer.
  const { next, last } = moments(prayers, date);
  const now = date.getTime();
  const minutesTo = next ? (next.at - now) / 60_000 : Infinity;
  const minutesSince = last ? (now - last.at) / 60_000 : Infinity;
  const level = zoomLevel(minutesTo, minutesSince);
  const lines: EarthLine[] = [];
  if (next) lines.push({ id: 'next', at: next.at, meridian: next.prayer.name === 'dhuhr', strong: true });
  if (last) lines.push({ id: 'last', at: last.at, meridian: last.prayer.name === 'dhuhr', strong: false });

  /** Pick a size for the current orientation. */
  const t = (portrait: string, landscape: string) => (isPortrait ? portrait : landscape);

  const clockBlock = (
    <div style={{ visibility: live ? undefined : 'hidden', textAlign: isPortrait ? 'center' : 'start' }}>
      <div
        dir="ltr"
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: isPortrait ? 'center' : rtl ? 'flex-end' : 'flex-start',
          lineHeight: 0.86,
        }}
      >
        <span style={{ fontSize: t('min(25cqw, 14cqh)', '18cqmin'), fontWeight: 500, letterSpacing: '-0.045em' }}>
          {live ? clock : '00:00'}
        </span>
        {live && seconds && (
          <span style={{ fontSize: t('min(6.4cqw, 3.6cqh)', '5cqmin'), fontWeight: 500, color: GOLD, marginInlineStart: '0.35em' }}>
            {seconds}
          </span>
        )}
      </div>
      <div style={{ fontSize: t('min(4.4cqw, 2.5cqh)', '3.5cqmin'), fontWeight: 500, color: MUTED, marginTop: '1.8cqmin' }}>
        {live ? formatLongDate(date, locale) : '\u00a0'}
      </div>
    </div>
  );

  const earth = live && (
    <EarthView
      // A new place loads its own tiles.
      key={place ? `${place.latitude},${place.longitude}` : 'nowhere'}
      place={place ?? null}
      levels={GLOBE_LEVELS[isPortrait ? 'portrait' : 'landscape']}
      level={level}
      lines={lines}
      clear={isPortrait ? { left: 0, top: 0.6 } : { left: 0.42, top: 0 }}
    >
      <SunMark />
      {last && !isPortrait && <LineLabel id="last" moment={last} locale={locale} strong={false} />}
      {next && <LineLabel id="next" moment={next} locale={locale} strong />}
      {place && <BeamLabel name={place.name} />}
    </EarthView>
  );

  const root: CSSProperties = {
    position: 'relative',
    isolation: 'isolate',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    background: SPACE,
    color: INK,
    direction: rtl ? 'rtl' : 'ltr',
  };

  if (isPortrait) {
    return (
      <div data-theme="globe" style={root}>
        {earth}
        {/* A light veil for the text; the Earth itself gives way to the stars under it. */}
        <div
          style={{
            position: 'absolute',
            inset: '0 0 auto 0',
            height: '62cqh',
            background: 'linear-gradient(180deg, rgb(2 4 10 / 0.45) 85%, rgb(2 4 10 / 0))',
          }}
        />
        <div style={{ position: 'absolute', top: '4cqh', left: '6cqw', right: '6cqw' }}>{clockBlock}</div>
        <TimesTable
          prayers={prayers}
          starting={starting}
          states={states}
          locale={locale}
          nameSize="min(4.8cqw, 2.7cqh)"
          timeSize="min(6cqw, 3.4cqh)"
          rowPad="0"
          style={{ position: 'absolute', top: '22cqh', height: '36cqh', left: '6cqw', right: '6cqw' }}
        />
      </div>
    );
  }

  return (
    <div data-theme="globe" style={root}>
      {earth}
      <div
        style={{
          position: 'absolute',
          inset: '0 auto 0 0',
          width: '46cqw',
          background: 'linear-gradient(90deg, rgb(2 4 10 / 0.45) 75%, rgb(2 4 10 / 0))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '6.5cqh',
          bottom: '6.5cqh',
          insetInlineStart: '5cqw',
          width: '33cqw',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {clockBlock}
        <TimesTable
          prayers={prayers}
          starting={starting}
          states={states}
          locale={locale}
          nameSize="4cqmin"
          timeSize="4.8cqmin"
          rowPad="0"
          style={{ flex: 1, minHeight: 0, marginTop: '4.5cqmin' }}
        />
      </div>
    </div>
  );
}

export const globeDefinition: ThemeDefinition = {
  id: 'globe',
  name: 'Globe',
  description: 'The Earth right now, with your mosque on it',
  component: GlobeTheme,
  fields: [],
  defaultConfig: {},
};
