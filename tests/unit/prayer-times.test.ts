import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Json, PrayerTimesMap, Screen } from '@/types/database';

const FETCHED: PrayerTimesMap = {
  fajr: '05:51',
  sunrise: '07:40',
  dhuhr: '12:16',
  asr: '14:07',
  maghrib: '16:42',
  isha: '18:31',
};

/** Yesterday's times, as the last successful fetch wrote them back. */
const STORED: PrayerTimesMap = { ...FETCHED, isha: '18:33' };

let fetchError: Error | null = null;
const writes: Json[] = [];

vi.mock('@/lib/prayer-sources', () => ({
  fetchPrayerTimes: async () => {
    if (fetchError) throw fetchError;
    return FETCHED;
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      update: (row: { prayer_times: Json }) => ({
        eq: async () => {
          writes.push(row.prayer_times);
          return { error: null };
        },
      }),
    }),
  }),
}));

const { resolveTodayTimes } = await import('@/lib/prayer-times');

function screen(patch: Partial<Screen>): Screen {
  return {
    id: '755a07f7-7ca2-4c01-9d32-27037af84eea',
    prayer_times: STORED,
    locale: 'sv',
    display_text: {},
    prayer_source: 'islamiska_forbundet',
    prayer_source_config: { city: 'Göteborg' },
    theme: 'default',
    theme_config: {},
    display_config: {},
    configured: true,
    pin: null,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    last_seen_at: null,
    ...patch,
  };
}

describe('resolveTodayTimes', () => {
  beforeEach(() => {
    fetchError = null;
    writes.length = 0;
  });

  it("shows the source's times when nothing is fixed", async () => {
    await expect(resolveTodayTimes(screen({}))).resolves.toEqual(FETCHED);
  });

  it("lays the mosque's fixed times over the fetched ones", async () => {
    const fixed = screen({ display_config: { fixedTimes: { isha: '19:00' } } });
    await expect(resolveTodayTimes(fixed)).resolves.toEqual({ ...FETCHED, isha: '19:00' });
  });

  it('writes back what the source said, never the fixed times', async () => {
    await resolveTodayTimes(screen({ display_config: { fixedTimes: { isha: '19:00' } } }));
    expect(writes).toEqual([FETCHED]);
  });

  it('keeps the fixed times when the source is unreachable', async () => {
    fetchError = new Error('timeout');
    const fixed = screen({ display_config: { fixedTimes: { isha: '19:00' } } });
    await expect(resolveTodayTimes(fixed)).resolves.toEqual({ ...STORED, isha: '19:00' });
  });

  it('ignores a malformed fixed time instead of showing it', async () => {
    const broken = screen({ display_config: { fixedTimes: { isha: '7pm' } } });
    await expect(resolveTodayTimes(broken)).resolves.toEqual(FETCHED);
  });
});
