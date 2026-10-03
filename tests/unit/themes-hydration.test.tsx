import { act } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { THEME_REGISTRY } from '@/components/display/themes';
import { resolveDisplayLocale } from '@/lib/display-locale';
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

describe('a TV loaded just after midnight', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  // The server renders in UTC, hours behind a European TV: a Pi rebooting at
  // 00:30 gets a page the server rendered on the day before.
  for (const [id, def] of Object.entries(THEME_REGISTRY)) {
    it(`${id} shows the TV's own date, not the server's`, async () => {
      vi.useFakeTimers();
      const locale = resolveDisplayLocale('bs');
      const ui = <def.component prayers={DAY} nextPrayer={null} config={def.defaultConfig} isPortrait={false} locale={locale} />;

      vi.setSystemTime(new Date(2026, 9, 2, 23, 59, 50));
      const container = document.createElement('div');
      container.innerHTML = renderToString(ui);
      document.body.appendChild(container);

      vi.setSystemTime(new Date(2026, 9, 3, 0, 31, 0));
      await act(async () => {
        hydrateRoot(container, ui);
      });
      await act(async () => {
        vi.advanceTimersByTime(1500);
      });

      const text = container.textContent ?? '';
      expect(text).not.toMatch(/02\/10\/2026|2\. oktobar 2026/);
      expect(text).toMatch(/03\/10\/2026|3\. oktobar 2026/);
    });
  }
});
