import { useState, useEffect } from 'react';
import type { DisplayLocale } from '@/lib/display-locale';
import { formatClockTime, formatDisplayDate } from '@/lib/display-locale';

interface DisplayClockResult {
  timeStr: string;
  dateStr: string;
  date: Date;
}

/**
 * Shared hook for live clock display. Ticks every second.
 * Formats time and date according to the resolved DisplayLocale.
 */
export function useDisplayClock(locale: DisplayLocale): DisplayClockResult {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    timeStr: formatClockTime(now, locale),
    dateStr: formatDisplayDate(now, locale),
    date: now,
  };
}
