import { describe, expect, it } from 'vitest';
import { prayerStates, readChoice } from '@/components/display/themes/config';
import { runToNext } from '@/components/display/themes/paper';
import { moonAge } from '@/components/display/parts';
import type { PrayerName, PrayerTimeEntry } from '@/types/prayer';

const entry = (name: PrayerName, time: string): PrayerTimeEntry => ({ name, displayName: name, time });

const TODAY = [
  entry('fajr', '05:21'),
  entry('sunrise', '07:24'),
  entry('dhuhr', '13:04'),
  entry('asr', '15:52'),
  entry('maghrib', '18:41'),
  entry('isha', '20:29'),
];

const clock = (h: number, m: number) => new Date(2026, 9, 2, h, m);

describe('prayer states', () => {
  it('keeps Fajr current until sunrise, then counts it past', () => {
    expect(prayerStates(TODAY, 'dhuhr', clock(6, 55))).toEqual(['current', 'upcoming', 'next', 'upcoming', 'upcoming', 'upcoming']);
    expect(prayerStates(TODAY, 'dhuhr', clock(12, 40))).toEqual(['past', 'past', 'next', 'upcoming', 'upcoming', 'upcoming']);
  });

  it('marks the prayer whose time it is, and the next one', () => {
    expect(prayerStates(TODAY, 'maghrib', clock(16, 20))).toEqual(['past', 'past', 'past', 'current', 'next', 'upcoming']);
    expect(prayerStates(TODAY, 'fajr', clock(22, 0))).toEqual(['next', 'past', 'past', 'past', 'past', 'current']);
  });
});

describe('readChoice', () => {
  const inks = { navy: '#18223A', green: '#173F31' };

  it('picks the saved choice, and falls back for anything else', () => {
    expect(readChoice(inks, 'green', 'navy')).toBe('#173F31');
    expect(readChoice(inks, 'purple', 'navy')).toBe('#18223A');
    expect(readChoice(inks, 42, 'navy')).toBe('#18223A');
    expect(readChoice(inks, undefined, 'navy')).toBe('#18223A');
  });

  it('never takes an inherited name from saved config', () => {
    expect(readChoice(inks, 'constructor', 'navy')).toBe('#18223A');
    expect(readChoice(inks, '__proto__', 'navy')).toBe('#18223A');
  });
});

describe('Paper day line', () => {
  it('runs straight to a prayer later today', () => {
    expect(runToNext(980, 1121)).toEqual([[980, 1121]]);
  });

  it('wraps past midnight to tomorrow’s Fajr', () => {
    expect(runToNext(1320, 321)).toEqual([[1320, 1440], [0, 321]]);
  });
});

describe('moon', () => {
  it('follows the real phases', () => {
    // Full moon 26 September 2026, new moon 10 October 2026.
    expect(moonAge(new Date(Date.UTC(2026, 8, 26, 12)))).toBeCloseTo(14.8, 0);
    const newMoon = moonAge(new Date(Date.UTC(2026, 9, 10, 12)));
    expect(Math.min(newMoon, 29.53 - newMoon)).toBeLessThan(1.5);
  });
});
