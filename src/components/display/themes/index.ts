import type { ComponentType } from 'react';
import type { PrayerTimeEntry } from '@/types/prayer';
import type { DisplayLocale } from '@/lib/display-locale';

export interface ThemeProps {
  mosqueName: string;
  prayers: PrayerTimeEntry[];
  nextPrayer: PrayerTimeEntry | null;
  config: Record<string, unknown>;
  isPortrait: boolean;
  locale: DisplayLocale;
}

// --- Theme registry types ---

export interface ThemeFieldOption {
  value: string;
  label: string;
}

export interface ThemeFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'switch' | 'number';
  defaultValue: string | number | boolean;
  description?: string;
  options?: ThemeFieldOption[];
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  preview: string;
  component: ComponentType<ThemeProps>;
  fields: ThemeFieldDefinition[];
  defaultConfig: Record<string, string | number | boolean>;
}

// --- Theme imports ---

import { AndalusTheme, andalusDefinition } from './andalus';
import { DefaultTheme, defaultDefinition } from './default';

export { AndalusTheme, DefaultTheme };

export const THEME_REGISTRY: Record<string, ThemeDefinition> = {
  default: defaultDefinition,
  andalus: andalusDefinition,
};
