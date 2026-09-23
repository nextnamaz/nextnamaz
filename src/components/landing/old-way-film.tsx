'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { resolveDisplayLocale } from '@/lib/display-locale';
import type { SupportedLocale } from '@/types/locale';
import { TvFrame } from './tv-frame';
import { ScreenPlaceholder } from './screen-placeholder';

const DemoDisplay = dynamic(() => import('./demo-display').then((m) => m.DemoDisplay), {
  ssr: false,
  loading: () => <ScreenPlaceholder />,
});

/** One loop of the film, in seconds. */
const LOOP = 12.5;

/**
 * The script. Before: the calendar turns and the old sheet comes down and a
 * new one goes up, twice, by hand. Then the sheet grows into a television. After:
 * the calendar turns again and the screen updates itself. Then back to the start.
 */
const T = {
  flips: [1.1, 2.9, 8.1],
  swaps: [1.4, 3.2],
  swap: 0.9,
  morph: [4.6, 6.1],
  sync: [8.2, 9.8],
  out: [11.7, LOOP],
} as const;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const span = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));

/** Where the sheet hangs, and where the television will, in the frame's cqw (the frame is 100 by 80). */
// Both hang on the plain wall to the right of the mihrab, never over it.
const SHEET = { x: 60, y: 30, w: 16, h: 22 };
const TV = { x: 39, y: 22, w: 55, h: 31.6 };

interface OldWayFilmProps {
  label: string;
  before: string;
  after: string;
  display: SupportedLocale;
}

/**
 * Before and after, as a short film drawn and timed in the page: a mosque
 * wall where the printed timetable is changed by hand each month, until the
 * sheet becomes a screen that changes itself. Runs only while on screen;
 * under reduced motion it holds on the after.
 */
