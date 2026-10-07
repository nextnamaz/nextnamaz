import type { ComponentType } from 'react';
import type { PrayerTimeEntry } from '@/types/prayer';
import type { DisplayLocale } from '@/lib/display-locale';
import type { ScreenPlace } from '@/lib/screen-place';

export interface ThemeProps {
  prayers: PrayerTimeEntry[];
  nextPrayer: PrayerTimeEntry | null;
  config: Record<string, unknown>;
  isPortrait: boolean;
  locale: DisplayLocale;
  /**
   * The prayer that began moments ago, if any. A theme shows it as started
   * where it would otherwise count down to `nextPrayer`.
   */
  startingPrayer?: PrayerTimeEntry | null;
  /** Where the screen is, when known. Only a theme that draws the Earth asks. */
  place?: ScreenPlace | null;
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
import { SkyTheme, skyDefinition } from './sky';
import { PaperTheme, paperDefinition } from './paper';
import { IvoryTheme, ivoryDefinition } from './ivory';
import { GlobeTheme, globeDefinition } from './globe';

export { DefaultTheme, SkyTheme, PaperTheme, IvoryTheme, GlobeTheme };

export const THEME_REGISTRY: Record<string, ThemeDefinition> = {
  sky: skyDefinition,
  paper: paperDefinition,
  ivory: ivoryDefinition,
  globe: globeDefinition,
  default: defaultDefinition,
};

/**
 * Retired theme ids, pointed at what replaced them. Screens saved before a
 * theme was removed keep working and pick up the replacement instead of
 * silently dropping back to Default.
 */
const THEME_ALIASES: Record<string, string> = {
  mihrab: 'sky',
  night: 'sky',
};

/** Resolve a saved theme id, following aliases. Returns undefined if unknown. */
export function resolveTheme(id: string): ThemeDefinition | undefined {
  // Own keys only: the id comes from the database, and an inherited name like
  // 'constructor' would otherwise resolve to a function and blank the TV.
  const own = (key: string) => (Object.hasOwn(THEME_REGISTRY, key) ? THEME_REGISTRY[key] : undefined);
  return own(id) ?? (Object.hasOwn(THEME_ALIASES, id) ? own(THEME_ALIASES[id] ?? '') : undefined);
}
