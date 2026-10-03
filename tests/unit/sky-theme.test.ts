import { describe, expect, it } from 'vitest';
import { DAY, NIGHT, SUNSET, skyAt } from '@/components/display/themes/sky';
import type { PrayerName, PrayerTimeEntry } from '@/types/prayer';

const entry = (name: PrayerName, time: string): PrayerTimeEntry => ({ name, displayName: name, time });

const day = (fajr: string, sunrise: string, dhuhr: string, asr: string, maghrib: string, isha: string) => [
  entry('fajr', fajr),
  entry('sunrise', sunrise),
  entry('dhuhr', dhuhr),
  entry('asr', asr),
  entry('maghrib', maghrib),
  entry('isha', isha),
];

// Gothenburg, roughly: a December day and a June day.
const WINTER = day('06:45', '08:55', '12:30', '13:40', '15:30', '17:20');
const SUMMER = day('02:40', '04:15', '13:20', '17:45', '22:15', '23:50');

const at = (h: number, m: number) => h * 60 + m;

describe('Sky theme sky', () => {
  it('brings the stars out at night and the clouds by day', () => {
    expect(skyAt(WINTER, at(22, 0)).stars).toBe(1);
    expect(skyAt(WINTER, at(22, 0)).clouds).toBe(0);
    expect(skyAt(SUMMER, at(13, 20)).stars).toBe(0);
    expect(skyAt(SUMMER, at(13, 20)).clouds).toBe(1);
  });

  it('reads the hour off the prayer times, not the clock', () => {
    // 18:00 is long dark in a Swedish December and broad day in June.
    expect(skyAt(WINTER, at(18, 0))).toEqual(NIGHT);
    expect(skyAt(SUMMER, at(18, 0))).not.toEqual(NIGHT);
  });

  it('is the full sunset at Maghrib and full day at Dhuhr', () => {
    expect(skyAt(WINTER, at(15, 30))).toEqual(SUNSET);
    expect(skyAt(SUMMER, at(22, 15))).toEqual(SUNSET);
    expect(skyAt(SUMMER, at(13, 20))).toEqual(DAY);
  });

  it('keeps the dusk past midnight when Isha comes after it', () => {
    const lateIsha = day('02:10', '03:50', '13:20', '17:50', '22:40', '00:30');
    expect(skyAt(lateIsha, at(0, 10))).not.toEqual(NIGHT);
    expect(skyAt(lateIsha, at(1, 5))).toEqual(NIGHT);
  });

  it('never breaks on missing, malformed or out-of-order times', () => {
    const broken = [entry('fajr', 'soon'), entry('dhuhr', '25:99'), entry('maghrib', '04:00'), entry('isha', '')];
    for (let minute = 0; minute < 1440; minute += 7) {
      const sky = skyAt(broken, minute);
      for (const channel of [...sky.top, ...sky.middle, ...sky.bottom]) {
        expect(Number.isInteger(channel)).toBe(true);
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
    }
  });
});
