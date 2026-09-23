'use client';

import dynamic from 'next/dynamic';
import { resolveDisplayLocale } from '@/lib/display-locale';
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
 * running the real display in the page's language. Both hang still: the
 * portrait set is simply there, as it would be by the entrance.
 */
export function OrientationArt({ landscape, portrait, display }: OrientationArtProps) {
  const locale = resolveDisplayLocale(display);

  return (
    <div
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
        <TvFrame portrait>
          <DemoDisplay locale={locale} portrait />
        </TvFrame>
        <figcaption className="mt-5 text-center text-[13px] font-medium text-muted-foreground sm:text-sm">{portrait}</figcaption>
      </figure>
    </div>
  );
}
