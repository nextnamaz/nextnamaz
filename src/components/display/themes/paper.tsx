'use client';

import type { CSSProperties } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import type { PrayerState } from './config';
import type { PrayerTimeEntry } from '@/types/prayer';
import { formatDateParts, formatPrayerTime, isRtlLocale } from '@/lib/display-locale';
import { MINUTES_PER_DAY, minutesOf } from '@/lib/display-schedule';
import { DEFAULT_TRANSLATIONS } from '@/lib/locale/presets';
import { useDisplayClock } from '@/hooks/display/use-display-clock';
import { useHydrated } from '@/hooks/display/use-hydrated';
import { countdownTo, prayerStates, readBoolean, readText } from './config';
import { Moon, Verse, countdownPhrase, formatCountdown, startingPhrase, shrinkToFit, splitClock } from '../parts';

// White space, black type, and one small gold thing that moves: a dot
// travelling along a line across the foot of the screen, the day from
// midnight to midnight, toward the tick of the next prayer.

const PAPER = '#F6F5F1';
const INK = '#18181B';
const MUTED = 'rgb(24 24 27 / 0.52)';
const PAST = 'rgb(24 24 27 / 0.3)';
const RULE = 'rgb(24 24 27 / 0.13)';
const GOLD = '#E8A817';

/** A hairline that still shows on a 4K panel seen from the back of the hall. */
const HAIRLINE = 'max(1px, 0.14cqmin)';

const ARABIC_NAMES = DEFAULT_TRANSLATIONS.ar.prayers;

// The dot breathes: a ring of gold that grows and fades. Transform and
// opacity only, so the TV's compositor runs it without repainting.
const PULSE = `
@keyframes paper-pulse { from { transform: scale(1); opacity: 0.5; } to { transform: scale(3.4); opacity: 0; } }
.paper-pulse { animation: paper-pulse 2.8s cubic-bezier(0.2, 0, 0.2, 1) infinite; }
@media (prefers-reduced-motion: reduce) { .paper-pulse { animation: none; opacity: 0; } }
`;

/** A day's runs of the line, in minutes. Past Isha the run to Fajr wraps round to the start. */
export function runToNext(minute: number, next: number): [number, number][] {
  return next >= minute ? [[minute, next]] : [[minute, MINUTES_PER_DAY], [0, next]];
}

interface DayLineProps {
  prayers: PrayerTimeEntry[];
  nextPrayer: PrayerTimeEntry | null;
  /** Null until the TV's own clock is in charge. */
  minute: number | null;
  rtl: boolean;
  labelSize: string;
}

/** The day as a line, midnight to midnight: a tick at each prayer, the daylight drawn darker, now as a gold dot. */
function DayLine({ prayers, nextPrayer, minute, rtl, labelSize }: DayLineProps) {
  const at = (m: number) => `${(m / MINUTES_PER_DAY) * 100}%`;
  const centre = rtl ? 'translateX(50%)' : 'translateX(-50%)';
  const timeOf = (name: string) => {
    const entry = prayers.find((p) => p.name === name);
    return entry ? minutesOf(entry.time) : null;
  };
  const sunrise = timeOf('sunrise');
  const maghrib = timeOf('maghrib');
  const next = nextPrayer ? minutesOf(nextPrayer.time) : null;
  const line = '2.4cqmin';
  const along = (from: number, to: number, height: string, background: string): CSSProperties => ({
    position: 'absolute',
    insetInlineStart: at(from),
    width: at(to - from),
    top: `calc(${line} - ${height} / 2)`,
    height,
    background,
    borderRadius: height,
  });

  return (
    <div aria-hidden style={{ position: 'relative', height: `calc(${line} + 1.4cqmin + ${labelSize} * 1.2)` }}>
      <div style={along(0, MINUTES_PER_DAY, HAIRLINE, RULE)} />
      {sunrise !== null && maghrib !== null && maghrib > sunrise && (
        <div style={along(sunrise, maghrib, HAIRLINE, 'rgb(24 24 27 / 0.4)')} />
      )}
      {prayers.map((prayer) => {
        const m = minutesOf(prayer.time);
        if (m === null) return null;
        const isNext = prayer.name === nextPrayer?.name;
        const height = prayer.name === 'sunrise' ? '1cqmin' : '1.8cqmin';
        return (
          <div
            key={prayer.name}
            style={{
              position: 'absolute',
              insetInlineStart: at(m),
              top: `calc(${line} - ${height})`,
              width: `calc(${HAIRLINE} * 1.4)`,
              height,
              background: isNext ? GOLD : 'rgb(24 24 27 / 0.45)',
              transform: centre,
            }}
          />
        );
      })}
      {minute !== null &&
        next !== null &&
        runToNext(minute, next).map(([from, to]) => <div key={from} style={along(from, to, '0.32cqmin', GOLD)} />)}
      {minute !== null && (
        <div
          style={{
            position: 'absolute',
            insetInlineStart: at(minute),
            top: `calc(${line} - 0.7cqmin)`,
            width: '1.4cqmin',
            height: '1.4cqmin',
            transform: centre,
          }}
        >
          <span
            className="paper-pulse"
            style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: GOLD }}
          />
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: GOLD }} />
        </div>
      )}
      {[6, 12, 18].map((hour) => (
        <span
          key={hour}
          style={{
            position: 'absolute',
            insetInlineStart: at(hour * 60),
            top: `calc(${line} + 1.4cqmin)`,
            transform: centre,
            fontSize: labelSize,
            lineHeight: 1.2,
            color: PAST,
          }}
        >
          {String(hour).padStart(2, '0')}
        </span>
      ))}
    </div>
  );
}

