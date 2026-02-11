import { useState, useMemo } from 'react';
import type { MosqueSettings } from '@/types/database';
import type { PrayerName, PrayerTimeEntry } from '@/types/prayer';
import { prayerTimesMapToEntries, getNextPrayer } from '@/types/prayer';
import type { PrayerConfigMap } from '@/types/prayer-config';
import { getTodaysPrayerTimes, todayDateString } from '@/lib/display-cache';
import { useInterval } from './use-interval';

interface UsePrayerTimesResult {
  prayers: PrayerTimeEntry[];
  nextPrayer: PrayerTimeEntry | null;
}

export function usePrayerTimes(
  settings: MosqueSettings,
  slug: string,
  mosqueTimezone: string | undefined,
  isPreview: boolean,
  customPrayerNames?: Record<PrayerName, string>,
): UsePrayerTimesResult {
  // Tick every 60s to recompute nextPrayer
  const [minuteTick, setMinuteTick] = useState(() => Math.floor(Date.now() / 60000));
  // Track today's date for midnight rollover
  const [todayDate, setTodayDate] = useState(() => todayDateString(mosqueTimezone));

  // Update minuteTick every 60s
  useInterval(() => {
    setMinuteTick(Math.floor(Date.now() / 60000));
  }, 60000);

  // Check for date change every 30s (midnight rollover)
  useInterval(() => {
    const today = todayDateString(mosqueTimezone);
    if (today !== todayDate) {
      setTodayDate(today);
    }
  }, isPreview ? null : 30000);

  // Resolve prayer times for today (recomputes on settings/slug/date change)
  const prayerTimesMap = useMemo(
    () => getTodaysPrayerTimes(settings, slug),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings, slug, todayDate],
  );

  // Convert to display entries
  const prayers = useMemo(
    () => prayerTimesMapToEntries(prayerTimesMap, settings.prayer_config as PrayerConfigMap, customPrayerNames),
    [prayerTimesMap, settings.prayer_config, customPrayerNames],
  );

  // Derive next prayer (recomputes on prayers or minuteTick change)
  const nextPrayer = useMemo(
    () => getNextPrayer(prayers),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prayers, minuteTick],
  );

  return { prayers, nextPrayer };
}
