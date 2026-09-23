'use client';

import dynamic from 'next/dynamic';
import { TvFrame } from './tv-frame';
import { ScreenPlaceholder } from './screen-placeholder';
import { LANDING_COPY } from '@/lib/landing-copy';
import { resolveDisplayLocale } from '@/lib/display-locale';
import type { SupportedLocale } from '@/types/locale';

/* Client-only: the display reads the visitor's clock. The frame renders on
   the server, so only the picture swaps in, from blocks in its own colours. */
const DemoDisplay = dynamic(() => import('./demo-display').then((m) => m.DemoDisplay), {
  ssr: false,
  loading: () => <ScreenPlaceholder />,
});

interface ShowcaseWrapperProps {
  /** Text alternative for the set; English on pages that have no copy of their own (/s). */
  alt?: string;
  display?: SupportedLocale;
}

/** The product, as the hero visual: the set on the wall running the real display. */
export function ShowcaseWrapper({ alt = LANDING_COPY.hero.demoAlt, display = 'en' }: ShowcaseWrapperProps) {
  return (
    <div role="img" aria-label={alt}>
      <TvFrame>
        <DemoDisplay locale={resolveDisplayLocale(display)} />
      </TvFrame>
    </div>
  );
}
