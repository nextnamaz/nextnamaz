'use client';

import { useRef, useState } from 'react';
import { CalendarDays as CalendarIcon, ClipboardPaste, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { PrayerTimesMap } from '@/types/database';
import type { CalendarSourceConfig } from '@/types/prayer-config';
import type { PrayerName } from '@/types/prayer';
import {
  calendarTimes,
  calendarToCsv,
  dateIn,
  lastCalendarDay,
  mergeCalendar,
  parseCalendarCsv,
} from '@/lib/prayer-sources/calendar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays } from './calendar-days';

interface CalendarUploadProps {
  /** The calendar in use, or null when the screen uses another source. */
  current: CalendarSourceConfig | null;
  labels: Record<PrayerName, string>;
  onApply: (config: CalendarSourceConfig, today: PrayerTimesMap | null) => void;
}

const DAY_MS = 86_400_000;

function longDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function todaysTimes(config: CalendarSourceConfig): PrayerTimesMap | null {
  try {
    return calendarTimes(config);
  } catch {
    // Starts in the future: the current times stay until then.
    return null;
  }
}

/**
 * The mosque's own calendar: add it from a file or rows pasted from a
 * spreadsheet, download it to edit elsewhere, or change single days here.
 * New rows are added to the days already there, so next year's calendar can
 * go up before this one ends.
 */
export function CalendarUpload({ current, labels, onApply }: CalendarUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState('');
  const [editing, setEditing] = useState(false);
  const timezone = current?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = dateIn(timezone);
  const last = current ? lastCalendarDay(current.days) : null;
  const daysLeft = last ? Math.round((Date.parse(last) - Date.parse(today)) / DAY_MS) : null;

  const add = (text: string): boolean => {
    const { days, badLines } = parseCalendarCsv(text);
    if (badLines.length > 0) {
      toast.error(`Could not read line ${badLines.slice(0, 3).join(', ')}${badLines.length > 3 ? '…' : ''}. Each line needs a date and six times.`);
      return false;
    }
    if (Object.keys(days).length === 0) {
      toast.error('No days found. Each line needs a date and six times.');
      return false;
    }
    const merged = mergeCalendar(current?.days ?? {}, days, today);
    if (Object.keys(merged).length === 0) {
      toast.error('Those days are all in the past.');
      return false;
    }
    const config: CalendarSourceConfig = { timezone, days: merged };
    onApply(config, todaysTimes(config));
    toast.success(`Calendar until ${longDate(lastCalendarDay(merged) ?? today)}. Press save.`);
    return true;
  };

  const download = () => {
    if (!current) return;
    const url = URL.createObjectURL(new Blob([calendarToCsv(current.days)], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prayer-calendar.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {current && last && (
        <p className={daysLeft !== null && daysLeft < 31 ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
          {daysLeft !== null && daysLeft < 0
            ? `The calendar ended on ${longDate(last)}. The TV repeats its last day until new days are added.`
            : daysLeft !== null && daysLeft < 31
              ? `The calendar ends on ${longDate(last)}. Add next year's days before then.`
              : `Calendar until ${longDate(last)}.`}
        </p>
      )}

      {current ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
            <CalendarIcon className="size-4" /> {editing ? 'Hide days' : 'See and edit days'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
            <Upload className="size-4" /> Upload file
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setPasting((v) => !v)} aria-expanded={pasting}>
            <ClipboardPaste className="size-4" /> Paste rows
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={download}>
            <Download className="size-4" /> Download
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-muted-foreground"
          onClick={() => setPasting((v) => !v)}
          aria-expanded={pasting}
        >
          <CalendarIcon className="size-4" /> Use your mosque&apos;s own calendar instead
        </Button>
      )}

      {pasting && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-sm text-muted-foreground">
            Copy the rows from Excel, Google Sheets or a website and paste them here, or upload a CSV
            file. One line per day: the date, then Fajr, sunrise, Dhuhr, Asr, Maghrib and Isha.
            A header row in any order works too.
          </p>
          <Textarea
            aria-label="Calendar rows"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={5}
            placeholder={'2026-12-01  06:03  08:22  12:06  13:22  15:40  17:51\n2026-12-02  06:04  08:24  12:06  13:21  15:39  17:50'}
            className="font-mono text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pasted.trim() === ''}
              onClick={() => {
                if (add(pasted)) {
                  setPasted('');
                  setPasting(false);
                }
              }}
            >
              Add these days
            </Button>
            {!current && (
              <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
                <Upload className="size-4" /> Upload a file instead
              </Button>
            )}
          </div>
        </div>
      )}

      {current && editing && (
        <CalendarDays
          days={current.days}
          labels={labels}
          today={today}
          onChange={(days) => {
            const config = { timezone, days };
            onApply(config, todaysTimes(config));
          }}
        />
      )}

      <input
        ref={input}
        type="file"
        accept=".csv,.tsv,.txt,text/csv,text/plain"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file && add(await file.text())) setPasting(false);
        }}
      />
    </div>
  );
}
