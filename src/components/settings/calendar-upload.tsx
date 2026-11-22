'use client';

import { useRef } from 'react';
import { CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import type { PrayerTimesMap } from '@/types/database';
import type { CalendarSourceConfig } from '@/types/prayer-config';
import {
  calendarTimes,
  dateIn,
  lastCalendarDay,
  mergeCalendar,
  parseCalendarCsv,
} from '@/lib/prayer-sources/calendar';
import { Button } from '@/components/ui/button';

interface CalendarUploadProps {
  /** The calendar in use, or null when the screen uses another source. */
  current: CalendarSourceConfig | null;
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

/**
 * Upload the mosque's own yearly calendar (CSV). A new file is added to the
 * days already there, so next year's calendar can go up before this one ends.
 */
export function CalendarUpload({ current, onApply }: CalendarUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const timezone = current?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = dateIn(timezone);
  const last = current ? lastCalendarDay(current.days) : null;
  const daysLeft = last ? Math.round((Date.parse(last) - Date.parse(today)) / DAY_MS) : null;

  const read = async (file: File) => {
    const { days, badLines } = parseCalendarCsv(await file.text());
    if (badLines.length > 0) {
      toast.error(`Could not read line ${badLines.slice(0, 3).join(', ')}${badLines.length > 3 ? '…' : ''}. Each line needs a date and six times.`);
      return;
    }
    const merged = mergeCalendar(current?.days ?? {}, days, today);
    if (Object.keys(merged).length === 0) {
      toast.error('The file has no days from today on.');
      return;
    }
    const config: CalendarSourceConfig = { timezone, days: merged };
    let times: PrayerTimesMap | null = null;
    try {
      times = calendarTimes(config);
    } catch {
      // Starts in the future: keep showing the current times until then.
    }
    onApply(config, times);
    toast.success(`Calendar added, until ${longDate(lastCalendarDay(merged) ?? today)}. Press save.`);
  };

  return (
    <div className="space-y-2">
      {current && last && (
        <p className={daysLeft !== null && daysLeft < 31 ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
          {daysLeft !== null && daysLeft < 0
            ? `The calendar ended on ${longDate(last)}. The TV repeats its last day until a new file is added.`
            : daysLeft !== null && daysLeft < 31
              ? `The calendar ends on ${longDate(last)}. Add next year's file before then.`
              : `Calendar until ${longDate(last)}.`}
        </p>
      )}
      <Button
        type="button"
        variant={current ? 'outline' : 'link'}
        className={current ? undefined : 'h-auto p-0 text-muted-foreground'}
        onClick={() => input.current?.click()}
      >
        <CalendarDays className="size-4" />
        {current ? 'Add a calendar file' : "Use your mosque's own calendar file instead"}
      </Button>
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void read(file);
        }}
      />
      {current && (
        <p className="text-xs text-muted-foreground">
          A CSV with one line per day: date, Fajr, sunrise, Dhuhr, Asr, Maghrib, Isha, like
          2026-01-01,06:25,08:48,12:20,13:28,15:42,17:58.
        </p>
      )}
    </div>
  );
}
