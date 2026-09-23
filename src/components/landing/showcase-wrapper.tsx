'use client';

import dynamic from 'next/dynamic';
import { TvFrame } from './tv-frame';
import { ScreenPlaceholder } from './screen-placeholder';
import { LANDING_COPY } from '@/lib/landing-copy';

/* Client-only: the display reads the visitor's clock. The frame renders on
   the server, so only the picture swaps in, from blocks in its own colours. */
const DemoDisplay = dynamic(() => import('./demo-display').then((m) => m.DemoDisplay), {
  ssr: false,
  loading: () => <ScreenPlaceholder />,
});

/** The product, as the hero visual: the set on the wall running the real display. */
export function ShowcaseWrapper() {
  return (
    <div role="img" aria-label={LANDING_COPY.hero.demoAlt}>
      <TvFrame>
        <DemoDisplay />
      </TvFrame>
    </div>
  );
}
