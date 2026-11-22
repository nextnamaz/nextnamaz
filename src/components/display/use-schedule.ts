'use client';

import { useEffect, useRef, useState } from 'react';
import { isBlackoutNow, isControlQrNow } from '@/lib/display-schedule';
import type { SlideItem } from '@/types/database';
import type { PrayerTimeEntry } from '@/types/prayer';

const BLACKOUT_TICK_MS = 15_000;

/** Videos advance when they end; this is the safety cap if one never does. */
export const VIDEO_MAX_MS = 180_000;

/** Re-evaluates the blackout window a few times a minute. */
export function useBlackout(
  prayers: PrayerTimeEntry[],
  enabled: boolean,
  minutes: number
): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const update = () => setActive(isBlackoutNow(prayers, minutes, new Date()));
    const first = setTimeout(update, 0);
    const id = setInterval(update, BLACKOUT_TICK_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [prayers, enabled, minutes]);

  return enabled && active;
}

/**
 * Re-evaluates the post-prayer control-QR window on the same cadence as the
 * blackout. Deliberately not tied to it: the code shows over a dark screen.
 */
export function useControlQr(prayers: PrayerTimeEntry[], enabled: boolean): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const update = () => setActive(isControlQrNow(prayers, new Date()));
    const first = setTimeout(update, 0);
    const id = setInterval(update, BLACKOUT_TICK_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [prayers, enabled]);

  return enabled && active;
}

export interface Slideshow {
  slide: SlideItem | null;
  /** Called when a video finishes so the next item comes up immediately. */
  onMediaEnd: () => void;
}

/**
 * Cycles announcement media: after every interval the screen shows each item
 * once, then returns to the prayer display. Images hold for `showSeconds`;
 * videos play to their end (capped by VIDEO_MAX_MS). With `maxSeconds` above
 * zero a round also ends once that much time has passed, and the next round
 * picks up at the item after the last one shown, so every item still gets
 * its turn.
 */
export function useSlideshow(
  items: SlideItem[],
  enabled: boolean,
  intervalMin: number,
  showSeconds: number,
  maxSeconds = 0
): Slideshow {
  const [index, setIndex] = useState<number | null>(null);
  const endRef = useRef<() => void>(() => {});
  const itemsKey = items.map((i) => i.path).join('|');

  // Any change to the cycle — items, timings, or being switched off — hides
  // whatever is on screen so a slide can never freeze there. Done in render
  // rather than an effect, which the React Compiler rules disallow.
  const cycleKey = `${enabled}|${itemsKey}|${intervalMin}|${showSeconds}|${maxSeconds}`;
  const [prevKey, setPrevKey] = useState(cycleKey);
  if (prevKey !== cycleKey) {
    setPrevKey(cycleKey);
    setIndex(null);
  }

  useEffect(() => {
    if (!enabled || items.length === 0) return;
    let timer: ReturnType<typeof setTimeout>;
    /** Where the next round starts. */
    let next = 0;
    let shown = 0;
    let roundEndsAt = Infinity;

    const startRound = () => {
      shown = 0;
      roundEndsAt = maxSeconds > 0 ? Date.now() + maxSeconds * 1_000 : Infinity;
      showAt(next);
    };

    const showAt = (i: number) => {
      const at = i % items.length;
      const item = items[at];
      // Every item shown once, or the round's time is up: hide and wait it out.
      if (!item || shown >= items.length || Date.now() >= roundEndsAt) {
        next = at;
        setIndex(null);
        endRef.current = () => {};
        timer = setTimeout(startRound, intervalMin * 60_000);
        return;
      }
      shown += 1;
      setIndex(at);
      const holdMs = Math.min(item.kind === 'video' ? VIDEO_MAX_MS : showSeconds * 1_000, roundEndsAt - Date.now());
      endRef.current = () => {
        clearTimeout(timer);
        showAt(at + 1);
      };
      timer = setTimeout(() => showAt(at + 1), holdMs);
    };

    timer = setTimeout(startRound, intervalMin * 60_000);
    return () => {
      clearTimeout(timer);
      endRef.current = () => {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itemsKey stands in for items
  }, [enabled, itemsKey, intervalMin, showSeconds, maxSeconds]);

  return {
    slide: index === null ? null : (items[index] ?? null),
    onMediaEnd: () => endRef.current(),
  };
}
