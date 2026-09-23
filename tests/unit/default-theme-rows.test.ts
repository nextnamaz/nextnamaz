import { describe, expect, it } from 'vitest';
import { rowStates } from '@/components/display/themes/default';
import type { PrayerName, PrayerTimeEntry } from '@/types/prayer';

const entry = (name: PrayerName, time: string): PrayerTimeEntry => ({ name, displayName: name, time });

const DAY: PrayerTimeEntry[] = [
  entry('fajr', '05:30'),
  entry('sunrise', '07:00'),
  entry('dhuhr', '12:30'),
  entry('asr', '15:45'),
  entry('maghrib', '19:30'),
  entry('isha', '21:00'),
];

const byName = (name: PrayerName) => DAY.find((p) => p.name === name) ?? null;
const at = (h: number, m: number) => h * 60 + m;

describe('Default theme row states', () => {
  it('keeps Fajr current until sunrise has actually begun', () => {
    expect(rowStates(DAY, byName('dhuhr'), at(6, 0))).toEqual([
      'current',
      'upcoming',
      'next',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
  });

  it('moves the highlight to sunrise once it has begun', () => {
    expect(rowStates(DAY, byName('dhuhr'), at(7, 0))).toEqual([
      'past',
      'current',
      'next',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
  });

  it('highlights the prayer that began most recently later in the day', () => {
    expect(rowStates(DAY, byName('maghrib'), at(16, 0))).toEqual([
      'past',
      'past',
      'past',
      'current',
      'next',
      'upcoming',
    ]);
  });

  it("keeps last night's Isha current before Fajr", () => {
    expect(rowStates(DAY, byName('fajr'), at(3, 0))).toEqual([
      'next',
      'upcoming',
      'upcoming',
      'upcoming',
      'upcoming',
      'current',
    ]);
  });
});
