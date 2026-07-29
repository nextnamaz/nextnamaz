import type { PrayerTimeEntry } from '@/types/prayer';
import type { DisplayLocale } from '@/lib/display-locale';
import { DEFAULT_TRANSLATIONS } from '@/lib/locale/presets';

/**
 * Fixed sample data for theme previews — the settings thumbnails and the
 * landing-page showcase. Static on purpose: a preview must look the same
 * whatever the real screen is configured to show.
 */
export const PREVIEW_PRAYERS: PrayerTimeEntry[] = [
  { name: 'fajr', displayName: 'Fajr', time: '05:30', iqamahTime: '05:50' },
  { name: 'sunrise', displayName: 'Sunrise', time: '07:00' },
  { name: 'dhuhr', displayName: 'Dhuhr', time: '12:30', iqamahTime: '12:45' },
  { name: 'asr', displayName: 'Asr', time: '15:45', iqamahTime: '16:00' },
  { name: 'maghrib', displayName: 'Maghrib', time: '19:30', iqamahTime: '19:40' },
  { name: 'isha', displayName: 'Isha', time: '21:00', iqamahTime: '21:15' },
];

export const PREVIEW_LOCALE: DisplayLocale = {
  prayerNames: {
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
  },
  labels: DEFAULT_TRANSLATIONS.en.labels,
  use24Hour: true,
  showSeconds: true,
  dateFormat: 'DD/MM/YYYY',
  timezone: 'auto',
  locale: 'en',
};
