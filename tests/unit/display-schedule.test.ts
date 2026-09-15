import { describe, expect, it } from 'vitest';
import { isBlackoutNow, minutesOf } from '@/lib/display-schedule';
import type { PrayerTimeEntry } from '@/types/prayer';

function entry(name: PrayerTimeEntry['name'], time: string): PrayerTimeEntry {
  return { name, displayName: name, time };
}

/** A day whose Isha is late enough that a blackout window crosses midnight. */
const DAY: PrayerTimeEntry[] = [
  entry('fajr', '03:26'),
  entry('sunrise', '04:55'),
  entry('dhuhr', '13:24'),
  entry('asr', '17:43'),
  entry('maghrib', '21:42'),
  entry('isha', '23:50'),
];

const at = (hours: number, minutes: number) => new Date(2026, 6, 30, hours, minutes);

describe('minutesOf', () => {
  it('converts HH:MM to minutes since midnight', () => {
    expect(minutesOf('00:00')).toBe(0);
    expect(minutesOf('13:24')).toBe(804);
    expect(minutesOf('23:59')).toBe(1439);
  });

  it('tolerates a single-digit hour and trailing seconds', () => {
    expect(minutesOf('9:05')).toBe(545);
    expect(minutesOf('09:05:30')).toBe(545);
    expect(minutesOf(' 09:05 ')).toBe(545);
  });

  it('returns null for values it cannot parse', () => {
    expect(minutesOf('')).toBeNull();
    expect(minutesOf('not a time')).toBeNull();
    expect(minutesOf('24:00')).toBeNull();
    expect(minutesOf('12:60')).toBeNull();
  });
});

describe('isBlackoutNow', () => {
  it('is dark from the prayer time until the window closes', () => {
    expect(isBlackoutNow(DAY, 15, at(13, 23))).toBe(false);
    expect(isBlackoutNow(DAY, 15, at(13, 24))).toBe(true);
    expect(isBlackoutNow(DAY, 15, at(13, 38))).toBe(true);
    expect(isBlackoutNow(DAY, 15, at(13, 39))).toBe(false);
  });

  it('stays dark across midnight for a late Isha', () => {
    // Isha 23:50 + 45 min runs to 00:35 the next day.
    expect(isBlackoutNow(DAY, 45, at(23, 55))).toBe(true);
    expect(isBlackoutNow(DAY, 45, at(0, 20))).toBe(true);
    expect(isBlackoutNow(DAY, 45, at(0, 34))).toBe(true);
    expect(isBlackoutNow(DAY, 45, at(0, 35))).toBe(false);
  });

  it('ignores sunrise, which is not a congregational prayer', () => {
    expect(isBlackoutNow(DAY, 15, at(4, 56))).toBe(false);
  });

  it('never blacks out for a non-positive window', () => {
    expect(isBlackoutNow(DAY, 0, at(13, 24))).toBe(false);
    expect(isBlackoutNow(DAY, -5, at(13, 24))).toBe(false);
  });

  it('skips prayers with unparseable times instead of throwing', () => {
    const broken = [entry('dhuhr', ''), entry('asr', 'null')];
    expect(() => isBlackoutNow(broken, 15, at(13, 24))).not.toThrow();
    expect(isBlackoutNow(broken, 15, at(13, 24))).toBe(false);
  });
});
