'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

interface MotionStageProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** How much of a stage must show before its drawing starts to play. */
const ENTER_RATIO = 0.45;

/** Pauses every animation inside a stage that is off screen. Shared by all stages; React writes it once. */
const PAUSE = "[data-live='off'],[data-live='off'] *{animation-play-state:paused!important}";

/**
 * A stage whose drawing acts out its idea as it scrolls into view, and whose
 * loops stop while it is out of sight. The motion itself lives with each
 * drawing, as CSS keyed on two attributes set here:
 *
 *   data-enter  'wait' until the stage is first seen, then 'play' once enough
 *               of it shows. Never set when the stage is already on screen (or
 *               scrolled past) at its first report, so nothing painted blinks
 *               out and back.
 *   data-live   'on' while any of the stage is in view, 'off' otherwise.
 *
 * Neither is set without JavaScript, so the drawing is then its still,
 * finished self. Each drawing's CSS sits inside
 * `@media (prefers-reduced-motion: no-preference)`, which holds it still too.
 */
export function MotionStage({ children, className, style }: MotionStageProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let first = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const live = entry.isIntersecting;
        if (first) {
          first = false;
          if (!live && entry.boundingClientRect.top > 0) el.dataset.enter = 'wait';
        }
        if (el.dataset.enter === 'wait' && entry.intersectionRatio >= ENTER_RATIO) el.dataset.enter = 'play';
        el.dataset.live = live ? 'on' : 'off';
      },
      { threshold: [0, ENTER_RATIO] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={style}>
      <style href="motion-stage-pause" precedence="default">
        {PAUSE}
      </style>
      {children}
    </div>
  );
}
