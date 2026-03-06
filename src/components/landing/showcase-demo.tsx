'use client';

import { useMemo } from 'react';
import { DefaultTheme } from '@/components/display/themes/default';
import type { ThemeProps } from '@/components/display/themes';
import type { PrayerTimeEntry } from '@/types/prayer';
import type { DisplayLocale } from '@/lib/display-locale';
import { getNextPrayer } from '@/types/prayer';

const SAMPLE_PRAYERS: PrayerTimeEntry[] = [
  { name: 'fajr', displayName: 'Fajr', time: '05:30', iqamahTime: '05:50' },
  { name: 'sunrise', displayName: 'Sunrise', time: '07:00' },
  { name: 'dhuhr', displayName: 'Dhuhr', time: '12:30', iqamahTime: '12:45' },
  { name: 'asr', displayName: 'Asr', time: '15:45', iqamahTime: '16:00' },
  { name: 'maghrib', displayName: 'Maghrib', time: '19:30', iqamahTime: '19:40' },
  { name: 'isha', displayName: 'Isha', time: '21:00', iqamahTime: '21:15' },
];

const SAMPLE_LOCALE: DisplayLocale = {
  prayerNames: {
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
  },
  labels: { prayer: 'Prayer', begins: 'Begins', iqamah: 'Iqamah', next: 'Next...' },
  use24Hour: true,
  showSeconds: true,
  dateFormat: 'DD/MM/YYYY',
  timezone: 'auto',
  locale: 'en',
};

export function ShowcaseDemo() {
  const nextPrayer = useMemo(() => getNextPrayer(SAMPLE_PRAYERS), []);

  const props: ThemeProps = {
    mosqueName: 'Al-Noor Mosque',
    prayers: SAMPLE_PRAYERS,
    nextPrayer,
    config: { mode: 'light', colorScheme: 'classic', displayText: 'بسم الله الرحمن الرحيم' },
    isPortrait: false,
    locale: SAMPLE_LOCALE,
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* TV frame */}
      <div className="relative bg-[#1a1a1a] rounded-4xl p-3 pb-6 shadow-2xl">
        {/* Screen bezel */}
        <div
          className="relative w-full rounded-lg overflow-hidden"
          style={{ aspectRatio: '16/9', containerType: 'size' as React.CSSProperties['containerType'] }}
        >
          <DefaultTheme {...props} />
        </div>
        {/* Stand indicator */}
        <div className="flex justify-center mt-3 gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
      </div>
    </div>
  );
}
