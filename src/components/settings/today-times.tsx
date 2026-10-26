'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatTodayDate } from '@/lib/display-locale';
import { FIXABLE_PRAYERS, crossedNeighbour, isFixablePrayer, withFixedTimes } from '@/lib/fixed-times';
import type { FixablePrayer, FixedTimes } from '@/lib/fixed-times';
import { DEFAULT_IQAMAH_MINUTES, MAX_IQAMAH_MINUTES, iqamahOf, withIqamah } from '@/lib/iqamah';
import type { IqamahRule, IqamahRules } from '@/lib/iqamah';
import { cn } from '@/lib/utils';
import type { PrayerTimesMap } from '@/types/database';
import { PRAYER_NAMES } from '@/types/prayer';
import type { PrayerName } from '@/types/prayer';

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, m) => String(m).padStart(2, '0'));
const WAITS = Array.from({ length: MAX_IQAMAH_MINUTES }, (_, i) => i + 1);

/** `map` with one prayer's entry set, or cleared by null, kept in the day's order. */
function setFor<T>(
  map: Partial<Record<FixablePrayer, T>>,
  prayer: FixablePrayer,
  value: T | null
): Partial<Record<FixablePrayer, T>> {
  const next: Partial<Record<FixablePrayer, T>> = {};
  for (const p of FIXABLE_PRAYERS) {
    const entry = p === prayer ? value : map[p];
    if (entry !== null && entry !== undefined) next[p] = entry;
  }
  return next;
}

type IqamahMode = 'off' | 'after' | 'at';

