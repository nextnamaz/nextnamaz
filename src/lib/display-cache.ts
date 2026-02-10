import type { Mosque, Screen, MosqueSettings, PrayerTimesMap } from '@/types/database';
import type { AdhanSourceConfig } from '@/types/prayer-config';
import { calculateAdhanTimes } from '@/lib/prayer-sources/adhan';

// --- Types ---

export interface DisplayCacheData {
  screen: Screen;
  mosque: Mosque;
  settings: MosqueSettings;
  cachedAt: string;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';

// --- Keys ---

function displayKey(slug: string): string {
  return `nextnamaz:display:${slug}`;
}

function yearlyKey(slug: string): string {
  return `nextnamaz:yearly:${slug}`;
}

function deviceIdKey(): string {
  return 'nextnamaz:device_id';
}

// --- Display Cache ---

export function saveDisplayCache(slug: string, data: Omit<DisplayCacheData, 'cachedAt'>): void {
  try {
    const cached: DisplayCacheData = { ...data, cachedAt: new Date().toISOString() };
    localStorage.setItem(displayKey(slug), JSON.stringify(cached));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function loadDisplayCache(slug: string): DisplayCacheData | null {
  try {
    const raw = localStorage.getItem(displayKey(slug));
    if (!raw) return null;
    return JSON.parse(raw) as DisplayCacheData;
  } catch {
    return null;
  }
}

// --- Yearly Prayer Times Cache ---

export interface YearlyCacheData {
  times: Record<string, PrayerTimesMap>;
  cachedAt: string;
}

export function saveYearlyCache(slug: string, times: Record<string, PrayerTimesMap>): void {
  try {
    const data: YearlyCacheData = { times, cachedAt: new Date().toISOString() };
    localStorage.setItem(yearlyKey(slug), JSON.stringify(data));
  } catch {
    // localStorage full — silently ignore
  }
}

export function loadYearlyCache(slug: string): YearlyCacheData | null {
  try {
    const raw = localStorage.getItem(yearlyKey(slug));
    if (!raw) return null;
    return JSON.parse(raw) as YearlyCacheData;
  } catch {
    return null;
  }
}

export function isYearlyCacheStale(cache: YearlyCacheData): boolean {
  const cachedAt = new Date(cache.cachedAt);
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - cachedAt.getTime() > weekMs;
}

// --- Device ID (persistent across restarts) ---

function generateId(): string {
  // crypto.randomUUID() requires secure context (HTTPS).
  // Kiosks on local HTTP networks need a fallback.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Falls through to fallback
    }
  }
  // Fallback: random hex string
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getDeviceId(): string {
  let id = localStorage.getItem(deviceIdKey());
  if (!id) {
    id = generateId();
    localStorage.setItem(deviceIdKey(), id);
  }
  return id;
}

// --- Timezone-Aware Date Helpers ---

/**
 * Returns today's date as YYYY-MM-DD, optionally in a specific timezone.
 * Without timezone, uses the device's local time.
 */
export function todayDateString(timezone?: string): string {
  if (timezone) {
    // en-CA locale formats as YYYY-MM-DD
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  }
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Creates a Date object representing "today" in the given timezone.
 * Used to ensure adhan calculations use the correct calendar day
 * even when the device clock is in a different timezone than the mosque.
 */
function dateForTimezone(timezone: string): Date {
  const dateStr = todayDateString(timezone);
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Extracts the mosque timezone from settings, if available.
 * Only adhan source configs carry timezone info.
 */
export function getMosqueTimezone(settings: MosqueSettings): string | undefined {
  if (settings.prayer_source === 'adhan') {
    return (settings.prayer_source_config as AdhanSourceConfig).timezone || undefined;
  }
  return undefined;
}

// --- Date-Aware Prayer Time Resolution ---

const DEFAULT_TIMES: PrayerTimesMap = {
  fajr: '05:00',
  sunrise: '06:30',
  dhuhr: '13:00',
  asr: '16:30',
  maghrib: '19:00',
  isha: '20:30',
};

export function getTodaysPrayerTimes(
  settings: MosqueSettings,
  slug: string
): PrayerTimesMap {
  const timezone = getMosqueTimezone(settings);

  // 1. If source is adhan and config available, compute fresh for today
  if (settings.prayer_source === 'adhan') {
    const config = settings.prayer_source_config as AdhanSourceConfig;
    if (config.latitude && config.longitude && config.method && config.madhab && config.timezone) {
      try {
        return calculateAdhanTimes({
          latitude: config.latitude,
          longitude: config.longitude,
          method: config.method,
          madhab: config.madhab,
          timezone: config.timezone,
        }, dateForTimezone(config.timezone));
      } catch {
        // Fall through to next option
      }
    }
  }

  // 2. If yearly cache has today's date, use it
  const yearly = loadYearlyCache(slug);
  if (yearly) {
    const today = todayDateString(timezone);
    if (yearly.times[today]) {
      return yearly.times[today];
    }
  }

  // 3. Use settings cache (may be stale by a day)
  if (settings.prayer_times) {
    return settings.prayer_times;
  }

  // 4. Hardcoded defaults (absolute last resort)
  return DEFAULT_TIMES;
}
