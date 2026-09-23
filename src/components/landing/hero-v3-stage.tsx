'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/** The fixed navbar over the hero, in px (h-16). */
const NAV_PX = 64;

/**
 * Wide and tall enough to pin the hero and bring the set forward. Keep in
 * step with the same query in CHOREOGRAPHY.
 */
const PIN_QUERY = '(prefers-reduced-motion: no-preference) and (min-width: 64rem) and (min-height: 40rem)';

/** Share of the pinned track spent bringing the set forward; the rest holds it there. */
const MOVE_SHARE = 0.7;
/** Of that, the part in which the words fade, and the part the set waits for them. */
const WORDS_SHARE = 0.3;
const SET_DELAY = 0.08;

/** Outer height of the set for its width: the 16:9 picture plus its bezel. */
const SET_RATIO = 0.58;

/**
 * Scroll choreography, from two variables the stage publishes: --hero-e for
 * the set (0 to 1, eased) and --hero-c for the words (0 to 1, done early).
 * The set starts tilted back a little and straightens as the page moves.
 * Where the hero pins (PIN_QUERY), the words give way first, then the set
 * comes forward: to the middle of the screen and nearly its full width, where
 * it holds before the page carries on. --hero-dx, --hero-dy and
 * --hero-grow are measured, so the set lands in the middle from either
 * column. Transform and opacity only. Reduced motion holds the set upright
 * and still, and the hero does not pin.
 */
const CHOREOGRAPHY = `
.hero3-tv {
  transform-origin: 50% 50%;
  transform:
    translate3d(calc(var(--hero-dx, 0px) * var(--hero-e)), calc(var(--hero-dy, 0px) * var(--hero-e)), 0)
    perspective(1800px)
    rotateX(calc((1 - var(--hero-e)) * 14deg))
    scale(calc(0.96 + (var(--hero-grow, 1) - 0.96) * var(--hero-e)));
}
@media ${PIN_QUERY} {
  .hero3-track { height: 190svh; }
  .hero3-stage { position: sticky; top: 0; height: 100svh; min-height: 0; }
  .hero3-copy {
    opacity: calc(1 - var(--hero-c));
    transform: translateY(calc(var(--hero-c) * -36px));
  }
  .hero3-stage[data-away] .hero3-copy { visibility: hidden; }
}
/* The greeting: the set floats up into place while its light blooms behind it. */
@media (prefers-reduced-motion: no-preference) {
  .hero3-arrive { animation: hero3-arrive 1000ms cubic-bezier(0.16, 1, 0.3, 1) 220ms both; }
  .hero3-bloom { animation: hero3-bloom 1600ms cubic-bezier(0.16, 1, 0.3, 1) 320ms both; }
}
@keyframes hero3-arrive {
  from { opacity: 0; translate: 0 40px; scale: 0.95; }
}
@keyframes hero3-bloom {
  from { opacity: 0; scale: 0.6; }
}
@media (prefers-reduced-motion: reduce) {
  .hero3-tv { transform: none; }
}
`;

/** Without JavaScript nothing moves the set, so it hangs upright and the hero does not pin: no empty scroll. */
const WITHOUT_SCRIPT =
  '.hero3-track{height:auto}.hero3-stage{position:relative;height:auto;min-height:min(100svh,64rem)}.hero3-tv{transform:none}';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** Smoothstep: starts and lands softly. */
const ease = (t: number) => t * t * (3 - 2 * t);

interface HeroStageProps {
  children: ReactNode;
  /** The section: the scroll track the stage pins inside. */
  className?: string;
  stageClassName?: string;
  labelledBy: string;
}

/**
 * The hero's section and the stage inside it. Publishes how far the visitor
 * has scrolled through the hero as CSS variables, once a frame at most, so
 * nothing re-renders while scrolling. The element marked data-hero-tv is the
 * set CHOREOGRAPHY moves. Under reduced motion nothing is published.
 */
export function HeroStage({ children, className, stageClassName, labelledBy }: HeroStageProps) {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const tv = stage?.querySelector<HTMLElement>('[data-hero-tv]');
    if (!track || !stage || !tv || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const pin = window.matchMedia(PIN_QUERY);

    /** Where the pinned set has to go to sit in the middle, a little larger. Offsets ignore transforms. */
    const measure = () => {
      if (!pin.matches) {
        stage.style.setProperty('--hero-dx', '0px');
        stage.style.setProperty('--hero-dy', '0px');
        stage.style.setProperty('--hero-grow', '1');
        return;
      }
      let x = 0;
      let y = 0;
      for (let n: HTMLElement | null = tv; n && n !== stage; n = n.offsetParent as HTMLElement | null) {
        x += n.offsetLeft;
        y += n.offsetTop;
      }
      const w = tv.offsetWidth;
      const h = tv.offsetHeight;
      if (!w) return;
      // Forward and centred, but modest: a little larger than in the hero, never filling the window.
      const width = Math.min(window.innerWidth * 0.6, (window.innerHeight - NAV_PX - 180) / SET_RATIO);
      const left = stage.getBoundingClientRect().left;
      stage.style.setProperty('--hero-dx', `${(window.innerWidth / 2 - (left + x + w / 2)).toFixed(1)}px`);
      stage.style.setProperty('--hero-dy', `${(NAV_PX + (window.innerHeight - NAV_PX) / 2 - (y + h / 2)).toFixed(1)}px`);
      stage.style.setProperty('--hero-grow', Math.max(1, width / w).toFixed(4));
    };

    let frame = 0;
    const update = () => {
      frame = 0;
      const pinned = pin.matches;
      let t: number;
      if (pinned) {
        const rect = track.getBoundingClientRect();
        const range = rect.height - window.innerHeight;
        t = range > 0 ? clamp01(-rect.top / range / MOVE_SHARE) : 0;
      } else {
        t = clamp01(window.scrollY / (window.innerHeight * 0.5));
      }
      const c = pinned ? clamp01(t / WORDS_SHARE) : 0;
      const e = ease(pinned ? clamp01((t - SET_DELAY) / (1 - SET_DELAY)) : t);
      stage.style.setProperty('--hero-e', e.toFixed(4));
      stage.style.setProperty('--hero-c', c.toFixed(4));
      // Once the words have faded, they leave the tab order and the pointer's way too.
      stage.toggleAttribute('data-away', c >= 1);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // The stage resizes with the window and when the fonts arrive; both move the set.
    const ro = new ResizeObserver(() => {
      measure();
      schedule();
    });
    ro.observe(stage);
    window.addEventListener('scroll', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('scroll', schedule);
    };
  }, []);

  return (
    <section ref={trackRef} aria-labelledby={labelledBy} className={`hero3-track ${className ?? ''}`}>
      <style>{CHOREOGRAPHY}</style>
      <noscript>
        <style>{WITHOUT_SCRIPT}</style>
      </noscript>
      {/* Starts at the top of the choreography, so the first paint matches the first frame. */}
      <div ref={stageRef} className={`hero3-stage ${stageClassName ?? ''}`} style={{ '--hero-e': 0, '--hero-c': 0 } as CSSProperties}>
        {children}
      </div>
    </section>
  );
}
