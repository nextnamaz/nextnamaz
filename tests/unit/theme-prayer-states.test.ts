import { describe, expect, it } from 'vitest';
import { prayerStates } from '@/components/display/themes/config';

const DAY = [
  { name: 'fajr', time: '05:21' },
  { name: 'sunrise', time: '07:24' },
  { name: 'dhuhr', time: '13:04' },
  { name: 'asr', time: '15:52' },
  { name: 'maghrib', time: '18:41' },
  { name: 'isha', time: '20:29' },
];

const at = (h: number, m: number) => new Date(2026, 9, 2, h, m);

describe('prayerStates', () => {
  it('keeps Fajr current until sunrise ends its time', () => {
    expect(prayerStates(DAY, 'dhuhr', at(6, 55))).toEqual(['current', 'upcoming', 'next', 'upcoming', 'upcoming', 'upcoming']);
  });

  it('leaves no prayer current between sunrise and Dhuhr', () => {
    expect(prayerStates(DAY, 'dhuhr', at(12, 40))).toEqual(['past', 'past', 'next', 'upcoming', 'upcoming', 'upcoming']);
  });

  it('marks the latest prayer begun as current once Dhuhr is in', () => {
    expect(prayerStates(DAY, 'maghrib', at(16, 20))).toEqual(['past', 'past', 'past', 'current', 'next', 'upcoming']);
  });
});
