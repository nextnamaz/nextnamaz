'use client';

import { useMemo } from 'react';
import { DefaultTheme } from '@/components/display/themes/default';
import { PREVIEW_PRAYERS, PREVIEW_LOCALE } from '@/lib/theme-preview';
import { getNextPrayer } from '@/types/prayer';
import { TvFrame } from './tv-frame';

export function ShowcaseDemo() {
  const nextPrayer = useMemo(() => getNextPrayer(PREVIEW_PRAYERS), []);

  return (
    <div className="max-w-4xl mx-auto">
      <TvFrame>
        <DefaultTheme
          prayers={PREVIEW_PRAYERS}
          nextPrayer={nextPrayer}
          config={{ mode: 'light', colorScheme: 'classic', displayText: 'بسم الله الرحمن الرحيم' }}
          isPortrait={false}
          locale={PREVIEW_LOCALE}
        />
      </TvFrame>
    </div>
  );
}
