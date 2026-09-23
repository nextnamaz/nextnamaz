import type { PrayerTimesMap } from '@/types/database';
import type { AlAdhanSourceConfig } from '@/types/prayer-config';

interface AlAdhanTimings {
  Fajr?: string;
  Sunrise?: string;
  Dhuhr?: string;
  Asr?: string;
  Maghrib?: string;
  Isha?: string;
}

interface AlAdhanResponse {
  data?: {
    timings?: AlAdhanTimings;
    meta?: { method?: { id?: number } };
  };
}

const PRAYER_KEYS: [keyof PrayerTimesMap, keyof AlAdhanTimings][] = [
  ['fajr', 'Fajr'],
  ['sunrise', 'Sunrise'],
  ['dhuhr', 'Dhuhr'],
  ['asr', 'Asr'],
  ['maghrib', 'Maghrib'],
  ['isha', 'Isha'],
];

// Values arrive as "HH:MM", on some endpoints suffixed with the zone: "05:12 (CEST)".
function toHHMM(value: string | undefined): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(value ?? '');
  if (!match) {
    throw new Error(`Unparseable time from AlAdhan: ${JSON.stringify(value)}`);
  }
  const [, h = '', m = ''] = match;
  return `${h.padStart(2, '0')}:${m}`;
}

/** Today as DD-MM-YYYY where the screen hangs, not where the server runs. */
function calendarDay(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${part('day')}-${part('month')}-${part('year')}`;
}

export async function fetchAlAdhan(config: AlAdhanSourceConfig): Promise<PrayerTimesMap> {
  const date = calendarDay(new Date(), config.timezone);
  const params = new URLSearchParams({
    latitude: String(config.latitude),
    longitude: String(config.longitude),
    method: String(config.method),
    school: config.madhab === 'hanafi' ? '1' : '0',
    timezonestring: config.timezone,
  });

  const res = await fetch(`https://api.aladhan.com/v1/timings/${date}?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`AlAdhan API error: ${res.status}`);
  }

  const body: AlAdhanResponse = await res.json();
  const timings = body.data?.timings;
  if (!timings) {
    throw new Error('No prayer times in AlAdhan response');
  }
  // An id the service does not know is answered with ISNA times, not an error.
  if (body.data?.meta?.method?.id !== config.method) {
    throw new Error('AlAdhan substituted a different calculation method');
  }

  const times = {} as PrayerTimesMap;
  for (const [key, field] of PRAYER_KEYS) {
    times[key] = toHHMM(timings[field]);
  }
  return times;
}

// --- Calculation methods ---

export interface AlAdhanMethod {
  id: number;
  name: string;
  description: string;
}

/** api.aladhan.com/v1/methods, minus the custom (99) entry. */
export const ALADHAN_METHODS: AlAdhanMethod[] = [
  { id: 3, name: 'Muslim World League', description: 'Fajr 18°, Isha 17°' },
  { id: 2, name: 'ISNA', description: 'North America, Fajr/Isha 15°' },
  { id: 5, name: 'Egyptian', description: 'Fajr 19.5°, Isha 17.5°' },
  { id: 4, name: 'Umm al-Qura', description: 'Makkah, Fajr 18.5°, Isha 90min' },
  { id: 1, name: 'Karachi', description: 'Fajr 18°, Isha 18°' },
  { id: 7, name: 'Tehran', description: 'Iran, Fajr 17.7°' },
  { id: 0, name: 'Jafari', description: 'Shia Ithna-Ashari, Fajr 16°' },
  { id: 8, name: 'Gulf Region', description: 'Fajr 19.5°, Isha 90min' },
  { id: 9, name: 'Kuwait', description: 'Fajr 18°, Isha 17.5°' },
  { id: 10, name: 'Qatar', description: 'Fajr 18°, Isha 90min' },
  { id: 11, name: 'Singapore (MUIS)', description: 'Fajr 20°, Isha 18°' },
  { id: 12, name: 'France (UOIF)', description: 'Fajr 12°, Isha 12°' },
  { id: 13, name: 'Turkey (Diyanet)', description: 'Fajr 18°, Isha 17°' },
  { id: 14, name: 'Russia', description: 'Fajr 16°, Isha 15°' },
  { id: 15, name: 'Moonsighting Committee', description: 'North America & UK' },
  { id: 16, name: 'Dubai', description: 'UAE, Fajr/Isha 18.2°' },
  { id: 17, name: 'Malaysia (JAKIM)', description: 'Fajr 20°, Isha 18°' },
  { id: 18, name: 'Tunisia', description: 'Fajr 18°, Isha 18°' },
  { id: 19, name: 'Algeria', description: 'Fajr 18°, Isha 17°' },
  { id: 20, name: 'Indonesia (KEMENAG)', description: 'Fajr 20°, Isha 18°' },
  { id: 21, name: 'Morocco', description: 'Fajr 19°, Isha 17°' },
  { id: 22, name: 'Portugal (CIL)', description: 'Fajr 12°, Isha 77min' },
  { id: 23, name: 'Jordan', description: 'Fajr 18°, Isha 18°' },
];

const MUSLIM_WORLD_LEAGUE = 3;

// ISO country → the convention its religious authority publishes with.
const NATIONAL_METHODS = new Map<string, number>([
  ['US', 2], ['CA', 2],
  ['EG', 5], ['SD', 5], ['LY', 5], ['LB', 5], ['SY', 5],
  ['SA', 4],
  ['PK', 1], ['IN', 1], ['BD', 1], ['AF', 1],
  ['IR', 7],
  ['BH', 8], ['OM', 8], ['YE', 8],
  ['KW', 9],
  ['QA', 10],
  ['SG', 11],
  ['FR', 12],
  ['TR', 13],
  ['RU', 14],
  ['GB', 15],
  ['AE', 16],
  ['MY', 17],
  ['TN', 18],
  ['DZ', 19],
  ['ID', 20],
  ['MA', 21],
  ['PT', 22],
  ['JO', 23],
]);

/** Conventions the local adhan library computes just as well, offline. */
const LOCALLY_COMPUTABLE = new Set([1, 2, 3, 4, 5, 7, 9, 10, 11, 13, 15, 16]);

export function defaultAlAdhanMethod(countryCode: string): number {
  return NATIONAL_METHODS.get(countryCode) ?? MUSLIM_WORLD_LEAGUE;
}

/** True when the country's convention exists only on AlAdhan, so it beats local calculation. */
export function hasAlAdhanOnlyConvention(countryCode: string): boolean {
  const method = NATIONAL_METHODS.get(countryCode);
  return method !== undefined && !LOCALLY_COMPUTABLE.has(method);
}
