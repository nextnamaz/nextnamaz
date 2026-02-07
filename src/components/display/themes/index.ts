import type { PrayerTimeEntry } from '@/types/prayer';

export interface ThemeProps {
  mosqueName: string;
  prayers: PrayerTimeEntry[];
  nextPrayer: PrayerTimeEntry | null;
  config: Record<string, unknown>;
}

export { ClassicTheme } from './classic';
export { AndalusTheme } from './andalus';