/** The rule a mode starts with, for a prayer that begins at `begins` today. */
function ruleFor(mode: IqamahMode, begins: string): IqamahRule | null {
  if (mode === 'off') return null;
  if (mode === 'after') return { after: DEFAULT_IQAMAH_MINUTES };
  // A set time starts where the usual wait would put it today.
  return { at: iqamahOf(begins, { after: DEFAULT_IQAMAH_MINUTES }) ?? begins };
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** A choice of a few, all in view, the chosen one in gold. */
function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex shrink-0 rounded-full border border-input bg-background p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
            option.value === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface TimePickerProps {
  value: string;
  label: string;
  describedBy?: string;
  onChange: (time: string) => void;
}

/**
 * An hour and a minute picker. Not `<input type="time">`: browsers draw that
 * in their own language's clock, so an English one asks for "06:23 PM" on a
 * page where every other time reads 18:23. Phones still open their own wheel.
 */
function TimePicker({ value, label, describedBy, onChange }: TimePickerProps) {
  const [hour = '00', minute = '00'] = value.split(':');
  const select = 'cursor-pointer appearance-none bg-transparent px-1 outline-none';
  return (
    <div
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
      className="flex h-10 shrink-0 items-center rounded-md border border-input bg-background px-1.5 text-xl font-semibold tabular-nums has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
    >
      <select aria-label={`${label}, hour`} value={hour} onChange={(e) => onChange(`${e.target.value}:${minute}`)} className={select}>
        {HOURS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span aria-hidden>:</span>
      <select aria-label={`${label}, minutes`} value={minute} onChange={(e) => onChange(`${hour}:${e.target.value}`)} className={select}>
        {MINUTES.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}

interface TodayTimesProps {
  /** Today's times as the source gives them. */
  times: PrayerTimesMap;
  fixed: FixedTimes;
  iqamah: IqamahRules;
  labels: Record<PrayerName, string>;
  /** The screen's own word for iqamah, as the TV writes it. */
  iqamahLabel: string;
  locale: string;
  onFixedChange: (fixed: FixedTimes) => void;
  onIqamahChange: (iqamah: IqamahRules) => void;
}

/**
 * Today's times as the TV shows them. A prayer opens, in place, onto the two
 * things a mosque may set for it: a fixed time and an iqamah. Both are
 * optional, so the list stays a plain timetable until one is used.
 */
export function TodayTimes({
  times,
  fixed,
  iqamah,
  labels,
  iqamahLabel,
  locale,
  onFixedChange,
  onIqamahChange,
}: TodayTimesProps) {
  const [open, setOpen] = useState<FixablePrayer | null>(null);
  const shown = withFixedTimes(times, fixed);
  // Each prayer's iqamah today, checked against the day as the TV checks it.
  const day = withIqamah(
    PRAYER_NAMES.map((name) => ({ name, displayName: labels[name], time: shown[name] })),
    iqamah
  );

  /** The line beside a fixed time: what it replaces today, or why it sits today out. */
  const fixedNote = (prayer: FixablePrayer, own: string) => {
    if (shown[prayer] !== own) {
      const neighbour = crossedNeighbour({ ...shown, [prayer]: own }, prayer);
      const side = neighbour && PRAYER_NAMES.indexOf(neighbour) < PRAYER_NAMES.indexOf(prayer) ? 'before' : 'after';
      const reason = neighbour
        ? `It would come ${side} ${labels[neighbour]} (${shown[neighbour]}), so the TV shows ${shown[prayer]}.`
        : `The TV shows ${shown[prayer]}.`;
      return (
        <>
          <span className="font-semibold text-foreground">Not used today.</span> {reason}
        </>
      );
    }
    return own === times[prayer]
      ? `Choose your time. Today's automatic time is ${times[prayer]}.`
      : `Every day, instead of ${times[prayer]} today.`;
  };

  /** What a prayer opens onto: its time, then its iqamah. */
  const options = (prayer: FixablePrayer, index: number) => {
    const own = fixed[prayer];
    const rule = iqamah[prayer];
    const mode: IqamahMode = !rule ? 'off' : 'at' in rule ? 'at' : 'after';
    const today = day[index]?.iqamahTime;
    const unused = rule !== undefined && today === undefined;
    const nextSlot = PRAYER_NAMES[index + 1];
    const end = nextSlot ? `${shown[nextSlot]} (${labels[nextSlot]})` : 'midnight';
    const setRule = (next: IqamahRule | null) => onIqamahChange(setFor(iqamah, prayer, next));
    return (
      <div id={`options-${prayer}`} className="mb-3 space-y-5 rounded-lg bg-muted p-4">
        <section className="space-y-2.5">
          <h4 className="text-sm font-semibold">Time</h4>
          <Segmented
            label={`${labels[prayer]} time`}
            value={own === undefined ? 'auto' : 'fixed'}
            options={[
              { value: 'auto', label: 'Automatic' },
              { value: 'fixed', label: 'Fixed' },
            ]}
            onChange={(m) => onFixedChange(setFor(fixed, prayer, m === 'fixed' ? times[prayer] : null))}
          />
          {own === undefined ? (
            <p className="text-sm text-muted-foreground">
              {times[prayer]} today, from your source. It changes by itself every day.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <TimePicker
                value={own}
                label={`Fixed time for ${labels[prayer]}`}
                describedBy={`fixed-${prayer}-note`}
                onChange={(time) => onFixedChange(setFor(fixed, prayer, time))}
              />
              <p id={`fixed-${prayer}-note`} className="min-w-0 flex-1 basis-40 text-sm text-muted-foreground">
                {fixedNote(prayer, own)}
              </p>
            </div>
          )}
        </section>

        <section className="space-y-2.5">
          <h4 className="text-sm font-semibold">{iqamahLabel}</h4>
          <Segmented
            label={`${iqamahLabel} for ${labels[prayer]}`}
            value={mode}
            options={[
              { value: 'off', label: 'Off' },
              { value: 'after', label: 'After adhan' },
              { value: 'at', label: 'Set time' },
            ]}
            onChange={(m) => setRule(ruleFor(m, shown[prayer]))}
          />
          {rule && 'after' in rule && (
            <div className="flex items-center gap-3 text-sm">
              <select
                aria-label={`Minutes from the adhan to ${iqamahLabel}`}
                value={rule.after}
                onChange={(e) => setRule({ after: Number(e.target.value) })}
                className="h-10 cursor-pointer rounded-md border border-input bg-background px-3 text-xl font-semibold tabular-nums outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {WAITS.map((minutes) => (
                  <option key={minutes} value={minutes}>{minutes}</option>
                ))}
              </select>
              <span className="text-muted-foreground">
                min after adhan
                {today && (
                  <>
                    {' · '}
                    <span className="font-semibold text-foreground tabular-nums">{today}</span> today
                  </>
                )}
              </span>
            </div>
          )}
          {rule && 'at' in rule && (
            <TimePicker
              value={rule.at}
              label={`${iqamahLabel} time for ${labels[prayer]}`}
              describedBy={unused ? `iqamah-${prayer}-note` : undefined}
              onChange={(at) => setRule({ at })}
            />
          )}
          {unused && (
            <p id={`iqamah-${prayer}-note`} className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Not used today.</span> {iqamahLabel} has to fall
              between {shown[prayer]} and {end}.
            </p>
          )}
        </section>
      </div>
    );
  };

  return (
    <>
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-semibold">Today</h3>
        <span className="text-sm text-muted-foreground" suppressHydrationWarning>
          {formatTodayDate(locale)}
        </span>
      </div>
      <div className="divide-y divide-border">
        {PRAYER_NAMES.map((prayer, index) => {
          const time = <span className="text-xl font-semibold tabular-nums">{shown[prayer]}</span>;
          if (!isFixablePrayer(prayer)) {
            // Sunrise belongs to the sun: nothing to set, so nothing to open.
            return (
              <div key={prayer} className="flex items-center gap-3 py-2.5">
                <span className="flex-1 text-muted-foreground">{labels[prayer]}</span>
                {time}
                <span aria-hidden className="size-4 shrink-0" />
              </div>
            );
          }
          const own = fixed[prayer];
          const iqamahToday = day[index]?.iqamahTime;
          const expanded = open === prayer;
          return (
            <div key={prayer}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`options-${prayer}`}
                onClick={() => setOpen(expanded ? null : prayer)}
                className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2.5 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {labels[prayer]}
                    {own !== undefined && shown[prayer] === own && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-foreground">
                        Fixed
                      </span>
                    )}
                  </span>
                  {iqamahToday && (
                    <span className="block text-sm text-muted-foreground">
                      {iqamahLabel} <span className="font-semibold text-foreground tabular-nums">{iqamahToday}</span>
                    </span>
                  )}
                </span>
                {time}
                <ChevronDown
                  aria-hidden
                  className={cn('size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
                />
              </button>
              {expanded && options(prayer, index)}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Updates automatically every day. Tap a prayer to give it a fixed time or {iqamahLabel}.
      </p>
    </>
  );
}
