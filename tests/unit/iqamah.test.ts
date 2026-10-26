import { describe, expect, it } from 'vitest';
import { awaitingIqamah, clockTime, iqamahOf, withIqamah } from '@/lib/iqamah';
import type { PrayerName, PrayerTimeEntry } from '@/types/prayer';

const entry = (name: PrayerName, time: string): PrayerTimeEntry => ({ name, displayName: name, time });

/** Göteborg in late October. */
const DAY: PrayerTimeEntry[] = [
  entry('fajr', '04:59'),
  entry('sunrise', '07:04'),
  entry('dhuhr', '12:01'),
  entry('asr', '14:12'),
  entry('maghrib', '16:49'),
  entry('isha', '18:38'),
];

const at = (hours: number, minutes: number) => new Date(2026, 9, 26, hours, minutes);
const iqamahs = (day: PrayerTimeEntry[]) => Object.fromEntries(day.map((p) => [p.name, p.iqamahTime ?? null]));

describe('iqamahOf', () => {
  it('counts minutes on from the time the prayer begins', () => {
    expect(iqamahOf('16:49', { after: 5 })).toBe('16:54');
    expect(iqamahOf('12:55', { after: 10 })).toBe('13:05');
  });

  it('takes a set time as it is', () => {
    expect(iqamahOf('18:38', { at: '19:30' })).toBe('19:30');
  });

  it('gives nothing for a wait that runs past midnight or a time it cannot read', () => {
    expect(iqamahOf('23:55', { after: 10 })).toBeNull();
    expect(iqamahOf('soon', { after: 10 })).toBeNull();
  });
});

describe('clockTime', () => {
  it('writes minutes since midnight as zero-padded HH:MM', () => {
    expect(clockTime(0)).toBe('00:00');
    expect(clockTime(545)).toBe('09:05');
    expect(clockTime(1439)).toBe('23:59');
  });
});

describe('withIqamah', () => {
  it('leaves the day alone when no prayer has an iqamah', () => {
    expect(withIqamah(DAY, {})).toEqual(DAY);
  });

  it('gives each prayer with a rule its iqamah, and only those', () => {
    const day = withIqamah(DAY, { fajr: { after: 30 }, maghrib: { after: 5 }, isha: { at: '19:30' } });
    expect(iqamahs(day)).toEqual({
      fajr: '05:29',
      sunrise: null,
      dhuhr: null,
      asr: null,
      maghrib: '16:54',
      isha: '19:30',
    });
  });

  it('leaves out an iqamah set before its prayer begins', () => {
    expect(withIqamah(DAY, { isha: { at: '18:30' } })[5]?.iqamahTime).toBeUndefined();
  });

  it('leaves out an iqamah that reaches the next slot of the day', () => {
    // Asr at 14:12 with its iqamah set after Maghrib has begun.
    expect(withIqamah(DAY, { asr: { at: '16:50' } })[3]?.iqamahTime).toBeUndefined();
    // Fajr's time ends at sunrise.
    expect(withIqamah(DAY, { fajr: { at: '07:04' } })[0]?.iqamahTime).toBeUndefined();
  });

  it('keeps an iqamah on the very minute the prayer begins', () => {
    expect(withIqamah(DAY, { maghrib: { at: '16:49' } })[4]?.iqamahTime).toBe('16:49');
  });

  it('never gives sunrise an iqamah', () => {
    expect(withIqamah(DAY, { fajr: { after: 10 } })[1]?.iqamahTime).toBeUndefined();
  });
});

describe('awaitingIqamah', () => {
  const day = withIqamah(DAY, { maghrib: { after: 5 }, isha: { at: '19:30' } });

  it('names the prayer that has begun while its congregation has yet to stand', () => {
    expect(awaitingIqamah(day, at(16, 49))?.name).toBe('maghrib');
    expect(awaitingIqamah(day, at(16, 53))?.name).toBe('maghrib');
    expect(awaitingIqamah(day, at(19, 0))?.name).toBe('isha');
  });

  it('lets go the minute the congregation stands, and before the prayer begins', () => {
    expect(awaitingIqamah(day, at(16, 54))).toBeNull();
    expect(awaitingIqamah(day, at(16, 48))).toBeNull();
  });

  it('is null for prayers without an iqamah', () => {
    expect(awaitingIqamah(day, at(12, 5))).toBeNull();
  });
});
