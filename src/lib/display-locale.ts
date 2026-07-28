import type { PrayerName } from '@/types/prayer';
import type { DateFormatOption, SupportedLocale } from '@/types/locale';
import { DATE_FORMAT_OPTIONS, DEFAULT_TRANSLATIONS } from '@/lib/locale/presets';
import { parseDisplayText } from '@/lib/locale/helpers';
import { format } from 'date-fns';
import type { Locale } from 'date-fns';
import { ar, bs, de, enGB, enUS, es, fr, sv, tr } from 'date-fns/locale';

const DATE_FNS_LOCALES: Record<string, Locale> = {
  en: enGB,
  ar: ar,
  bs: bs,
  sv: sv,
  tr: tr,
  ur: enUS,
  de: de,
  fr: fr,
  es: es,
};

// --- Resolved locale config consumed by themes ---

export interface DisplayLocale {
  prayerNames: Record<PrayerName, string>;
  labels: {
    prayer: string;
    begins: string;
    iqamah: string;
    next: string;
    now: string;
  };
  use24Hour: boolean;
  showSeconds: boolean;
  dateFormat: DateFormatOption;
  timezone: string;
  locale: string;
}

// --- Resolve from a locale code + per-screen text overrides ---

export function resolveDisplayLocale(
  locale: string,
  displayText: Record<string, string> = {}
): DisplayLocale {
  const safeLocale = (locale in DEFAULT_TRANSLATIONS ? locale : 'en') as SupportedLocale;
  const parsed = parseDisplayText(displayText, safeLocale);

  return {
    prayerNames: parsed.prayers,
    labels: parsed.labels,
    use24Hour: true,
    showSeconds: true,
    dateFormat: 'DD/MM/YYYY',
    timezone: 'auto',
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
  const fnsLocale = DATE_FNS_LOCALES[locale.locale] ?? enGB;
  try {
    return format(date, entry.dateFnsFormat, { locale: fnsLocale });
  } catch {
    return date.toLocaleDateString('en-GB');
  }
}

/** "Saturday, 25 July" in the given app locale — stable across browsers. */
export function formatTodayDate(locale: string): string {
  const fnsLocale = DATE_FNS_LOCALES[locale] ?? enGB;
  try {
    return format(new Date(), 'EEEE, d MMMM', { locale: fnsLocale });
  } catch {
    return new Date().toLocaleDateString('en-GB');
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
