import type { PrayerTimeEntry } from '@/types/prayer';

export interface ThemeProps {
  mosqueName: string;
  prayers: PrayerTimeEntry[];
  nextPrayer: PrayerTimeEntry | null;
  config: Record<string, unknown>;
}

export { ClassicTheme } from './classic';
export { ModernTheme } from './modern';
export { LightTheme } from './light';
export { RamadanTheme } from './ramadan';
