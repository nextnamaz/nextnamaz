'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { DefaultTheme } from '@/components/display/themes/default';
import { NightTheme } from '@/components/display/themes/night';
import type { ThemeProps } from '@/components/display/themes';
import { PREVIEW_PRAYERS, PREVIEW_LOCALE } from '@/lib/theme-preview';
import { getNextPrayer } from '@/types/prayer';
import { TvFrame } from './tv-frame';
import { PhoneFrame } from './phone-frame';

/** How long each theme holds before the TV crosses to the other. */
const HOLD_MS = 6_000;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );
}

/**
 * The product, as the hero visual.
 *
 * A television running the real display component, crossing between the two
 * themes every few seconds. That one animation carries information: it says
 * the display has themes, without a line of copy. Beside it, a phone showing
 * a photograph of the real settings page. Both are the actual product, not
 * an illustration of it.
 *
 * Under reduced motion the TV simply holds the first theme.
 */
export function ShowcaseDemo() {
  const nextPrayer = useMemo(() => getNextPrayer(PREVIEW_PRAYERS), []);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setActive((i) => (i + 1) % 2), HOLD_MS);
    return () => clearInterval(id);
  }, [reduced]);

  const shared: Omit<ThemeProps, 'config'> = {
    prayers: PREVIEW_PRAYERS,
    nextPrayer,
    isPortrait: false,
    locale: PREVIEW_LOCALE,
  };

  return (
    <div className="flex items-end gap-3 sm:gap-4">
      <div className="min-w-0 flex-1">
        <TvFrame>
          <div
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: active === 0 ? 1 : 0 }}
            aria-hidden={active !== 0}
          >
            <DefaultTheme
              {...shared}
              config={{ mode: 'light', colorScheme: 'classic', displayText: 'بسم الله الرحمن الرحيم' }}
            />
          </div>
          <div
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: active === 1 ? 1 : 0 }}
            aria-hidden={active !== 1}
          >
            <NightTheme {...shared} config={{ accent: 'amber' }} />
          </div>
        </TvFrame>
      </div>

      {/* Sits beside the set, not over it: the live demo stays fully visible. */}
      <PhoneFrame className="mb-5 w-[19%] min-w-[74px] max-w-[124px] shrink-0 -rotate-3">
        <Image
          src="/landing/settings-phone.png"
          alt="The settings page on a phone, showing the prayer times tab"
          fill
          sizes="124px"
          priority
          className="object-cover object-top"
        />
      </PhoneFrame>
    </div>
  );
}
