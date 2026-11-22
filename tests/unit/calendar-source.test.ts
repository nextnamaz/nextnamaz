import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  calendarTimes,
  dateIn,
  lastCalendarDay,
  mergeCalendar,
  parseCalendarCsv,
} from '@/lib/prayer-sources/calendar';
import { fetchPrayerTimes } from '@/lib/prayer-sources';
import { parseSourceConfig } from '@/lib/screen-settings';

// The 2026 calendar a Göteborg mosque's old screen ran on.
const GOTEBORG = readFileSync(join(__dirname, '../fixtures/calendar-goteborg-2026.csv'), 'utf8');
const TZ = 'Europe/Stockholm';

describe('parseCalendarCsv', () => {
  it('reads a whole year', () => {
    const { days, badLines } = parseCalendarCsv(GOTEBORG);
    expect(badLines).toEqual([]);
    expect(Object.keys(days)).toHaveLength(365);
    expect(days['2026-11-22']).toEqual(['05:49', '08:04', '12:03', '13:30', '15:52', '17:59']);
  });

  it('takes semicolons, a BOM, single-digit hours and dots', () => {
    const { days } = parseCalendarCsv('﻿datum;fajr;soluppgång;dhuhr;asr;maghrib;isha\r\n2026-12-01;6.03;8:22;12:06;13:22;15:40;17:51\r\n');
    expect(days['2026-12-01']).toEqual(['06:03', '08:22', '12:06', '13:22', '15:40', '17:51']);
  });

  it('names the lines it cannot read', () => {
    const { badLines } = parseCalendarCsv('date,a,b,c,d,e,f\n2026-02-30,1:00,2:00,3:00,4:00,5:00,6:00\n2026-03-01,1:00,2:00\n2026-03-02,25:00,2:00,3:00,4:00,5:00,6:00');
    expect(badLines).toEqual([2, 3, 4]);
  });
});

describe('calendar days', () => {
  const { days } = parseCalendarCsv(GOTEBORG);

  it("shows the mosque's row for today in its own time zone", () => {
    // 23:30 UTC on 21 November is already 22 November in Sweden.
    const times = calendarTimes({ timezone: TZ, days }, new Date('2026-11-21T23:30:00Z'));
    expect(times).toEqual({ fajr: '05:49', sunrise: '08:04', dhuhr: '12:03', asr: '13:30', maghrib: '15:52', isha: '17:59' });
  });

  it('throws past the last day, so the screen keeps its stored times', async () => {
    expect(() => calendarTimes({ timezone: TZ, days }, new Date('2027-01-01T12:00:00Z'))).toThrow();
  });

  it("keeps December when next year's file is added, and drops the past", () => {
    const next = { '2027-01-01': ['06:25', '08:48', '12:20', '13:28', '15:42', '17:58'] };
    const merged = mergeCalendar(days, next, '2026-12-15');
    expect(Object.keys(merged)[0]).toBe('2026-12-15');
    expect(merged['2026-12-31']).toBeDefined();
    expect(lastCalendarDay(merged)).toBe('2027-01-01');
  });

  it('dates in a time zone', () => {
    expect(dateIn(TZ, new Date('2026-06-30T22:30:00Z'))).toBe('2026-07-01');
  });

  it('is saved and served like any other source', async () => {
    const config = parseSourceConfig('calendar', { timezone: TZ, days });
    expect(config).not.toBeNull();
    expect(parseSourceConfig('calendar', { timezone: TZ, days: { '2026-01-01': ['bad'] } })).toBeNull();
    const today = dateIn(TZ);
    if (days[today] && config) {
      expect(Object.values(await fetchPrayerTimes('calendar', config))).toEqual(days[today]);
    }
  });
});
