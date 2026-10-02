import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { THEME_REGISTRY, resolveTheme } from '@/components/display/themes';
import { formFromScreen } from '@/components/settings/settings-shared';
import { resolveDisplayLocale } from '@/lib/display-locale';
import { screenSettingsSchema } from '@/lib/screen-settings';
import type { Screen } from '@/types/database';
import type { PrayerName, PrayerTimeEntry } from '@/types/prayer';

const entry = (name: PrayerName, time: string): PrayerTimeEntry => ({ name, displayName: name, time });

const DAY = [
  entry('fajr', '05:21'),
  entry('sunrise', '07:24'),
  entry('dhuhr', '13:04'),
  entry('asr', '15:52'),
  entry('maghrib', '18:41'),
  entry('isha', '20:29'),
];

/** Times a bad source or a hand-typed day could leave on a screen. */
const BROKEN = [
  entry('fajr', ''),
  entry('sunrise', 'soon'),
  entry('dhuhr', '25:99'),
  entry('asr', '15:52'),
  entry('maghrib', '04:00'),
  entry('isha', '00:30'),
];

/** theme_config as production screens hold it, keys of retired themes included, and junk. */
const CONFIGS: Record<string, unknown>[] = [
  {},
  { colorScheme: 'ocean', displayText: 'بسم الله', mode: 'dark' },
  { ayahTop: 'x', ayahBottom: 'y', backdrop: 'stars', palette: 'mint', showSeconds: true },
  { accent: 'mint', showSeconds: true },
  { color: 'constructor', roundels: '__proto__', verse: 42, arabicNames: 'yes', details: null, mode: {} },
];

const THEME_IDS = [...Object.keys(THEME_REGISTRY), 'night', 'mihrab'];

describe('every theme renders for every screen', () => {
  let errors: unknown[][];
  beforeEach(() => {
    errors = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args);
    });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  for (const id of THEME_IDS) {
    it(`${id}: any saved config, both orientations, LTR and RTL, good and broken times`, () => {
      const def = resolveTheme(id);
      expect(def).toBeDefined();
      if (!def) return;
      const Theme = def.component;
      for (const config of CONFIGS) {
        for (const isPortrait of [false, true]) {
          for (const lang of ['en', 'ar', 'bs']) {
            for (const [prayers, next] of [
              [DAY, DAY[3] ?? null],
              [BROKEN, null],
            ] as const) {
              const { container, unmount } = render(
                <div style={{ width: 1280, height: 720 }}>
                  <Theme
                    prayers={[...prayers]}
                    nextPrayer={next}
                    config={{ ...def.defaultConfig, ...config }}
                    isPortrait={isPortrait}
                    locale={resolveDisplayLocale(lang)}
                  />
                </div>
              );
              expect(container.querySelector(`[data-theme="${def.id}"]`)).not.toBeNull();
              unmount();
            }
          }
        }
      }
      expect(errors).toEqual([]);
    });
  }
});

const screen = (theme: string): Screen => ({
  id: '00000000-0000-4000-8000-000000000000',
  prayer_times: {},
  locale: 'en',
  display_text: {},
  prayer_source: 'adhan',
  prayer_source_config: {},
  theme,
  theme_config: {},
  display_config: {},
  configured: true,
  pin: null,
  created_at: '2026-10-03T00:00:00Z',
  updated_at: '2026-10-03T00:00:00Z',
  last_seen_at: null,
});

describe('saved theme ids', () => {
  it('every registered theme resolves to itself', () => {
    for (const id of Object.keys(THEME_REGISTRY)) expect(resolveTheme(id)?.id).toBe(id);
  });

  it('retired themes resolve to their successor, so their screens keep a look of their own', () => {
    expect(resolveTheme('night')?.id).toBe('sky');
    expect(resolveTheme('mihrab')?.id).toBe('sky');
  });

  it('unknown and inherited names resolve to nothing, so the TV falls back to Default', () => {
    for (const id of ['atmospheric', 'constructor', '__proto__', 'toString', 'hasOwnProperty', '']) {
      expect(resolveTheme(id)).toBeUndefined();
    }
  });

  it('opens a screen’s settings on the theme its TV is showing', () => {
    expect(formFromScreen(screen('ivory')).theme).toBe('ivory');
    expect(formFromScreen(screen('mihrab')).theme).toBe('sky');
    expect(formFromScreen(screen('night')).theme).toBe('sky');
    expect(formFromScreen(screen('atmospheric')).theme).toBe('default');
  });

  it('can save every registered theme', () => {
    for (const id of Object.keys(THEME_REGISTRY)) {
      expect(screenSettingsSchema.shape.theme.safeParse(id).success, `${id} is not accepted on save`).toBe(true);
    }
  });
});
