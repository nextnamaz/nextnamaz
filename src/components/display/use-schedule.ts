'use client';

import { useEffect, useRef, useState } from 'react';
import { isBlackoutNow } from '@/lib/display-schedule';
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

export interface Slideshow {
  slide: SlideItem | null;
  /** Called when a video finishes so the next item comes up immediately. */
  onMediaEnd: () => void;
}

/**
 * Cycles announcement media: after every interval the screen shows each item
 * once, then returns to the prayer display. Images hold for `showSeconds`;
 * videos play to their end (capped by VIDEO_MAX_MS).
 */
export function useSlideshow(
  items: SlideItem[],
  enabled: boolean,
  intervalMin: number,
  showSeconds: number
): Slideshow {
  const [index, setIndex] = useState<number | null>(null);
  const endRef = useRef<() => void>(() => {});
  const itemsKey = items.map((i) => i.path).join('|');

  // Any change to the cycle — items, timings, or being switched off — hides
  // whatever is on screen so a slide can never freeze there. Done in render
  // rather than an effect, which the React Compiler rules disallow.
  const cycleKey = `${enabled}|${itemsKey}|${intervalMin}|${showSeconds}`;
  const [prevKey, setPrevKey] = useState(cycleKey);
  if (prevKey !== cycleKey) {
    setPrevKey(cycleKey);
    setIndex(null);
  }

  useEffect(() => {
    if (!enabled || items.length === 0) return;
    let timer: ReturnType<typeof setTimeout>;

    const showAt = (i: number) => {
      const item = items[i];
      // Off the end of the list: the cycle is done, so hide and wait it out.
      if (!item) {
        setIndex(null);
        endRef.current = () => {};
        timer = setTimeout(() => showAt(0), intervalMin * 60_000);
        return;
      }
      setIndex(i);
      const holdMs = item.kind === 'video' ? VIDEO_MAX_MS : showSeconds * 1_000;
      endRef.current = () => {
        clearTimeout(timer);
        showAt(i + 1);
      };
      timer = setTimeout(() => showAt(i + 1), holdMs);
    };

    timer = setTimeout(() => showAt(0), intervalMin * 60_000);
    return () => {
      clearTimeout(timer);
      endRef.current = () => {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itemsKey stands in for items
  }, [enabled, itemsKey, intervalMin, showSeconds]);

  return {
    slide: index === null ? null : (items[index] ?? null),
    onMediaEnd: () => endRef.current(),
  };
}
