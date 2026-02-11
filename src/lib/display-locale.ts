import type { PrayerName } from '@/types/prayer';
import type { MosqueSettings } from '@/types/database';
import type { DisplayTextConfig, LocaleMetadata, DateFormatOption, SupportedLocale } from '@/types/locale';
import { parseDisplayText, parseLocaleMetadata } from '@/lib/locale/helpers';
import { DATE_FORMAT_OPTIONS } from '@/lib/locale/presets';
import { format } from 'date-fns';

// --- Resolved locale config consumed by themes ---

export interface DisplayLocale {
  prayerNames: Record<PrayerName, string>;
  labels: {
    prayer: string;
    begins: string;
    iqamah: string;
    next: string;
  };
  use24Hour: boolean;
  showSeconds: boolean;
  dateFormat: DateFormatOption;
  timezone: string;
  locale: string;
}

// --- Resolve from MosqueSettings ---

export function resolveDisplayLocale(settings: MosqueSettings): DisplayLocale {
  const parsed: DisplayTextConfig = parseDisplayText(settings.display_text, settings.locale);
  const meta: LocaleMetadata = parseLocaleMetadata(settings.metadata);
  const safeLocale = settings.locale || 'en';

  return {
    prayerNames: parsed.prayers,
    labels: parsed.labels,
    use24Hour: meta.use24Hour,
    showSeconds: meta.showSeconds,
    dateFormat: meta.dateFormat,
    timezone: meta.timezone,
    locale: safeLocale,
  };
}

// --- Formatting utilities ---

/** Format a HH:MM prayer time for display (24h or 12h) */
export function formatPrayerTime(time24: string, locale: DisplayLocale): string {
  if (locale.use24Hour) return time24;
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

/** Format current time for clock display */
export function formatClockTime(date: Date, locale: DisplayLocale): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !locale.use24Hour,
  };
  if (locale.showSeconds) {
    options.second = '2-digit';
  }
  if (locale.timezone !== 'auto') {
    options.timeZone = locale.timezone;
  }
  return date.toLocaleTimeString(
    locale.use24Hour ? 'en-GB' : 'en-US',
    options,
  );
}

/** Format current date for display */
export function formatDisplayDate(date: Date, locale: DisplayLocale): string {
  const entry = DATE_FORMAT_OPTIONS.find((o) => o.value === locale.dateFormat);
  if (!entry) return date.toLocaleDateString('en-GB');
  try {
    return format(date, entry.dateFnsFormat);
  } catch {
    return date.toLocaleDateString('en-GB');
  }
}

/** Get resolved timezone string (resolves 'auto' to device timezone) */
export function resolveTimezone(locale: DisplayLocale): string {
  if (locale.timezone === 'auto') {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return locale.timezone;
}

/** Check if locale is RTL */
export function isRtlLocale(locale: DisplayLocale): boolean {
  const rtlCodes: SupportedLocale[] = ['ar', 'ur'];
  return rtlCodes.includes(locale.locale as SupportedLocale);
}
