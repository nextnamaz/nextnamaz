'use client';

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { DefaultTheme, NightTheme } from '@/components/display/themes';
import { PREVIEW_PRAYERS } from '@/lib/theme-preview';
import { isRtlLocale, resolveDisplayLocale } from '@/lib/display-locale';
import type { DisplayLocale } from '@/lib/display-locale';
import { minutesOf } from '@/lib/display-schedule';
import { useDisplayClock } from '@/hooks/display/use-display-clock';
import type { PrayerTimeEntry } from '@/types/prayer';
import { ScreenPlaceholder } from './screen-placeholder';
import type { PlaygroundSettings } from './playground-panel';

/** The sample day without iqamah times, as demo-display.tsx draws it: the table a mosque gets. */
const DEMO_PRAYERS: PrayerTimeEntry[] = PREVIEW_PRAYERS.map(({ name, displayName, time }) => ({
  name,
  displayName,
  time,
}));

/** Minutes since midnight, re-read as each minute begins, so the next prayer moves on on time. */
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

/** getNextPrayer's rule, against a given minute. */
function nextPrayerAt(prayers: PrayerTimeEntry[], minute: number): PrayerTimeEntry | null {
  const upcoming = prayers.find((p) => p.name !== 'sunrise' && (minutesOf(p.time) ?? -1) > minute);
  return upcoming ?? prayers.find((p) => p.name === 'fajr') ?? null;
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** The theme's pulses hold still for reduced motion. Unlayered, like the theme's own rule. */
const HOLD_STILL =
  '@media (prefers-reduced-motion: reduce){.playground-screen .default-pulse,.playground-screen .animate-pulse{animation:none}}';

/**
 * The dark screen shown while the congregation prays, as tv-display.tsx draws
 * it: the time in light white numerals on black, and nothing else. Measured
 * against the set rather than the viewport.
 */
function BlackoutClock({ locale }: { locale: DisplayLocale }) {
  const { timeStr } = useDisplayClock(locale);
  return (
    <div className="flex h-full w-full items-center justify-center">
      <span
        className="font-light tabular-nums text-white"
        style={{ fontSize: '18cqmin', letterSpacing: '-0.02em', lineHeight: 1 }}
      >
        {timeStr}
      </span>
    </div>
  );
}

/**
 * Fades each newly mounted theme up from the set's black, like a TV changing
 * input. Not the first one: that replaces a placeholder in its own colours.
 */
function useFadeInAfterFirst() {
  const seen = useRef(false);
  return useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    if (!seen.current) {
      seen.current = true;
      return;
    }
    if (window.matchMedia(REDUCED_MOTION).matches) return;
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
  }, []);
}

/**
 * The playground's picture: the real Default or Night theme with the chosen
 * settings, on the visitor's clock. One theme is mounted at a time. Out of
 * sight it swaps to its placeholder, so its clocks stop.
 */
export function PlaygroundScreen({ settings }: { settings: PlaygroundSettings }) {
  const locale = useMemo(() => resolveDisplayLocale(settings.language), [settings.language]);
  const minute = useSyncExternalStore(subscribeMinute, minuteOfDay, minuteOfDay);
  const prayers = useMemo(
    () => DEMO_PRAYERS.map((p) => ({ ...p, displayName: locale.prayerNames[p.name] })),
    [locale]
  );
  const nextPrayer = useMemo(() => nextPrayerAt(prayers, minute), [prayers, minute]);
  const fadeIn = useFadeInAfterFirst();

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

  const night = settings.theme === 'night';
  const Theme = night ? NightTheme : DefaultTheme;
  const config: Record<string, string | boolean> = night
    ? { accent: settings.accent, verse: settings.line, showSeconds: false }
    : { mode: settings.mode, colorScheme: settings.scheme, displayText: settings.line };

  return (
    <div ref={watch} aria-hidden className="playground-screen absolute inset-0">
      {near ? (
        <>
          {/* Keyed on the language too: a new language mounts a fresh screen, which fades
              up like a new theme, rather than mirroring the old one in place (a layout shift).
              Isolated, so the theme's own z-indexes stay under the dark screen. */}
          <div
            key={`${settings.theme}-${settings.language}`}
            ref={fadeIn}
            dir={isRtlLocale(locale) ? 'rtl' : 'ltr'}
            lang={locale.locale}
            className="absolute inset-0 isolate"
          >
            <Theme prayers={prayers} nextPrayer={nextPrayer} config={config} isPortrait={false} locale={locale} />
          </div>
          <div
            className="absolute inset-0 z-10 bg-black transition-opacity duration-700 motion-reduce:transition-none"
            style={{ opacity: settings.blackout ? 1 : 0 }}
          >
            <BlackoutClock locale={locale} />
          </div>
          <style>{HOLD_STILL}</style>
        </>
      ) : (
        <ScreenPlaceholder />
      )}
    </div>
  );
}
