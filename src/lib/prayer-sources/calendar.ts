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

type Column = 'date' | (typeof ORDER)[number];

// Header words a mosque's own sheet might use, in the site's languages.
// Matched after lower-casing and stripping accents, so "Öğle" finds "ogle".
const HEADER_WORDS: Record<Column, string[]> = {
  date: ['date', 'datum', 'tarih', 'التاريخ'],
  fajr: ['fajr', 'fadjr', 'sabah', 'zora', 'imsak', 'morgen', 'الفجر', 'فجر'],
  sunrise: ['sunrise', 'soluppgang', 'shuruq', 'shurooq', 'izlazak', 'izlazak sunca', 'gunes', 'sonnenaufgang', 'الشروق', 'شروق'],
  dhuhr: ['dhuhr', 'zuhr', 'duhr', 'dhohr', 'podne', 'ogle', 'mittag', 'الظهر', 'ظهر'],
  asr: ['asr', 'ikindija', 'ikindi', 'nachmittag', 'العصر', 'عصر'],
  maghrib: ['maghrib', 'aksam', 'abend', 'المغرب', 'مغرب'],
  isha: ['isha', 'jacija', 'yatsi', 'nacht', 'العشاء', 'عشاء'],
};

function plain(cell: string): string {
  return cell.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').toLowerCase().trim();
}

/** Where each column sits, from a header row, or null when the row isn't a header. */
function headerColumns(cells: string[]): Partial<Record<Column, number>> | null {
  const found: Partial<Record<Column, number>> = {};
  cells.forEach((cell, index) => {
    const word = plain(cell);
    const column = (Object.keys(HEADER_WORDS) as Column[]).find(
      (c) => found[c] === undefined && HEADER_WORDS[c].some((w) => word === w || word.startsWith(`${w} `))
    );
    if (column) found[column] = index;
  });
  return ORDER.every((c) => found[c] !== undefined) ? found : null;
}

function clock(cell: string): string | null {
  const m = /^(\d{1,2})[:.](\d{2})(?::\d{2})?$/.exec(cell.trim());
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

/** 2026-01-31, 31.01.2026, 31/1/2026 or 31-01-2026 as YYYY-MM-DD; day first, as in Europe. */
function calendarDate(cell: string): string | null {
  const text = cell.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  const dmy = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(text);
  const [y, m, d] = iso ? [iso[1], iso[2], iso[3]] : dmy ? [dmy[3], dmy[2], dmy[1]] : [];
  if (!y || !m || !d) return null;
  const date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  return isRealDate(date) ? date : null;
}

function splitCells(line: string): string[] {
  // A tab means pasted from a spreadsheet; otherwise a semicolon file
  // (Excel in Sweden and Germany) or a comma file.
  const separator = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
  return line.split(separator).map((c) => c.trim().replace(/^"|"$/g, ''));
}

/**
 * Read a calendar from a CSV file or rows pasted from a spreadsheet. A
 * header row, if any, says where each column is; without one the columns
 * are date, Fajr, sunrise, Dhuhr, Asr, Maghrib, Isha. Lines with no date at
 * all (titles, blank rows, notes) are passed over; a dated line that can't
 * be read is reported.
 */
export function parseCalendarCsv(text: string): ParsedCalendar {
  const days: CalendarSourceConfig['days'] = {};
  const badLines: number[] = [];
  let columns: Partial<Record<Column, number>> = { date: 0, fajr: 1, sunrise: 2, dhuhr: 3, asr: 4, maghrib: 5, isha: 6 };
  text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .forEach((raw, i) => {
      const cells = splitCells(raw);
      if (cells.every((c) => c === '')) return;
      const header = headerColumns(cells);
      if (header) {
        columns = { date: 0, ...header };
        return;
      }
      const date = calendarDate(cells[columns.date ?? 0] ?? '');
      if (!date) {
        if (/\d{1,4}[./-]\d{1,2}[./-]\d{1,4}/.test(raw)) badLines.push(i + 1);
        return;
      }
      const times = ORDER.map((c) => clock(cells[columns[c] ?? -1] ?? ''));
      if (times.some((t) => t === null)) {
        badLines.push(i + 1);
        return;
      }
      days[date] = times as string[];
    });
  return { days, badLines };
}

/** The calendar as a CSV the parser reads back, for editing in a spreadsheet. */
export function calendarToCsv(days: CalendarSourceConfig['days']): string {
  const rows = Object.keys(days)
    .sort()
    .map((date) => [date, ...(days[date] ?? [])].join(','));
  return ['date,fajr,sunrise,dhuhr,asr,maghrib,isha', ...rows].join('\n') + '\n';
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
