'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { CalendarSourceConfig } from '@/types/prayer-config';
import { PRAYER_NAMES } from '@/types/prayer';
import type { PrayerName } from '@/types/prayer';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CalendarDaysProps {
  days: CalendarSourceConfig['days'];
  labels: Record<PrayerName, string>;
  /** The day to open on: today, or the first day of the calendar. */
  today: string;
  onChange: (days: CalendarSourceConfig['days']) => void;
}

function monthName(month: string): string {
  return new Date(`${month}-15T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function dayName(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** The calendar a month at a time. Tap a day to change its times. */
export function CalendarDays({ days, labels, today, onChange }: CalendarDaysProps) {
  const dates = Object.keys(days).sort();
  const months = [...new Set(dates.map((d) => d.slice(0, 7)))];
  const [month, setMonth] = useState(months.includes(today.slice(0, 7)) ? today.slice(0, 7) : (months[0] ?? ''));
  const [open, setOpen] = useState<string | null>(null);
  const shown = dates.filter((d) => d.startsWith(month));

  const setTime = (date: string, index: number, value: string) => {
    const row = [...(days[date] ?? [])];
    row[index] = value;
    onChange({ ...days, [date]: row });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {months.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMonth(m);
              setOpen(null);
            }}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-sm transition-colors',
              m === month ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'
            )}
          >
            {monthName(m)}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {shown.map((date) => {
          const row = days[date] ?? [];
          const expanded = open === date;
          return (
            <li key={date}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : date)}
                aria-expanded={expanded}
                className={cn('flex w-full items-center gap-3 px-3 py-2 text-start text-sm hover:bg-muted', date === today && 'font-semibold')}
              >
                <span className="w-24 shrink-0">{dayName(date)}</span>
                <span className="min-w-0 flex-1 truncate tabular-nums text-muted-foreground">{row.join('  ')}</span>
                <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
              </button>
              {expanded && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-3 pb-3 sm:grid-cols-3">
                  {PRAYER_NAMES.map((prayer, i) => (
                    <label key={prayer} className="flex items-center justify-between gap-2 text-sm">
                      {labels[prayer]}
                      <Input
                        type="time"
                        value={row[i] ?? ''}
                        onChange={(e) => e.target.value && setTime(date, i, e.target.value)}
                        className="w-28"
                      />
                    </label>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
