import type { PrayerTimesMap } from '@/types/database';
import type { CalendarSourceConfig } from '@/types/prayer-config';

// A mosque's own yearly calendar, uploaded as a CSV with one row per day:
//   date,fajr,sunrise,dhuhr,asr,maghrib,isha
//   2026-01-01,06:25,08:48,12:20,13:28,15:42,17:58
// Stored in the screen's source config; the TV shows the row for today.

const ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Most days a calendar keeps: two years, so next year's file can go up in December. */
export const MAX_CALENDAR_DAYS = 800;

export interface ParsedCalendar {
  days: CalendarSourceConfig['days'];
  /** Line numbers (1-based) that could not be read. */
  badLines: number[];
}

function clock(cell: string): string | null {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(cell.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? `${String(h).padStart(2, '0')}:${m[2]}` : null;
}

function isRealDate(date: string): boolean {
  if (!DATE.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(date);
}

/** Read a calendar CSV. Commas or semicolons; a header row is skipped. */
export function parseCalendarCsv(text: string): ParsedCalendar {
  const days: CalendarSourceConfig['days'] = {};
  const badLines: number[] = [];
  text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .forEach((raw, i) => {
      const line = raw.trim();
      if (line === '') return;
      const cells = line.split(/[;,\t]/).map((c) => c.trim().replace(/^"|"$/g, ''));
      const [date = '', ...rest] = cells;
      if (i === 0 && !isRealDate(date)) return; // header
      const times = rest.slice(0, ORDER.length).map(clock);
      if (!isRealDate(date) || times.length !== ORDER.length || times.some((t) => t === null)) {
        badLines.push(i + 1);
        return;
      }
      days[date] = times as string[];
    });
  return { days, badLines };
}

/** The date in a time zone as YYYY-MM-DD. */
export function dateIn(timezone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/**
 * New days over old ones, keeping the old days the new file doesn't cover
 * (December 2026 stays when the 2027 file goes up), and dropping days that
 * are already past so the stored calendar doesn't grow forever.
 */
export function mergeCalendar(
  existing: CalendarSourceConfig['days'],
  incoming: CalendarSourceConfig['days'],
  today: string
): CalendarSourceConfig['days'] {
  const merged = { ...existing, ...incoming };
  const kept = Object.keys(merged)
    .filter((d) => d >= today)
    .sort()
    .slice(0, MAX_CALENDAR_DAYS);
  return Object.fromEntries(kept.map((d) => [d, merged[d] as string[]]));
}

/** The last day the calendar covers, or null when it is empty. */
export function lastCalendarDay(days: CalendarSourceConfig['days']): string | null {
  return Object.keys(days).sort().at(-1) ?? null;
}

/** Today's row as prayer times. Throws when the calendar has no row for today. */
export function calendarTimes(config: CalendarSourceConfig, now: Date = new Date()): PrayerTimesMap {
  const today = dateIn(config.timezone, now);
  const row = config.days[today];
  if (!row || row.length !== ORDER.length) throw new Error(`Calendar has no row for ${today}`);
  const [fajr = '', sunrise = '', dhuhr = '', asr = '', maghrib = '', isha = ''] = row;
  return { fajr, sunrise, dhuhr, asr, maghrib, isha };
}

/** A stored source config as a calendar, or null when it isn't one. */
export function asCalendarConfig(config: Record<string, unknown>): CalendarSourceConfig | null {
  const { timezone, days } = config;
  if (typeof timezone !== 'string' || !days || typeof days !== 'object' || Array.isArray(days)) return null;
  return { timezone, days: days as CalendarSourceConfig['days'] };
}