export function OldWayFilm({ label, before, after, display }: OldWayFilmProps) {
  const [t, setT] = useState(7);
  const [running, setRunning] = useState(false);
  const clock = useRef(0);

  const watch = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setRunning(entries.some((e) => e.isIntersecting) && !still);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      clock.current = (clock.current + Math.min(0.1, (now - last) / 1000)) % LOOP;
      last = now;
      setT(clock.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const locale = resolveDisplayLocale(display);
  const monthName = (i: number) =>
    new Intl.DateTimeFormat(locale.locale, { month: 'long' }).format(new Date(2026, 8 + i, 1));
  const flipsDone = T.flips.filter((f) => t >= f + 0.35).length;
  const flipping = T.flips.map((f) => span(t, [f, f + 0.35])).find((p) => p > 0 && p < 1) ?? 0;
  const month = flipsDone;

  // The sheet: which month it shows, and how far the swap has gone.
  const swapIndex = T.swaps.findIndex((s) => t >= s && t < s + T.swap);
  const swapP = swapIndex >= 0 ? (t - (T.swaps[swapIndex] ?? 0)) / T.swap : 0;
  const sheetMonth = T.swaps.filter((s) => t >= s + T.swap / 2).length;

  const morph = ease(span(t, T.morph));
  const live = span(t, [T.morph[1] - 0.4, T.morph[1] + 0.2]);
  const sync = span(t, T.sync);
  const out = span(t, T.out);
  const intro = 1 - span(t, [0, 0.5]);
  const isAfter = t >= T.morph[1] - 0.6 && t < T.out[0];

  // The clock's hands turn fast: time passing.
  const minutes = t * 60;

  // The sheet grows into the set: scale and move from its box to the set's.
  const sx = 1 + (TV.w / SHEET.w - 1) * morph;
  const sy = 1 + (TV.h / SHEET.h - 1) * morph;
  const x = SHEET.x + (TV.x - SHEET.x) * morph;
  const y = SHEET.y + (TV.y - SHEET.y) * morph;

  return (
    <div
      ref={watch}
      role="img"
      aria-label={label}
      dir="ltr"
      className="relative aspect-5/4 w-full overflow-hidden rounded-2xl ring-1 ring-[rgba(38,24,10,0.08)]"
      style={{
        containerType: 'inline-size',
        background: 'radial-gradient(ellipse 70% 60% at 50% 20%, #FBFAF7, #EFEBE3 75%)',
      }}
    >
      {/* The mihrab's arch, set into the wall on the left; the timetable hangs beside it. */}
      <svg viewBox="0 0 100 80" className="absolute inset-0 size-full" aria-hidden>
        <path d="M5 80 V40 A13.5 13.5 0 0 1 32 40 V80 Z" fill="#E6E0D4" />
        <path d="M7.8 80 V41 A10.7 10.7 0 0 1 29.2 41 V80 Z" fill="#DDD5C6" />
        <rect x="0" y="66" width="100" height="14" fill="#E3DCCD" />
        <rect x="0" y="66" width="100" height="0.5" fill="#D2C9B7" />
      </svg>

      {/* The wall clock, its hands running. */}
      <svg viewBox="0 0 20 20" className="absolute top-[5cqw] left-[42cqw] w-[11cqw]" aria-hidden>
        <circle cx="10" cy="10" r="9.3" fill="#FFFFFF" stroke="#B9B2A5" strokeWidth="0.9" />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="9.8" y="1.9" width="0.4" height="1.3" fill="#6F695E" transform={`rotate(${i * 30} 10 10)`} />
        ))}
        <rect x="9.6" y="5" width="0.8" height="5.4" rx="0.4" fill="#2B2822" transform={`rotate(${minutes / 12} 10 10)`} />
        <rect x="9.75" y="2.8" width="0.5" height="7.6" rx="0.25" fill="#2B2822" transform={`rotate(${minutes * 6} 10 10)`} />
        <circle cx="10" cy="10" r="0.8" fill="#C0392B" />
      </svg>

      {/* The wall calendar, turning over each month. */}
      <div className="absolute top-[4cqw] right-[5cqw] w-[13cqw]" style={{ perspective: '40cqw' }}>
        <div className="rounded-[0.8cqw] bg-white shadow-[0_0.6cqw_1.6cqw_-0.4cqw_rgba(38,24,10,0.3)]">
          <div className="rounded-t-[0.8cqw] bg-[#C0392B] py-[0.9cqw] text-center text-[2cqw] font-semibold text-white capitalize">
            {monthName(month)}
          </div>
          <div className="grid grid-cols-7 gap-[0.5cqw] p-[1.2cqw]">
            {Array.from({ length: 28 }, (_, i) => (
              <span key={i} className="h-[0.9cqw] rounded-[0.2cqw] bg-[#E4DFD5]" />
            ))}
          </div>
        </div>
        {flipping > 0 && (
          <div
            className="absolute inset-0 origin-top rounded-[0.8cqw] bg-white shadow-[0_0.4cqw_1cqw_rgba(38,24,10,0.25)]"
            style={{ transform: `rotateX(${flipping * 110}deg)`, opacity: 1 - flipping * 0.6 }}
          >
            <div className="rounded-t-[0.8cqw] bg-[#C0392B] py-[0.9cqw] text-center text-[2cqw] font-semibold text-white capitalize">
              {monthName(month)}
            </div>
          </div>
        )}
      </div>

      {/* The printed sheet: swapped by hand, then grown into the set. */}
      <div
        className="absolute origin-top-left"
        style={{
          left: `${x}cqw`,
          top: `${y}cqw`,
          width: `${SHEET.w}cqw`,
          height: `${SHEET.h}cqw`,
          transform: `scale(${sx}, ${sy})`,
          opacity: isAfter ? 1 - live : 1,
        }}
        aria-hidden
      >
        <div
          className="absolute inset-0 rounded-[0.4cqw] bg-white shadow-[0_0.6cqw_1.4cqw_-0.3cqw_rgba(38,24,10,0.3)]"
          style={{
            // Coming down: falls and turns; going up: drops in from above.
            transform:
              swapIndex >= 0
                ? swapP < 0.5
                  ? `translate(${swapP * 6}cqw, ${swapP * 2 * 30}cqw) rotate(${swapP * 2 * 24}deg)`
                  : `translateY(${-(1 - (swapP - 0.5) * 2) * 26}cqw)`
                : undefined,
            opacity: swapIndex >= 0 ? (swapP < 0.5 ? 1 - swapP * 2 : (swapP - 0.5) * 2) : 1,
            backgroundColor: `rgb(${255 - morph * 243},${255 - morph * 243},${255 - morph * 241})`,
          }}
        >
          <div style={{ opacity: 1 - morph * 2 }}>
            <p className="pt-[1.4cqw] text-center text-[1.5cqw] font-bold tracking-wide text-[#1F1A12] uppercase">
              {monthName(sheetMonth)}
            </p>
            <div className="mt-[1cqw] space-y-[0.9cqw] px-[1.6cqw]">
              {Array.from({ length: 11 }, (_, i) => (
                <span key={i} className="flex gap-[0.6cqw]">
                  <span className="h-[0.7cqw] w-[2cqw] rounded-full bg-[#C9C2B4]" />
                  <span className="h-[0.7cqw] flex-1 rounded-full bg-[#E1DBCF]" />
                </span>
              ))}
            </div>
          </div>
          {/* The pin. */}
          <span className="absolute -top-[0.6cqw] left-1/2 size-[1.4cqw] -translate-x-1/2 rounded-full bg-[#C0392B] shadow-[0_0.2cqw_0.4cqw_rgba(0,0,0,0.3)]" style={{ opacity: 1 - morph }} />
        </div>
      </div>

      {/* After: the set on the wall, running the real display. */}
      {isAfter && (
        <div className="absolute" style={{ left: `${TV.x}cqw`, top: `${TV.y}cqw`, width: `${TV.w}cqw`, opacity: live }}>
          <TvFrame>
            <DemoDisplay locale={locale} />
          </TvFrame>
          {/* The new month arrives on its own. */}
          {sync > 0 && (
            <span
              className="absolute -top-[2cqw] -right-[2cqw] flex size-[5cqw] items-center justify-center rounded-full text-white shadow-[0_0.6cqw_1.6cqw_rgba(38,24,10,0.3)]"
              style={{
                backgroundColor: sync < 0.55 ? '#E8A817' : '#2F9E5B',
                transform: `scale(${sync < 0.15 ? sync / 0.15 : 1})`,
              }}
            >
              {sync < 0.55 ? (
                <RefreshCw className="size-[2.6cqw]" strokeWidth={2.6} style={{ transform: `rotate(${sync * 900}deg)` }} />
              ) : (
                <Check className="size-[2.8cqw]" strokeWidth={3} />
              )}
            </span>
          )}
        </div>
      )}

      {/* The caption: before, then after. */}
      <p className="absolute bottom-[3cqw] left-[3cqw] flex h-[5.6cqw] items-center gap-[1.2cqw] rounded-full bg-white px-[2.6cqw] text-[2.3cqw] font-medium text-foreground shadow-[0_1px_2px_rgba(38,24,10,0.12),0_6px_16px_-6px_rgba(38,24,10,0.3)]">
        <span className="size-[1cqw] rounded-full" style={{ backgroundColor: isAfter ? '#2F9E5B' : '#A8A195' }} />
        {isAfter ? after : before}
      </p>

      {/* Between loops: a breath of white. */}
      <div className="pointer-events-none absolute inset-0 bg-[#F6F3EE]" style={{ opacity: Math.max(out, intro) }} />
    </div>
  );
}
