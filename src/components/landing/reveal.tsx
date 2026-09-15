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
 * Nothing is ever hidden before this effect runs, so if JavaScript fails the
 * page is simply static. And anything already on screen at mount is left
 * alone, so the fold never flashes empty and then fills in.
 *
 * Reduced motion is honoured in the stylesheet (see globals.css), so this
 * component does not need to know about it.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    el.dataset.reveal = 'pending';
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
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
