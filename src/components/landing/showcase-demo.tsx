'use client';

import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { DefaultTheme } from '@/components/display/themes/default';
import { PREVIEW_PRAYERS, PREVIEW_LOCALE } from '@/lib/theme-preview';
import { getNextPrayer } from '@/types/prayer';

export function ShowcaseDemo() {
  const nextPrayer = useMemo(() => getNextPrayer(PREVIEW_PRAYERS), []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* TV frame */}
      <div className="relative bg-[#1a1a1a] rounded-4xl p-3 pb-6 shadow-2xl">
        {/* Screen bezel */}
        <div
          className="relative w-full rounded-lg overflow-hidden"
          style={{ aspectRatio: '16/9', containerType: 'size' as CSSProperties['containerType'] }}
        >
          <DefaultTheme
            prayers={PREVIEW_PRAYERS}
            nextPrayer={nextPrayer}
            config={{ mode: 'light', colorScheme: 'classic', displayText: 'بسم الله الرحمن الرحيم' }}
            isPortrait={false}
            locale={PREVIEW_LOCALE}
          />
        </div>
        {/* Stand indicator */}
        <div className="flex justify-center mt-3 gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
      </div>
    </div>
  );
}
