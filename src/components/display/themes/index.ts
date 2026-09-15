import type { ComponentType } from 'react';
import type { PrayerTimeEntry } from '@/types/prayer';
import type { DisplayLocale } from '@/lib/display-locale';

export interface ThemeProps {
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
  component: ComponentType<ThemeProps>;
  fields: ThemeFieldDefinition[];
  defaultConfig: Record<string, string | number | boolean>;
}

// --- Theme imports ---

import { DefaultTheme, defaultDefinition } from './default';
import { NightTheme, nightDefinition } from './night';

export { DefaultTheme, NightTheme };

export const THEME_REGISTRY: Record<string, ThemeDefinition> = {
  night: nightDefinition,
  default: defaultDefinition,
};

/**
 * Retired theme ids, pointed at what replaced them. Screens saved before a
 * theme was removed keep working and pick up the replacement instead of
 * silently dropping back to Default.
 */
const THEME_ALIASES: Record<string, string> = {
  mihrab: 'night',
};

/** Resolve a saved theme id, following aliases. Returns undefined if unknown. */
export function resolveTheme(id: string): ThemeDefinition | undefined {
  return THEME_REGISTRY[id] ?? THEME_REGISTRY[THEME_ALIASES[id] ?? ''];
}
