'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface HeaderBarProps {
  /** Accessible name of the navigation landmark. */
  label: string;
  children: ReactNode;
}

/**
 * The fixed navbar's shell: clear over the hero, a white bar once the page
 * has moved. An 8px sentinel at the top of the document tells it which, so it
 * renders once when the page leaves the top and once when it returns, never
 * per scroll event.
 */
export function HeaderBar({ label, children }: HeaderBarProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry) setScrolled(!entry.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden className="pointer-events-none absolute start-0 top-0 h-2 w-px" />
      <nav
        aria-label={label}
        data-scrolled={scrolled || undefined}
        className="fixed top-0 z-50 w-full border-b border-transparent px-6 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-200 ease-out motion-reduce:transition-none data-scrolled:border-black/6 data-scrolled:bg-white/85 data-scrolled:shadow-[0_1px_12px_-6px_rgba(38,24,10,0.12)] data-scrolled:backdrop-blur-md"
      >
        {children}
      </nav>
    </>
  );
}
