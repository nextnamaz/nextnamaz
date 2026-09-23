'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { resolveDisplayLocale } from '@/lib/display-locale';
import { cn } from '@/lib/utils';
import type { SupportedLocale } from '@/types/locale';
import { TvFrame } from './tv-frame';
import { ScreenPlaceholder } from './screen-placeholder';

/* Client-only: the displays read the visitor's clock. */
const DemoDisplay = dynamic(() => import('./demo-display').then((m) => m.DemoDisplay), {
  ssr: false,
  loading: () => <ScreenPlaceholder />,
});

interface OrientationArtProps {
  landscape: string;
  portrait: string;
  display: SupportedLocale;
}

/**
 * Two sets on one wall: one the usual way, one turned on its side, both
 * running the real display in the page's language. The second arrives lying
 * down and turns upright as the wall scrolls into view, so the idea lands
 * without a word. Under reduced motion it is simply upright.
 */
export function OrientationArt({ landscape, portrait, display }: OrientationArtProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [turned, setTurned] = useState(false);
  const locale = resolveDisplayLocale(display);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setTurned(true);
        io.disconnect();
      },
      { threshold: 0.45 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      dir="ltr"
      className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,0.62fr)] items-center gap-6 sm:gap-10 lg:gap-16"
    >
      <figure>
        <TvFrame>
          <DemoDisplay locale={locale} />
        </TvFrame>
        <figcaption className="mt-5 text-center text-[13px] font-medium text-muted-foreground sm:text-sm">{landscape}</figcaption>
      </figure>

      <figure>
        <div
          className={cn(
            'origin-center transition-[rotate,scale,opacity] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:rotate-0 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none',
            turned ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-[0.78] opacity-60'
          )}
        >
          <TvFrame portrait>
            <DemoDisplay locale={locale} portrait />
          </TvFrame>
        </div>
        <figcaption className="mt-5 text-center text-[13px] font-medium text-muted-foreground sm:text-sm">{portrait}</figcaption>
      </figure>
    </div>
  );
}
