import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrayerTimes } from '../use-prayer-times';
import type { MosqueSettings, PrayerTimesMap } from '@/types/database';
import type { PrayerConfigMap } from '@/types/prayer-config';

// Mock display-cache module
vi.mock('@/lib/display-cache', () => ({
  getTodaysPrayerTimes: vi.fn(),
  todayDateString: vi.fn(),
  getMosqueTimezone: vi.fn(),
}));

import { getTodaysPrayerTimes, todayDateString } from '@/lib/display-cache';

const mockGetTodaysPrayerTimes = vi.mocked(getTodaysPrayerTimes);
const mockTodayDateString = vi.mocked(todayDateString);

const MOCK_TIMES: PrayerTimesMap = {
  fajr: '05:30',
  sunrise: '07:00',
  dhuhr: '13:00',
  asr: '16:00',
  maghrib: '19:30',
  isha: '21:00',
};

function createSettings(overrides?: Partial<MosqueSettings>): MosqueSettings {
  return {
    mosque_id: 'test-id',
    prayer_times: MOCK_TIMES,
    prayer_source: 'manual',
    prayer_source_config: {} as MosqueSettings['prayer_source_config'],
    prayer_config: {} as PrayerConfigMap,
    locale: 'en',
    display_text: {},
    metadata: {},
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('usePrayerTimes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockTodayDateString.mockReturnValue('2026-02-10');
    mockGetTodaysPrayerTimes.mockReturnValue(MOCK_TIMES);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('derives correct entries from manual settings', () => {
    const settings = createSettings();
    const { result } = renderHook(() => usePrayerTimes(settings, 'test-slug', undefined, false));

    expect(result.current.prayers).toHaveLength(6);
    expect(result.current.prayers[0]).toMatchObject({
      name: 'fajr',
      displayName: 'Fajr',
      time: '05:30',
    });
    expect(result.current.prayers[3]).toMatchObject({
      name: 'asr',
      displayName: 'Asr',
      time: '16:00',
    });
  });

  it('recomputes when settings change', () => {
    const settings1 = createSettings();
    const settings2 = createSettings({
      prayer_times: { ...MOCK_TIMES, fajr: '04:45' },
    });

    const altTimes = { ...MOCK_TIMES, fajr: '04:45' };
    mockGetTodaysPrayerTimes
      .mockReturnValueOnce(MOCK_TIMES)
      .mockReturnValueOnce(altTimes);

    const { result, rerender } = renderHook(
      ({ s }) => usePrayerTimes(s, 'test-slug', undefined, false),
      { initialProps: { s: settings1 } },
    );

    expect(result.current.prayers[0].time).toBe('05:30');

    rerender({ s: settings2 });
    expect(result.current.prayers[0].time).toBe('04:45');
  });

  it('picks correct next prayer based on current time', () => {
    // Set time to 14:00 → next prayer should be Asr (16:00)
    vi.setSystemTime(new Date('2026-02-10T14:00:00'));

    const settings = createSettings();
    const { result } = renderHook(() => usePrayerTimes(settings, 'test-slug', undefined, false));

    expect(result.current.nextPrayer).not.toBeNull();
    expect(result.current.nextPrayer!.name).toBe('asr');
  });

  it('recomputes nextPrayer after minute tick', () => {
    // Start at 15:59 → next is asr (16:00)
    vi.setSystemTime(new Date('2026-02-10T15:59:00'));

    const settings = createSettings();
    const { result } = renderHook(() => usePrayerTimes(settings, 'test-slug', undefined, false));

    expect(result.current.nextPrayer!.name).toBe('asr');

    // Advance to 16:01 → next should be maghrib (19:30)
    act(() => {
      vi.setSystemTime(new Date('2026-02-10T16:01:00'));
      vi.advanceTimersByTime(60000);
    });

    expect(result.current.nextPrayer!.name).toBe('maghrib');
  });

  it('handles midnight rollover (todayDateString change)', () => {
    const settings = createSettings();
    mockTodayDateString.mockReturnValue('2026-02-10');

    const nextDayTimes: PrayerTimesMap = {
      fajr: '05:35',
      sunrise: '07:05',
      dhuhr: '13:00',
      asr: '16:00',
      maghrib: '19:25',
      isha: '20:55',
    };

    const { result } = renderHook(() => usePrayerTimes(settings, 'test-slug', undefined, false));

    expect(result.current.prayers[0].time).toBe('05:30');

    // Simulate midnight rollover
    act(() => {
      mockTodayDateString.mockReturnValue('2026-02-11');
      mockGetTodaysPrayerTimes.mockReturnValue(nextDayTimes);
      vi.advanceTimersByTime(30000); // 30s date check interval
    });

    expect(result.current.prayers[0].time).toBe('05:35');
  });

  it('falls back through resolution chain via getTodaysPrayerTimes', () => {
    // getTodaysPrayerTimes implements: adhan → yearly → settings → defaults
    // We verify it's called with the right args, and that the hook uses the result
    const fallbackTimes: PrayerTimesMap = {
      fajr: '05:00',
      sunrise: '06:30',
      dhuhr: '13:00',
      asr: '16:30',
      maghrib: '19:00',
      isha: '20:30',
    };
    mockGetTodaysPrayerTimes.mockReturnValue(fallbackTimes);

    const settings = createSettings({ prayer_source: 'adhan' });
    const { result } = renderHook(() => usePrayerTimes(settings, 'my-slug', 'Europe/London', false));

    // Verify getTodaysPrayerTimes was called with settings and slug
    expect(mockGetTodaysPrayerTimes).toHaveBeenCalledWith(settings, 'my-slug');
    // And the hook renders whatever it returns (the fallback)
    expect(result.current.prayers[0].time).toBe('05:00');
    expect(result.current.prayers[4].time).toBe('19:00');
  });
});
