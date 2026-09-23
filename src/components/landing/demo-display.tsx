'use client';

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { DefaultTheme } from '@/components/display/themes/default';
import { ScreenPlaceholder } from './screen-placeholder';
import { PREVIEW_PRAYERS, PREVIEW_LOCALE } from '@/lib/theme-preview';
import { isRtlLocale } from '@/lib/display-locale';
import { minutesOf } from '@/lib/display-schedule';
import type { DisplayLocale } from '@/lib/display-locale';
import type { PrayerTimeEntry } from '@/types/prayer';

/**
 * The sample day without iqamah times. A real screen has no way to be given
 * them yet, and the theme drops the column when none are set, so this is the
 * table a mosque will actually get.
 */
const DEMO_PRAYERS: PrayerTimeEntry[] = PREVIEW_PRAYERS.map(({ name, displayName, time }) => ({
  name,
  displayName,
  time,
}));

/**
 * Minutes since midnight, re-read as each minute begins. The theme's countdown
 * rolls a passed time over to tomorrow, so the next prayer has to move on the
 * moment one begins, not some seconds later.
 */
function subscribeMinute(onChange: () => void): () => void {
  let id = 0;
  const arm = () => {
    id = window.setTimeout(() => {
      onChange();
      arm();
    }, 60_000 - (Date.now() % 60_000));
  };
  arm();
  return () => clearTimeout(id);
}
const minuteOfDay = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

/** getNextPrayer's rule, against a given minute so the demo moves on with the day. */
function nextPrayerAt(prayers: PrayerTimeEntry[], minute: number): PrayerTimeEntry | null {
  const upcoming = prayers.find((p) => p.name !== 'sunrise' && (minutesOf(p.time) ?? -1) > minute);
  return upcoming ?? prayers.find((p) => p.name === 'fajr') ?? null;
}

/**
 * The theme's pulses hold still for reduced motion. Unlayered, like the
 * theme's own rule, because layered CSS (any Tailwind utility) loses to it.
 */
const HOLD_STILL =
  '@media (prefers-reduced-motion: reduce){.demo-display .default-pulse,.demo-display .animate-pulse{animation:none}}';

interface DemoDisplayProps {
  locale?: DisplayLocale;
  footer?: string;
  /** The theme's own portrait layout, for a set turned on its side. */
  portrait?: boolean;
}

/**
 * The landing page's demo screen: the real Default theme in its Classic
 * colours, running on the visitor's own clock. Every television on the page
 * shows this one, so they cannot drift apart. Arabic and Urdu mirror, as they
 * do on a real TV.
 *
 * It is a picture, so it is hidden from assistive tech; whatever holds it (a
 * labelled image, or the legend beside it) says what it shows. Out of sight it swaps to its placeholder, so
 * its clocks and its pulse stop.
 */
export function DemoDisplay({ locale = PREVIEW_LOCALE, footer = 'بسم الله الرحمن الرحيم', portrait = false }: DemoDisplayProps) {
  const minute = useSyncExternalStore(subscribeMinute, minuteOfDay, minuteOfDay);
  const prayers = useMemo(
    () => DEMO_PRAYERS.map((p) => ({ ...p, displayName: locale.prayerNames[p.name] })),
    [locale]
  );
  const nextPrayer = useMemo(() => nextPrayerAt(prayers, minute), [prayers, minute]);

  const [near, setNear] = useState(false);
  const watch = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setNear(entry.isIntersecting);
      },
      { rootMargin: '50% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={watch}
      aria-hidden
      dir={isRtlLocale(locale) ? 'rtl' : 'ltr'}
      lang={locale.locale}
      // Isolated, so the theme's own z-indexes stay under whatever the frame draws over it (the glass).
      className="demo-display absolute inset-0 isolate"
    >
      {near ? (
        <>
          <DefaultTheme
            prayers={prayers}
            nextPrayer={nextPrayer}
            config={{ mode: 'light', colorScheme: 'classic', displayText: footer }}
            isPortrait={portrait}
            locale={locale}
          />
          <style>{HOLD_STILL}</style>
        </>
      ) : (
        <ScreenPlaceholder />
      )}
    </div>
  );
}
