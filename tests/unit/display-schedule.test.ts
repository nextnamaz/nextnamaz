import { describe, expect, it } from 'vitest';
import {
  CONTROL_QR_DELAY_MINUTES,
  CONTROL_QR_DURATION_MINUTES,
  isBlackoutNow,
  isControlQrNow,
  minutesOf,
} from '@/lib/display-schedule';
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

describe('isControlQrNow', () => {
  it('stays hidden through the prayer, then shows for the full window', () => {
    // Dhuhr 13:24, so the window is 13:34 -> 13:54 with the default 10/20.
    expect(isControlQrNow(DAY, at(13, 24))).toBe(false);
    expect(isControlQrNow(DAY, at(13, 33))).toBe(false);
    expect(isControlQrNow(DAY, at(13, 34))).toBe(true);
    expect(isControlQrNow(DAY, at(13, 53))).toBe(true);
    expect(isControlQrNow(DAY, at(13, 54))).toBe(false);
  });

  it('honours the exported delay and duration rather than hardcoded numbers', () => {
    const start = 13 * 60 + 24 + CONTROL_QR_DELAY_MINUTES;
    const end = start + CONTROL_QR_DURATION_MINUTES;
    expect(isControlQrNow(DAY, at(Math.floor(start / 60), start % 60))).toBe(true);
    expect(isControlQrNow(DAY, at(Math.floor((end - 1) / 60), (end - 1) % 60))).toBe(true);
    expect(isControlQrNow(DAY, at(Math.floor(end / 60), end % 60))).toBe(false);
  });

  it('carries an Isha window across midnight', () => {
    // Isha 23:50 -> window 00:00 to 00:20 the next morning.
    expect(isControlQrNow(DAY, at(23, 59))).toBe(false);
    expect(isControlQrNow(DAY, at(0, 0))).toBe(true);
    expect(isControlQrNow(DAY, at(0, 19))).toBe(true);
    expect(isControlQrNow(DAY, at(0, 20))).toBe(false);
  });

  it('never opens a window for sunrise, which is not a congregational prayer', () => {
    // Sunrise 04:55 would otherwise show 05:05 -> 05:25.
    expect(isControlQrNow(DAY, at(5, 10))).toBe(false);
  });

  it('skips prayers with unparseable times instead of throwing', () => {
    const broken = [entry('dhuhr', ''), entry('asr', 'null')];
    expect(() => isControlQrNow(broken, at(13, 40))).not.toThrow();
    expect(isControlQrNow(broken, at(13, 40))).toBe(false);
  });
});
