import type { ComponentType } from 'react';
import type { PrayerTimeEntry } from '@/types/prayer';

export interface ThemeProps {
  mosqueName: string;
  prayers: PrayerTimeEntry[];
  nextPrayer: PrayerTimeEntry | null;
  config: Record<string, unknown>;
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

import { ClassicTheme, classicDefinition } from './classic';
import { AndalusTheme, andalusDefinition } from './andalus';
import { DefaultTheme, defaultDefinition } from './default';
import { LightTheme, lightDefinition } from './light';
import { ModernTheme, modernDefinition } from './modern';
import { RamadanTheme, ramadanDefinition } from './ramadan';

export { ClassicTheme, AndalusTheme, DefaultTheme, LightTheme, ModernTheme, RamadanTheme };

export const THEME_REGISTRY: Record<string, ThemeDefinition> = {
  classic: classicDefinition,
  andalus: andalusDefinition,
  default: defaultDefinition,
  light: lightDefinition,
  modern: modernDefinition,
  ramadan: ramadanDefinition,
};
