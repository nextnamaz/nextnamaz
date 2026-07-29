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

import { AndalusiTheme, andalusiDefinition } from './andalusi';
import { DefaultTheme, defaultDefinition } from './default';
import { ManuscriptTheme, manuscriptDefinition } from './manuscript';
import { ZellijTheme, zellijDefinition } from './zellij';

export { AndalusiTheme, DefaultTheme, ManuscriptTheme, ZellijTheme };

export const THEME_REGISTRY: Record<string, ThemeDefinition> = {
  andalusi: andalusiDefinition,
  manuscript: manuscriptDefinition,
  zellij: zellijDefinition,
  default: defaultDefinition,
};
