'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { formatTodayDate } from '@/lib/display-locale';
import { FIXABLE_PRAYERS, crossedNeighbour, isFixablePrayer, withFixedTimes } from '@/lib/fixed-times';
import type { FixablePrayer, FixedTimes } from '@/lib/fixed-times';
import type { PrayerTimesMap } from '@/types/database';
import { PRAYER_NAMES } from '@/types/prayer';
import type { PrayerName } from '@/types/prayer';

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, m) => String(m).padStart(2, '0'));

/** `fixed` with one prayer set to `time`, or cleared by null, kept in the day's order. */
function setFixed(fixed: FixedTimes, prayer: FixablePrayer, time: string | null): FixedTimes {
  const next: FixedTimes = {};
  for (const p of FIXABLE_PRAYERS) {
    const value = p === prayer ? time : fixed[p];
    if (value) next[p] = value;
  }
  return next;
}

interface TimePickerProps {
  value: string;
  label: string;
  describedBy: string;
  autoFocus: boolean;
  onChange: (time: string) => void;
}

/**
 * An hour and a minute picker. Not `<input type="time">`: browsers draw that
 * in their own language's clock, so an English one asks for "06:23 PM" on a
 * page where every other time reads 18:23. Phones still open their own wheel.
 */
function TimePicker({ value, label, describedBy, autoFocus, onChange }: TimePickerProps) {
  const [hour = '00', minute = '00'] = value.split(':');
  const select = 'cursor-pointer appearance-none bg-transparent px-1 outline-none';
  return (
    <div
      role="group"
      aria-label={`${label} time`}
      aria-describedby={describedBy}
      className="flex h-10 items-center rounded-md border border-input bg-background px-1.5 text-xl font-semibold tabular-nums has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
    >
      <select
        aria-label={`${label} hour`}
        autoFocus={autoFocus}
        value={hour}
        onChange={(e) => onChange(`${e.target.value}:${minute}`)}
        className={select}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span aria-hidden>:</span>
      <select
        aria-label={`${label} minutes`}
        value={minute}
        onChange={(e) => onChange(`${hour}:${e.target.value}`)}
        className={select}
      >
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
  labels: Record<PrayerName, string>;
  locale: string;
  onFixedChange: (fixed: FixedTimes) => void;
}

/**
 * Today's times as the TV shows them, each prayer with its own switch to hold
 * it at a fixed time: off follows the source, on picks the mosque's own time.
 */
export function TodayTimes({ times, fixed, labels, locale, onFixedChange }: TodayTimesProps) {
  /** The prayer switched on a moment ago, whose hour takes the focus. */
  const [added, setAdded] = useState<FixablePrayer | null>(null);
  const shown = withFixedTimes(times, fixed);

  /** The line under a fixed time: what it replaces today, or why it sits today out. */
  const note = (prayer: FixablePrayer, own: string) => {
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
      : `Fixed every day, instead of ${times[prayer]} today.`;
  };

  return (
    <>
      <div className="flex items-end justify-between gap-4 mb-1">
        <div>
          <h3 className="font-semibold">Today</h3>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {formatTodayDate(locale)}
          </p>
        </div>
        <span aria-hidden className="text-xs font-medium text-muted-foreground">Fixed time</span>
      </div>
      <div className="divide-y divide-border">
        {PRAYER_NAMES.map((prayer) => {
          const own = isFixablePrayer(prayer) ? fixed[prayer] : undefined;
          return (
            <div key={prayer} className="py-2.5">
              <div className="flex min-h-10 items-center gap-4">
                <span className="flex-1 min-w-0 truncate text-muted-foreground">{labels[prayer]}</span>
                {isFixablePrayer(prayer) && own !== undefined ? (
                  <TimePicker
                    value={own}
                    label={labels[prayer]}
                    describedBy={`fixed-${prayer}-note`}
                    autoFocus={added === prayer}
                    onChange={(time) => onFixedChange(setFixed(fixed, prayer, time))}
                  />
                ) : (
                  <span className="text-xl font-semibold tabular-nums">{shown[prayer]}</span>
                )}
                {isFixablePrayer(prayer) ? (
                  <Switch
                    aria-label={`Fixed time for ${labels[prayer]}`}
                    checked={own !== undefined}
                    onCheckedChange={(on) => {
                      onFixedChange(setFixed(fixed, prayer, on ? times[prayer] : null));
                      setAdded(on ? prayer : null);
                    }}
                  />
                ) : (
                  // Sunrise belongs to the sun: no switch, only the space one takes.
                  <span aria-hidden className="w-8 shrink-0" />
                )}
              </div>
              {isFixablePrayer(prayer) && own !== undefined && (
                <p id={`fixed-${prayer}-note`} className="mt-1.5 text-xs text-muted-foreground">
                  {note(prayer, own)}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        {Object.keys(fixed).length > 0
          ? 'Updates automatically every day, apart from fixed times.'
          : `Updates automatically every day. To keep a prayer at the same time, like ${labels.isha} at 19:00, switch on its fixed time.`}
      </p>
    </>
  );
}
