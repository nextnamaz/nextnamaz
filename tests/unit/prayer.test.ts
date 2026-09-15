import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PRAYER_DISPLAY_NAMES,
  PRAYER_NAMES,
  getNextPrayer,
  prayerTimesMapToEntries,
} from '@/types/prayer';
import type { PrayerName, PrayerTimeEntry } from '@/types/prayer';

function entry(name: PrayerName, time: string): PrayerTimeEntry {
  return { name, displayName: PRAYER_DISPLAY_NAMES[name], time };
}

/** A full day in chronological order — the shape tv-display feeds getNextPrayer. */
const DAY: PrayerTimeEntry[] = [
  entry('fajr', '03:26'),
  entry('sunrise', '04:55'),
  entry('dhuhr', '13:24'),
  entry('asr', '17:43'),
  entry('maghrib', '21:42'),
  entry('isha', '23:50'),
];

const at = (hours: number, minutes: number) => new Date(2026, 6, 30, hours, minutes);

/** getNextPrayer reads the wall clock itself, so every call has to set it first. */
function nextAt(hours: number, minutes: number, prayers: PrayerTimeEntry[] = DAY) {
  vi.setSystemTime(at(hours, minutes));
  return getNextPrayer(prayers);
}

/** API payloads and saved display_text are built by hand, so keys can be absent. */
function sparse(partial: Partial<Record<PrayerName, string>>): Record<PrayerName, string> {
  return partial as Record<PrayerName, string>;
}

const FULL_TIMES = sparse({
  fajr: '03:26',
  sunrise: '04:55',
  dhuhr: '13:24',
  asr: '17:43',
  maghrib: '21:42',
  isha: '23:50',
});

describe('PRAYER_NAMES and PRAYER_DISPLAY_NAMES', () => {
  it('lists the six slots of the day in chronological order', () => {
    expect(PRAYER_NAMES).toEqual(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
  });

  it('has a default label for every name', () => {
    expect(Object.keys(PRAYER_DISPLAY_NAMES).sort()).toEqual([...PRAYER_NAMES].sort());
    expect(PRAYER_NAMES.map((name) => PRAYER_DISPLAY_NAMES[name])).toEqual([
      'Fajr',
      'Sunrise',
      'Dhuhr',
      'Asr',
      'Maghrib',
      'Isha',
    ]);
  });
});

describe('getNextPrayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the next prayer still ahead of the clock', () => {
    expect(nextAt(2, 0)?.name).toBe('fajr');
    expect(nextAt(10, 30)?.name).toBe('dhuhr');
    expect(nextAt(14, 0)?.name).toBe('asr');
    expect(nextAt(19, 0)?.name).toBe('maghrib');
    expect(nextAt(22, 0)?.name).toBe('isha');
  });

  it('treats a prayer as past the moment its minute arrives', () => {
    // Comparison is strictly greater-than, so at 13:24 exactly Dhuhr is no longer "next".
    expect(nextAt(13, 23)?.name).toBe('dhuhr');
    expect(nextAt(13, 24)?.name).toBe('asr');
  });

  it('ignores seconds within the current minute', () => {
    vi.setSystemTime(new Date(2026, 6, 30, 13, 23, 59));
    expect(getNextPrayer(DAY)?.name).toBe('dhuhr');
  });

  it('never returns sunrise, which is not a congregational prayer', () => {
    expect(nextAt(3, 30)?.name).toBe('dhuhr');
    expect(nextAt(4, 54)?.name).toBe('dhuhr');
  });

  it('wraps to Fajr once Isha has passed', () => {
    // The entry returned is today's Fajr row; the caller renders it as tomorrow's.
    expect(nextAt(23, 50)?.name).toBe('fajr');
    expect(nextAt(23, 59)).toEqual(entry('fajr', '03:26'));
  });

  it('returns null for an empty list', () => {
    expect(nextAt(10, 30, [])).toBeNull();
  });

  it('returns null for a list that only contains sunrise', () => {
    expect(nextAt(3, 0, [entry('sunrise', '04:55')])).toBeNull();
  });

  it('returns null when everything is past and there is no Fajr to fall back on', () => {
    expect(nextAt(23, 0, [entry('dhuhr', '13:24'), entry('asr', '17:43')])).toBeNull();
  });

  it('returns the first future entry in list order, not the earliest time', () => {
    const shuffled = [entry('isha', '23:50'), entry('dhuhr', '13:24')];
    expect(nextAt(10, 30, shuffled)?.name).toBe('isha');
  });

  it('parses single-digit hours and truncates a seconds field', () => {
    expect(nextAt(8, 0, [entry('dhuhr', '9:05')])?.name).toBe('dhuhr');
    expect(nextAt(9, 5, [entry('dhuhr', '9:05')])).toBeNull();
    // '13:24:30' is compared as 13:24, so the whole minute counts as past — the extra
    // 30 seconds do not keep it in the future.
    expect(nextAt(13, 23, [entry('dhuhr', '13:24:30')])?.name).toBe('dhuhr');
    expect(nextAt(13, 24, [entry('dhuhr', '13:24:30')])).toBeNull();
  });

  it('cannot see a prayer that lands after midnight', () => {
    // Times are minutes-since-midnight, so a late Isha at 00:15 reads as the earliest
    // slot of the same day: at 23:00 it already counts as past.
    const lateIsha = [entry('fajr', '03:26'), entry('isha', '00:15')];
    expect(nextAt(23, 0, lateIsha)).toEqual(entry('fajr', '03:26'));
    expect(nextAt(0, 10, lateIsha)?.name).toBe('fajr');
  });

  it('returns the empty Fajr row all day for a screen whose times were never filled in', () => {
    // prayerTimesMapToEntries defaults every slot to '00:00', which never compares as
    // future, so an unconfigured screen permanently falls back to its own Fajr row.
    const blank = prayerTimesMapToEntries(sparse({}));
    expect(nextAt(10, 30, blank)).toEqual(entry('fajr', '00:00'));
    expect(nextAt(0, 0, blank)).toEqual(entry('fajr', '00:00'));
  });

  it('skips unparseable times instead of throwing', () => {
    const broken = [entry('fajr', ''), entry('dhuhr', 'not a time'), entry('asr', '17:xx')];
    expect(() => nextAt(10, 30, broken)).not.toThrow();
    // Nothing compares as future, so the Fajr fallback wins even though its time is empty.
    expect(nextAt(10, 30, broken)?.name).toBe('fajr');
    expect(nextAt(10, 30, [entry('dhuhr', 'not a time')])).toBeNull();
  });
});

