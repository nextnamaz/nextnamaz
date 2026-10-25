'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FIXABLE_PRAYERS, crossedNeighbour, withFixedTimes } from '@/lib/fixed-times';
import type { FixablePrayer, FixedTimes } from '@/lib/fixed-times';
import type { PrayerTimesMap } from '@/types/database';
import { PRAYER_NAMES } from '@/types/prayer';
import type { PrayerName } from '@/types/prayer';

/** `fixed` with one prayer set to `time`, or cleared by null, kept in the day's order. */
function setFixed(fixed: FixedTimes, prayer: FixablePrayer, time: string | null): FixedTimes {
  const next: FixedTimes = {};
  for (const p of FIXABLE_PRAYERS) {
    const value = p === prayer ? time : fixed[p];
    if (value) next[p] = value;
  }
  return next;
}

interface FixedTimesCardProps {
  /** Today's times as the source gives them. */
  times: PrayerTimesMap;
  fixed: FixedTimes;
  labels: Record<PrayerName, string>;
  onChange: (fixed: FixedTimes) => void;
}

/** One switch per prayer: off follows the source, on holds the mosque's own time. */
export function FixedTimesCard({ times, fixed, labels, onChange }: FixedTimesCardProps) {
  /** The prayer switched on a moment ago, whose time field takes the focus. */
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
      : `Instead of ${times[prayer]} today.`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fixed times</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground -mt-2">
          For a prayer your mosque holds at the same time every day, like Isha at 19:00.
          Switch it on and choose the time.
        </p>
        <div className="mt-2 divide-y divide-border">
          {FIXABLE_PRAYERS.map((prayer) => {
            const own = fixed[prayer];
            return (
              <div key={prayer} className="py-3">
                <div className="flex min-h-9 items-center gap-3">
                  <Label htmlFor={`fixed-${prayer}`} className="flex-1 text-base">
                    {labels[prayer]}
                  </Label>
                  {own === undefined ? (
                    <span className="text-sm text-muted-foreground">Automatic</span>
                  ) : (
                    <Input
                      type="time"
                      required
                      autoFocus={added === prayer}
                      value={own}
                      aria-label={`Fixed time for ${labels[prayer]}`}
                      aria-describedby={`fixed-${prayer}-note`}
                      // A fixed time is never blank: the switch is how it goes.
                      onChange={(e) => {
                        if (e.target.value) onChange(setFixed(fixed, prayer, e.target.value));
                      }}
                      // Sized by its content: a phone set to a 12-hour clock writes "7:00 PM".
                      className="h-9 w-auto text-lg md:text-lg font-semibold tabular-nums"
                    />
                  )}
                  <Switch
                    id={`fixed-${prayer}`}
                    checked={own !== undefined}
                    onCheckedChange={(on) => {
                      onChange(setFixed(fixed, prayer, on ? times[prayer] : null));
                      setAdded(on ? prayer : null);
                    }}
                  />
                </div>
                {own !== undefined && (
                  <p id={`fixed-${prayer}-note`} className="mt-1.5 text-xs text-muted-foreground">
                    {note(prayer, own)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
