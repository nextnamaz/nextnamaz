'use client';

import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Stagger offset in ms, for siblings that should arrive in sequence. */
  delay?: number;
  className?: string;
}

/**
 * Fades and lifts its children in as they scroll into view. Once.
 *
 * Built on IntersectionObserver and two CSS rules rather than a motion
 * library: this page needs an entrance, not a physics engine. Two properties
 * of the design are deliberate.
 *
 * Nothing is ever hidden before the observer first reports, so if JavaScript
 * fails the page is simply static. And anything already on screen at that
 * point is left alone, so the fold never flashes empty and then fills in.
 *
 * The on-screen test reads the observer's first report rather than calling
 * getBoundingClientRect() at mount, which forced a layout pass per Reveal.
 *
 * Reduced motion is honoured in the stylesheet (see globals.css), so this
 * component does not need to know about it.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let pending = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (!pending) {
          // rootBounds is empty for a display:none target; fall back to the viewport.
          const fold = (entry.rootBounds?.height || window.innerHeight) * 0.92;
          if (entry.isIntersecting || entry.boundingClientRect.top < fold) {
            io.disconnect();
            return;
          }
          pending = true;
          el.dataset.reveal = 'pending';
          return;
        }
        if (!entry.isIntersecting) return;
        el.dataset.reveal = 'in';
        io.disconnect();
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}