describe('prayerTimesMapToEntries', () => {
  it('maps all six slots in PRAYER_NAMES order with the default labels', () => {
    expect(prayerTimesMapToEntries(FULL_TIMES)).toEqual([
      { name: 'fajr', displayName: 'Fajr', time: '03:26' },
      { name: 'sunrise', displayName: 'Sunrise', time: '04:55' },
      { name: 'dhuhr', displayName: 'Dhuhr', time: '13:24' },
      { name: 'asr', displayName: 'Asr', time: '17:43' },
      { name: 'maghrib', displayName: 'Maghrib', time: '21:42' },
      { name: 'isha', displayName: 'Isha', time: '23:50' },
    ]);
  });

  it('keeps PRAYER_NAMES order regardless of the key order of the map', () => {
    const reversed = sparse({
      isha: '23:50',
      maghrib: '21:42',
      asr: '17:43',
      dhuhr: '13:24',
      sunrise: '04:55',
      fajr: '03:26',
    });
    expect(prayerTimesMapToEntries(reversed).map((e) => e.name)).toEqual(PRAYER_NAMES);
  });

  it('uses custom names when they are provided', () => {
    const custom: Record<PrayerName, string> = {
      fajr: 'Sabah',
      sunrise: 'Güneş',
      dhuhr: 'Öğle',
      asr: 'İkindi',
      maghrib: 'Akşam',
      isha: 'Yatsı',
    };
    expect(prayerTimesMapToEntries(FULL_TIMES, custom).map((e) => e.displayName)).toEqual([
      'Sabah',
      'Güneş',
      'Öğle',
      'İkindi',
      'Akşam',
      'Yatsı',
    ]);
  });

  it('falls back to the default label for blank and for missing custom names', () => {
    // sunrise/asr/maghrib/isha are absent from the override map, dhuhr is present but blank.
    const partial = sparse({ fajr: 'Sabah', dhuhr: '' });
    expect(prayerTimesMapToEntries(FULL_TIMES, partial).map((e) => e.displayName)).toEqual([
      'Sabah',
      'Sunrise',
      'Dhuhr',
      'Asr',
      'Maghrib',
      'Isha',
    ]);
  });

  it('substitutes 00:00 for missing or empty times', () => {
    const partialTimes = sparse({ dhuhr: '13:24', asr: '' });
    expect(prayerTimesMapToEntries(partialTimes).map((e) => e.time)).toEqual([
      '00:00',
      '00:00',
      '13:24',
      '00:00',
      '00:00',
      '00:00',
    ]);
  });

  it('passes times through verbatim without validating them', () => {
    const hostile = sparse({ fajr: '25:99', sunrise: '<script>', dhuhr: '  ' });
    const [fajr, sunrise, dhuhr] = prayerTimesMapToEntries(hostile);
    expect([fajr?.time, sunrise?.time, dhuhr?.time]).toEqual(['25:99', '<script>', '  ']);
  });

  it('omits iqamahTime entirely for the caller to fill in', () => {
    const entries = prayerTimesMapToEntries(FULL_TIMES);
    expect(entries.map((e) => Object.keys(e))).toEqual(
      PRAYER_NAMES.map(() => ['name', 'displayName', 'time'])
    );
    expect(entries.some((e) => 'iqamahTime' in e)).toBe(false);
  });
});
