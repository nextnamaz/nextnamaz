import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBlackout, useSlideshow, VIDEO_MAX_MS } from '@/components/display/use-schedule';
import type { SlideItem } from '@/types/database';
import type { PrayerTimeEntry } from '@/types/prayer';

const MINUTE = 60_000;

function image(path: string): SlideItem {
  return { path, url: `https://cdn.test/${path}`, kind: 'image' };
}

function clip(path: string): SlideItem {
  return { path, url: `https://cdn.test/${path}`, kind: 'video' };
}

interface SlideshowProps {
  items: SlideItem[];
  enabled: boolean;
  intervalMin: number;
  showSeconds: number;
}

function renderSlideshow(initialProps: SlideshowProps) {
  return renderHook(
    (props: SlideshowProps) =>
      useSlideshow(props.items, props.enabled, props.intervalMin, props.showSeconds),
    { initialProps }
  );
}

interface BlackoutProps {
  prayers: PrayerTimeEntry[];
  enabled: boolean;
  minutes: number;
}

function renderBlackout(initialProps: BlackoutProps) {
  return renderHook(
    (props: BlackoutProps) => useBlackout(props.prayers, props.enabled, props.minutes),
    { initialProps }
  );
}

/** The hook's setState calls come from timer callbacks, so every step needs act. */
const tick = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useSlideshow', () => {
  it('stays hidden until a whole interval has elapsed', () => {
    const { result } = renderSlideshow({
      items: [image('a')],
      enabled: true,
      intervalMin: 10,
      showSeconds: 20,
    });

    expect(result.current.slide).toBeNull();
    tick(10 * MINUTE - 1);
    expect(result.current.slide).toBeNull();
    tick(1);
    expect(result.current.slide?.path).toBe('a');
  });

  it('holds each image for showSeconds before advancing', () => {
    const { result } = renderSlideshow({
      items: [image('a'), image('b'), image('c')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 5,
    });

    tick(MINUTE);
    expect(result.current.slide?.path).toBe('a');
    tick(4_999);
    expect(result.current.slide?.path).toBe('a');
    tick(1);
    expect(result.current.slide?.path).toBe('b');
    tick(5_000);
    expect(result.current.slide?.path).toBe('c');
  });

  it('hides after the last item and comes back one interval later', () => {
    const { result } = renderSlideshow({
      items: [image('a'), image('b')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 5,
    });

    tick(MINUTE);
    tick(5_000);
    expect(result.current.slide?.path).toBe('b');
    tick(5_000);
    expect(result.current.slide).toBeNull();
    tick(MINUTE - 1);
    expect(result.current.slide).toBeNull();
    tick(1);
    expect(result.current.slide?.path).toBe('a');
    // The second cycle runs the whole list again on fresh holds.
    tick(5_000);
    expect(result.current.slide?.path).toBe('b');
    tick(5_000);
    expect(result.current.slide).toBeNull();
    expect(vi.getTimerCount()).toBe(1);
  });

  it('keeps a video on screen past showSeconds and advances only on onMediaEnd', () => {
    const { result } = renderSlideshow({
      items: [clip('v'), image('b')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 5,
    });

    tick(MINUTE);
    expect(result.current.slide?.path).toBe('v');
    tick(5_000);
    expect(result.current.slide?.path).toBe('v');
    tick(30_000);
    expect(result.current.slide?.path).toBe('v');

    act(() => result.current.onMediaEnd());
    expect(result.current.slide?.path).toBe('b');
    // Exactly one pending timer means the video's cap was cleared, not merely
    // outlived by b's hold: two timers here would double-advance later.
    expect(vi.getTimerCount()).toBe(1);
    tick(4_999);
    expect(result.current.slide?.path).toBe('b');
    tick(1);
    expect(result.current.slide).toBeNull();
    // Only the wait for the next interval is left over from the whole cycle.
    expect(vi.getTimerCount()).toBe(1);
  });

  it('caps a video that never ends at VIDEO_MAX_MS', () => {
    const { result } = renderSlideshow({
      items: [clip('v'), image('b')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 5,
    });

    tick(MINUTE);
    tick(VIDEO_MAX_MS - 1);
    expect(result.current.slide?.path).toBe('v');
    tick(1);
    expect(result.current.slide?.path).toBe('b');
  });

  it('gives every video its own end, not just the first one', () => {
    const { result } = renderSlideshow({
      items: [clip('v1'), clip('v2')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 5,
    });

    tick(MINUTE);
    tick(10_000);
    expect(result.current.slide?.path).toBe('v1');

    act(() => result.current.onMediaEnd());
    expect(result.current.slide?.path).toBe('v2');
    expect(vi.getTimerCount()).toBe(1);
    // v2 is held as a video too — showSeconds must not apply to it either.
    tick(5_000);
    expect(result.current.slide?.path).toBe('v2');
    tick(VIDEO_MAX_MS - 5_001);
    expect(result.current.slide?.path).toBe('v2');
    tick(1);
    expect(result.current.slide).toBeNull();
    // v1's cap would have fired 10s before v2's; a leak would show up as a
    // second pending timer alongside the wait for the next interval.
    expect(vi.getTimerCount()).toBe(1);
  });

  it('hides when the last item is a video that ends', () => {
    const { result } = renderSlideshow({
      items: [image('a'), clip('v')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 5,
    });

    tick(MINUTE);
    tick(5_000);
    expect(result.current.slide?.path).toBe('v');
    tick(30_000);
    expect(result.current.slide?.path).toBe('v');

    act(() => result.current.onMediaEnd());
    expect(result.current.slide).toBeNull();
    expect(vi.getTimerCount()).toBe(1);
    // A duplicate 'ended' event from the player must not disturb the wait.
    act(() => result.current.onMediaEnd());
    tick(MINUTE - 1);
    expect(result.current.slide).toBeNull();
    tick(1);
    expect(result.current.slide?.path).toBe('a');
  });

  it('advances on onMediaEnd during an image too, cancelling that image hold', () => {
    const { result } = renderSlideshow({
      items: [image('a'), image('b')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 30,
    });

    tick(MINUTE);
    expect(result.current.slide?.path).toBe('a');
    // Interrupt part-way in, so a's abandoned hold and b's fresh one would fire
    // at different times and the boundary below can tell them apart.
    tick(10_000);

    act(() => result.current.onMediaEnd());
    expect(result.current.slide?.path).toBe('b');
    expect(vi.getTimerCount()).toBe(1); // a's hold was cleared, not left running
    // b restarts the hold from scratch rather than inheriting a's remaining 20s.
    tick(29_999);
    expect(result.current.slide?.path).toBe('b');
    tick(1);
    expect(result.current.slide).toBeNull();
  });

  it('never shows anything while disabled', () => {
    const { result } = renderSlideshow({
      items: [image('a'), image('b')],
      enabled: false,
      intervalMin: 1,
      showSeconds: 5,
    });

    expect(vi.getTimerCount()).toBe(0); // nothing was ever armed
    tick(60 * MINUTE);
    expect(result.current.slide).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('never shows anything when there are no items', () => {
    const { result } = renderSlideshow({
      items: [],
      enabled: true,
      intervalMin: 1,
      showSeconds: 5,
    });

    expect(vi.getTimerCount()).toBe(0); // nothing was ever armed
    tick(60 * MINUTE);
    expect(result.current.slide).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('starts a cycle when it is switched on', () => {
    const props: SlideshowProps = {
      items: [image('a'), image('b')],
      enabled: false,
      intervalMin: 1,
      showSeconds: 5,
    };
    const { result, rerender } = renderSlideshow(props);

    tick(60 * MINUTE);
    expect(result.current.slide).toBeNull();

    rerender({ ...props, enabled: true });
    // Switching on waits one full interval before the first slide, as at mount.
    expect(result.current.slide).toBeNull();
    tick(MINUTE - 1);
    expect(result.current.slide).toBeNull();
    tick(1);
    expect(result.current.slide?.path).toBe('a');
  });

  it('does nothing when onMediaEnd is called while nothing is showing', () => {
    const { result } = renderSlideshow({
      items: [image('a')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 5,
    });

    act(() => result.current.onMediaEnd());
    expect(result.current.slide).toBeNull();
    // The pending interval survives: the first slide still arrives on schedule.
    tick(MINUTE);
    expect(result.current.slide?.path).toBe('a');
  });

  it('clears the showing slide the moment it is switched off', () => {
    const props: SlideshowProps = {
      items: [image('a'), image('b')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 30,
    };
    const { result, rerender } = renderSlideshow(props);

    tick(MINUTE);
    expect(result.current.slide?.path).toBe('a');

    rerender({ ...props, enabled: false });
    expect(result.current.slide).toBeNull();
    tick(60 * MINUTE);
    expect(result.current.slide).toBeNull();
  });

  it('clears the showing slide when the items change', () => {
    const props: SlideshowProps = {
      items: [image('a'), image('b')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 30,
    };
    const { result, rerender } = renderSlideshow(props);

    tick(MINUTE);
    expect(result.current.slide?.path).toBe('a');

    rerender({ ...props, items: [image('x')] });
    expect(result.current.slide).toBeNull();
    tick(MINUTE);
    expect(result.current.slide?.path).toBe('x');
  });

  it('clears the showing slide when intervalMin changes', () => {
    const props: SlideshowProps = {
      items: [image('a'), image('b')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 30,
    };
    const { result, rerender } = renderSlideshow(props);

    tick(MINUTE);
    expect(result.current.slide?.path).toBe('a');

    rerender({ ...props, intervalMin: 2 });
    expect(result.current.slide).toBeNull();
    // The wait restarts on the new interval, timed from the change.
    tick(2 * MINUTE - 1);
    expect(result.current.slide).toBeNull();
    tick(1);
    expect(result.current.slide?.path).toBe('a');
  });

  it('clears the showing slide when showSeconds changes', () => {
    const props: SlideshowProps = {
      items: [image('a'), image('b')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 30,
    };
    const { result, rerender } = renderSlideshow(props);

    tick(MINUTE);
    expect(result.current.slide?.path).toBe('a');

    rerender({ ...props, showSeconds: 10 });
    expect(result.current.slide).toBeNull();
    // The next cycle must hold on the new 10s, not the old 30s.
    tick(MINUTE);
    expect(result.current.slide?.path).toBe('a');
    tick(9_999);
    expect(result.current.slide?.path).toBe('a');
    tick(1);
    expect(result.current.slide?.path).toBe('b');
  });

  it('treats a fresh array of the same paths as the same cycle', () => {
    const props: SlideshowProps = {
      items: [image('a'), image('b')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 5,
    };
    const { result, rerender } = renderSlideshow(props);

    tick(MINUTE);
    expect(result.current.slide?.path).toBe('a');

    // A parent re-render that rebuilds the list must not restart the slideshow.
    rerender({ ...props, items: [image('a'), image('b')] });
    expect(result.current.slide?.path).toBe('a');
    tick(5_000);
    expect(result.current.slide?.path).toBe('b');
  });

  it('leaves no timers behind when unmounted mid-slide', () => {
    const { result, unmount } = renderSlideshow({
      items: [image('a'), image('b')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 30,
    });

    tick(MINUTE);
    expect(result.current.slide?.path).toBe('a');
    expect(vi.getTimerCount()).toBe(1); // the hold on 'a' is pending

    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(() => vi.advanceTimersByTime(60 * MINUTE)).not.toThrow();
  });

  it('leaves no timers behind when unmounted while hidden', () => {
    const { unmount } = renderSlideshow({
      items: [image('a')],
      enabled: true,
      intervalMin: 10,
      showSeconds: 5,
    });

    expect(vi.getTimerCount()).toBe(1); // the wait for the first slide
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(() => vi.advanceTimersByTime(60 * MINUTE)).not.toThrow();
  });

  it('ignores onMediaEnd after unmount', () => {
    const { result, unmount } = renderSlideshow({
      items: [clip('v'), image('b')],
      enabled: true,
      intervalMin: 1,
      showSeconds: 5,
    });

    tick(MINUTE);
    unmount();

    expect(() => result.current.onMediaEnd()).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });
});

/** Dhuhr at 13:24 gives a 15-minute window that closes at 13:39. */
const DAY: PrayerTimeEntry[] = [
  { name: 'fajr', displayName: 'Fajr', time: '03:26' },
  { name: 'sunrise', displayName: 'Sunrise', time: '04:55' },
  { name: 'dhuhr', displayName: 'Dhuhr', time: '13:24' },
  { name: 'asr', displayName: 'Asr', time: '17:43' },
  { name: 'maghrib', displayName: 'Maghrib', time: '21:42' },
  { name: 'isha', displayName: 'Isha', time: '23:50' },
];

describe('useBlackout', () => {
  it('stays off when disabled, even inside a prayer window', () => {
    vi.setSystemTime(new Date(2026, 6, 30, 13, 25));
    const { result } = renderBlackout({ prayers: DAY, enabled: false, minutes: 15 });

    expect(result.current).toBe(false);
    tick(60_000);
    expect(result.current).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('turns on shortly after a prayer time', () => {
    vi.setSystemTime(new Date(2026, 6, 30, 13, 25));
    const { result } = renderBlackout({ prayers: DAY, enabled: true, minutes: 15 });

    // The first evaluation is deferred to a timeout, so the screen starts lit.
    expect(result.current).toBe(false);
    tick(1);
    expect(result.current).toBe(true);
  });

  it('turns on within one tick of a window opening under it', () => {
    vi.setSystemTime(new Date(2026, 6, 30, 13, 23, 50));
    const { result } = renderBlackout({ prayers: DAY, enabled: true, minutes: 15 });

    tick(1);
    expect(result.current).toBe(false); // dhuhr has not started yet
    // 13:24:00 — dhuhr has started, but the 15s tick has not come round, so the
    // screen is still lit. This is the documented worst-case latency.
    tick(9_999);
    expect(result.current).toBe(false);
    tick(5_000); // 13:24:05, the first tick after the window opened
    expect(result.current).toBe(true);
  });

  it('turns itself back off when the window passes, without any prop change', () => {
    vi.setSystemTime(new Date(2026, 6, 30, 13, 38, 30));
    const { result } = renderBlackout({ prayers: DAY, enabled: true, minutes: 15 });

    tick(1);
    expect(result.current).toBe(true);
    tick(15_000); // 13:38:45 — still within dhuhr + 15
    expect(result.current).toBe(true);
    tick(15_000); // 13:39:00 — window closed
    expect(result.current).toBe(false);
  });

  it('goes off immediately when disabled mid-blackout', () => {
    vi.setSystemTime(new Date(2026, 6, 30, 13, 25));
    const props: BlackoutProps = { prayers: DAY, enabled: true, minutes: 15 };
    const { result, rerender } = renderBlackout(props);

    tick(1);
    expect(result.current).toBe(true);

    rerender({ ...props, enabled: false });
    expect(result.current).toBe(false);
  });

  it('catches up when re-enabled inside a live window', () => {
    vi.setSystemTime(new Date(2026, 6, 30, 13, 25));
    const props: BlackoutProps = { prayers: DAY, enabled: false, minutes: 15 };
    const { result, rerender } = renderBlackout(props);

    tick(60_000);
    expect(result.current).toBe(false);

    rerender({ ...props, enabled: true });
    tick(1);
    expect(result.current).toBe(true);
  });

  it('re-evaluates when the window length changes', () => {
    vi.setSystemTime(new Date(2026, 6, 30, 13, 30)); // dhuhr + 6 minutes
    const props: BlackoutProps = { prayers: DAY, enabled: true, minutes: 15 };
    const { result, rerender } = renderBlackout(props);

    tick(1);
    expect(result.current).toBe(true);

    // A shorter window that has already elapsed lifts the blackout without
    // waiting for the next 15s tick.
    rerender({ ...props, minutes: 5 });
    tick(1);
    expect(result.current).toBe(false);
  });

  it('never turns on for an empty prayer list', () => {
    vi.setSystemTime(new Date(2026, 6, 30, 13, 25));
    const { result } = renderBlackout({ prayers: [], enabled: true, minutes: 15 });

    tick(60_000);
    expect(result.current).toBe(false);
  });
});
