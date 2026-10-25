'use client';

import { formatTodayDate } from '@/lib/display-locale';
import { isFixablePrayer, withFixedTimes } from '@/lib/fixed-times';
import type { FixedTimes } from '@/lib/fixed-times';
import type { PrayerTimesMap } from '@/types/database';
import { PRAYER_NAMES } from '@/types/prayer';
import type { PrayerName } from '@/types/prayer';

interface TodayTimesProps {
  /** Today's times as the source gives them. */
  times: PrayerTimesMap;
  fixed: FixedTimes;
  labels: Record<PrayerName, string>;
  locale: string;
}

/** Today's times exactly as the TV shows them, fixed ones marked. */
export function TodayTimes({ times, fixed, labels, locale }: TodayTimesProps) {
  const shown = withFixedTimes(times, fixed);
  return (
    <>
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-semibold">Today</h3>
        <span className="text-sm text-muted-foreground" suppressHydrationWarning>
          {formatTodayDate(locale)}
        </span>
      </div>
      <div className="divide-y divide-border">
        {PRAYER_NAMES.map((prayer) => {
          const own = isFixablePrayer(prayer) ? fixed[prayer] : undefined;
          return (
            <div key={prayer} className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-muted-foreground">
                {labels[prayer]}
                {own !== undefined && shown[prayer] === own && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-foreground">
                    Fixed
                  </span>
                )}
              </span>
              <span className="text-xl font-semibold tabular-nums">{shown[prayer]}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        {Object.keys(fixed).length > 0
          ? 'Updates automatically every day, apart from fixed times.'
          : 'Updates automatically every day.'}
      </p>
    </>
  );
}
