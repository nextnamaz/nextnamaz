import { describe, expect, it } from 'vitest';
import { FIXABLE_PRAYERS, crossedNeighbour, isFixablePrayer, withFixedTimes } from '@/lib/fixed-times';
import type { PrayerTimesMap } from '@/types/database';

/** Göteborg in late October, once the clocks have gone back. */
const WINTER: PrayerTimesMap = {
  fajr: '05:51',
  sunrise: '07:40',
  dhuhr: '12:16',
  asr: '14:07',
  maghrib: '16:42',
  isha: '18:31',
};

/** Göteborg at midsummer. */
const SUMMER: PrayerTimesMap = {
  fajr: '01:58',
  sunrise: '04:12',
  dhuhr: '13:20',
  asr: '17:43',
  maghrib: '22:13',
  isha: '23:50',
};

describe('FIXABLE_PRAYERS', () => {
  it('holds the five prayers in the order of the day, and never sunrise', () => {
    expect(FIXABLE_PRAYERS).toEqual(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);
    expect(isFixablePrayer('isha')).toBe(true);
    expect(isFixablePrayer('sunrise')).toBe(false);
  });
});

describe('withFixedTimes', () => {
  it('returns the source times untouched when nothing is fixed', () => {
    expect(withFixedTimes(WINTER, {})).toEqual(WINTER);
  });

  it('shows a fixed time in place of the source time', () => {
    expect(withFixedTimes(WINTER, { isha: '19:00' })).toEqual({ ...WINTER, isha: '19:00' });
  });

  it('applies several fixed times at once', () => {
    expect(withFixedTimes(WINTER, { dhuhr: '13:00', isha: '19:00' })).toEqual({
      ...WINTER,
      dhuhr: '13:00',
      isha: '19:00',
    });
  });

  it('keeps a fixed time earlier than the source one, as long as the day stays in order', () => {
    // A summer Isha the mosque brings forward from the source's 23:50.
    expect(withFixedTimes(SUMMER, { isha: '22:45' }).isha).toBe('22:45');
  });

  it('lets a winter fixed time step aside on a summer day, when it would come before the prayer it follows', () => {
    // Isha at 19:00 would land before a 22:13 Maghrib.
    expect(withFixedTimes(SUMMER, { isha: '19:00' })).toEqual(SUMMER);
  });

  it('drops a fixed time that would come after the slot that follows it', () => {
    // Asr at 17:00 in winter would come after the 16:42 Maghrib.
    expect(withFixedTimes(WINTER, { asr: '17:00' })).toEqual(WINTER);
    // Fajr can never be after sunrise.
    expect(withFixedTimes(SUMMER, { fajr: '05:00' })).toEqual(SUMMER);
  });

  it('treats a fixed time on the same minute as its neighbour as out of order', () => {
    expect(withFixedTimes(WINTER, { isha: '16:42' })).toEqual(WINTER);
  });

  it('keeps the fixed times that fit when another one does not', () => {
    expect(withFixedTimes(SUMMER, { dhuhr: '13:30', isha: '19:00' })).toEqual({ ...SUMMER, dhuhr: '13:30' });
  });

  it('lets two fixed times rely on each other', () => {
    // Maghrib 19:30 only fits because Isha is also fixed, at 20:00.
    expect(withFixedTimes(WINTER, { maghrib: '19:30', isha: '20:00' })).toEqual({
      ...WINTER,
      maghrib: '19:30',
      isha: '20:00',
    });
  });

  it('leaves the day in order when two fixed times contradict each other', () => {
    // Swapped by mistake: Maghrib after Isha. One of them has to go.
    const day = withFixedTimes(WINTER, { maghrib: '19:30', isha: '19:00' });
    expect(day).toEqual({ ...WINTER, isha: '19:00' });
  });

  it('corrects a source Isha that lands after midnight', () => {
    const lateIsha = { ...SUMMER, isha: '00:15' };
    expect(withFixedTimes(lateIsha, { isha: '23:00' }).isha).toBe('23:00');
  });

  it('never changes sunrise', () => {
    expect(withFixedTimes(WINTER, { fajr: '06:00', dhuhr: '12:30' }).sunrise).toBe(WINTER.sunrise);
  });
});

describe('crossedNeighbour', () => {
  it('is null for a time that sits between its neighbours', () => {
    expect(crossedNeighbour({ ...WINTER, isha: '19:00' }, 'isha')).toBeNull();
    expect(crossedNeighbour(WINTER, 'dhuhr')).toBeNull();
  });

  it('names the slot before when the time comes too early', () => {
    expect(crossedNeighbour({ ...SUMMER, isha: '19:00' }, 'isha')).toBe('maghrib');
    expect(crossedNeighbour({ ...WINTER, dhuhr: '07:00' }, 'dhuhr')).toBe('sunrise');
  });

  it('names the slot after when the time comes too late', () => {
    expect(crossedNeighbour({ ...WINTER, asr: '17:00' }, 'asr')).toBe('maghrib');
    expect(crossedNeighbour({ ...SUMMER, fajr: '05:00' }, 'fajr')).toBe('sunrise');
  });

  it('ignores a neighbour whose time cannot be read', () => {
    expect(crossedNeighbour({ ...WINTER, maghrib: '' }, 'isha')).toBeNull();
    expect(crossedNeighbour({ ...WINTER, sunrise: 'soon' }, 'fajr')).toBeNull();
  });
});