export function PaperTheme({ prayers, nextPrayer: upcoming, config, isPortrait, locale, startingPrayer }: ThemeProps) {
  // A prayer that has just begun stays the highlighted one for its first minute.
  const nextPrayer = startingPrayer ?? upcoming;
  const starting = !!startingPrayer;
  const { timeStr, date } = useDisplayClock(locale);
  // Nothing read off the clock is drawn until the TV's own clock is in charge.
  const live = useHydrated();
  const rtl = isRtlLocale(locale);
  // An Arabic or Urdu screen already names the prayers in Arabic script.
  const showArabic = readBoolean(config.arabicNames, true) && !rtl;
  const line = readText(config.verse, '');

  const states: PrayerState[] = live
    ? prayerStates(prayers, nextPrayer?.name ?? null, date)
    : prayers.map(() => 'upcoming');
  const countdown = live && nextPrayer ? countdownTo(nextPrayer.time, date) : null;
  const [clock] = splitClock(timeStr);
  const day = formatDateParts(date, locale);

  /** Pick a size for the current orientation. */
  const t = (portrait: string, landscape: string) => (isPortrait ? portrait : landscape);
  const smallText = t('min(4.6cqw, 2.6cqh)', '3.6cqmin');
  // Landscape sizes also answer to the width: a 4:3 set leaves the list a narrower column.
  const nameSize = t('min(5.6cqw, 3.1cqh)', 'min(4.2cqmin, 2.4cqw)');

  const root: CSSProperties = {
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: PAPER,
    color: INK,
    fontVariantNumeric: 'tabular-nums',
    direction: rtl ? 'rtl' : 'ltr',
    padding: t('9cqw 8cqw 6cqw', '7cqmin 8cqmin 5cqmin'),
  };

  // Every line keeps its height before it has anything to say, so nothing
  // shifts when the clock and the countdown arrive.
  const dateBlock = (
    <div style={{ fontSize: smallText, lineHeight: 1.35, visibility: live ? undefined : 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45em', fontWeight: 500 }}>
        {live ? day.weekday : '\u00a0'}
        {/* Tonight's moon, in gold: the months of the prayer calendar are the moon's. */}
        {live && <Moon date={date} size="0.7em" color={GOLD} shadow={0.25} />}
      </div>
      <div style={{ color: MUTED }}>{live ? day.date : '\u00a0'}</div>
    </div>
  );

  const clockBlock = (
    <div style={{ visibility: live ? undefined : 'hidden' }}>
      <div
        dir="ltr"
        style={{
          fontSize: t('min(31cqw, 17cqh)', 'min(28cqmin, 15.5cqw)'),
          fontWeight: 300,
          letterSpacing: '-0.045em',
          lineHeight: 0.8,
          textAlign: rtl ? 'right' : 'left',
        }}
      >
        {live ? clock : '00:00'}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.55em',
          marginTop: t('min(5cqw, 2.8cqh)', '3.4cqmin'),
          fontSize: smallText,
        }}
      >
        <span aria-hidden style={{ width: '0.4em', height: '0.4em', borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
        {starting && nextPrayer ? (
          <span className="prayer-starting" style={{ fontWeight: 600 }}>{startingPhrase(nextPrayer, locale)}</span>
        ) : countdown && nextPrayer ? (
          <span>
            {countdownPhrase(nextPrayer, locale)}{' '}
            <span style={{ fontWeight: 600 }}>{formatCountdown(countdown, { showSeconds: true })}</span>
          </span>
        ) : (
          '\u00a0'
        )}
      </div>
    </div>
  );

  const list = (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', borderBottom: `${HAIRLINE} solid ${RULE}` }}>
      {prayers.map((prayer, i) => {
        const state = states[i];
        const isNext = state === 'next';
        const weight = isNext ? 600 : 400;
        return (
          <div
            key={prayer.name}
            style={{
              position: 'relative',
              flex: 1,
              minHeight: 0,
              maxHeight: t('13cqh', '20cqh'),
              display: 'grid',
              gridTemplateColumns: showArabic ? 'minmax(0, 1fr) auto auto' : 'minmax(0, 1fr) auto',
              alignContent: 'center',
              alignItems: 'baseline',
              columnGap: t('5cqw', '3.6cqmin'),
              borderTop: `${HAIRLINE} solid ${RULE}`,
              color: state === 'past' ? PAST : INK,
            }}
          >
            {/* The next prayer: a gold dot in the margin, and its name and time in bold. */}
            {isNext && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  insetInlineStart: t('-4.2cqw', '-3.4cqmin'),
                  top: '50%',
                  width: '1.2cqmin',
                  height: '1.2cqmin',
                  marginTop: '-0.6cqmin',
                  borderRadius: '50%',
                  background: GOLD,
                }}
              />
            )}
            <span
              style={{
                fontSize: `calc(${nameSize} * ${shrinkToFit(prayer.displayName, 11)})`,
                fontWeight: weight,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {prayer.displayName}
            </span>
            {showArabic && (
              <span
                lang="ar"
                dir="rtl"
                style={{
                  fontFamily: 'var(--font-naskh)',
                  fontSize: t('min(4.8cqw, 2.7cqh)', 'min(3.6cqmin, 2.05cqw)'),
                  lineHeight: 1,
                  color: state === 'past' ? PAST : MUTED,
                }}
              >
                {ARABIC_NAMES[prayer.name]}
              </span>
            )}
            <span style={{ fontSize: t('min(7.4cqw, 4.1cqh)', 'min(5.6cqmin, 3.2cqw)'), fontWeight: weight, letterSpacing: '-0.01em' }}>
              {formatPrayerTime(prayer.time, locale)}
            </span>
          </div>
        );
      })}
    </div>
  );

  const dayLine = (
    <DayLine
      prayers={prayers}
      nextPrayer={live ? nextPrayer : null}
      minute={live ? date.getHours() * 60 + date.getMinutes() : null}
      rtl={rtl}
      labelSize={t('min(2.8cqw, 1.6cqh)', '1.9cqmin')}
    />
  );

  const footer = line ? (
    <div style={{ paddingTop: t('3cqw', '1.6cqmin'), textAlign: 'center' }}>
      <Verse text={line} size={t('min(4.2cqw, 2.4cqh)', '3cqmin')} color={MUTED} />
    </div>
  ) : null;

  if (isPortrait) {
    return (
      <div data-theme="paper" style={root}>
        <style>{PULSE}</style>
        {dateBlock}
        <div style={{ marginTop: 'min(10cqw, 5.5cqh)' }}>{clockBlock}</div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', margin: 'min(9cqw, 5cqh) 0 min(7cqw, 4cqh)' }}>
          {list}
        </div>
        {dayLine}
        {footer}
      </div>
    );
  }

  return (
    <div data-theme="paper" style={root}>
      <style>{PULSE}</style>
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1.1fr 1fr', columnGap: '10cqmin' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          {dateBlock}
          {clockBlock}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>{list}</div>
      </div>
      <div style={{ marginTop: '5cqmin' }}>{dayLine}</div>
      {footer}
    </div>
  );
}

export const paperDefinition: ThemeDefinition = {
  id: 'paper',
  name: 'Paper',
  description: 'White space, one gold detail',
  component: PaperTheme,
  fields: [
    {
      key: 'arabicNames',
      label: 'Arabic names',
      type: 'switch',
      defaultValue: true,
      description: 'Each prayer’s Arabic name beside its own',
    },
    {
      key: 'verse',
      label: 'Bottom line',
      type: 'text',
      defaultValue: '',
      description: 'A verse or a short notice. Empty to hide.',
    },
  ],
  defaultConfig: {
    arabicNames: true,
    verse: '',
  },
};
