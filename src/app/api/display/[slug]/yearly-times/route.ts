import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toMosqueSettings } from '@/types/database';
import type { PrayerTimesMap } from '@/types/database';
import type { AdhanSourceConfig, VaktijaEuSourceConfig } from '@/types/prayer-config';
import { calculateAdhanTimes } from '@/lib/prayer-sources/adhan';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// Vaktija.eu response shape
interface VaktijaEuDayData {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

interface VaktijaEuMonthData {
  days: Record<string, VaktijaEuDayData>;
}

interface VaktijaEuApiResponse {
  data: {
    months: Record<string, VaktijaEuMonthData>;
  };
}

const PRAYER_KEYS: (keyof PrayerTimesMap)[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizePrayerTime(raw: string): string {
  const [h, m] = raw.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

function isCacheFresh(computedAt: string): boolean {
  return Date.now() - new Date(computedAt).getTime() < CACHE_MAX_AGE_MS;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: screen } = await supabase
    .from('screens')
    .select('mosque_id')
    .eq('slug', slug)
    .single();

  if (!screen) {
    return NextResponse.json({ error: 'Screen not found' }, { status: 404 });
  }

  const mosqueId = screen.mosque_id;

  // 1. Check DB cache first
  const { data: cached } = await supabase
    .from('mosque_yearly_times')
    .select('times, computed_at')
    .eq('mosque_id', mosqueId)
    .single();

  if (cached && isCacheFresh(cached.computed_at)) {
    return NextResponse.json(cached.times as Record<string, PrayerTimesMap>, {
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
    });
  }

  // 2. Cache miss or stale — compute fresh yearly times
  const { data: settingsRow } = await supabase
    .from('mosque_settings')
    .select('*')
    .eq('mosque_id', mosqueId)
    .single();

  if (!settingsRow) {
    return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
  }

  const settings = toMosqueSettings(settingsRow);
  const yearlyTimes: Record<string, PrayerTimesMap> = {};
  const todayStr = formatDateStr(new Date());

  if (settings.prayer_source === 'adhan') {
    const config = settings.prayer_source_config as AdhanSourceConfig;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      yearlyTimes[formatDateStr(date)] = calculateAdhanTimes({
        latitude: config.latitude,
        longitude: config.longitude,
        method: config.method,
        madhab: config.madhab,
        timezone: config.timezone,
      }, date);
    }
  } else if (settings.prayer_source === 'vaktija_eu') {
    const config = settings.prayer_source_config as VaktijaEuSourceConfig;
    try {
      const res = await fetch(
        `https://api.vaktija.eu/v3/locations/slug/${config.locationSlug}`
      );
      if (res.ok) {
        const data: VaktijaEuApiResponse = await res.json();
        const year = new Date().getFullYear();
        // Include current year + next year for year-boundary offline scenarios
        const years = [year, year + 1];
        for (const y of years) {
          for (const [monthStr, monthData] of Object.entries(data.data.months)) {
            const month = parseInt(monthStr, 10);
            for (const [dayStr, dayData] of Object.entries(monthData.days)) {
              const day = parseInt(dayStr, 10);
              const dateStr = `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              if (!yearlyTimes[dateStr]) {
                const times = {} as PrayerTimesMap;
                for (const key of PRAYER_KEYS) {
                  times[key] = normalizePrayerTime(dayData[key]);
                }
                yearlyTimes[dateStr] = times;
              }
            }
          }
        }
      } else {
        yearlyTimes[todayStr] = settings.prayer_times;
      }
    } catch {
      yearlyTimes[todayStr] = settings.prayer_times;
    }
  } else {
    // manual / other: no yearly data, return current times for every day
    yearlyTimes[todayStr] = settings.prayer_times;
  }

  // 3. Save to DB cache (fire-and-forget via SECURITY DEFINER function)
  supabase.rpc('upsert_yearly_times', {
    p_mosque_id: mosqueId,
    p_times: yearlyTimes,
  }).then(({ error }) => {
    if (error) console.warn('[yearly-times] DB cache write failed:', error.message);
  });

  return NextResponse.json(yearlyTimes, {
    headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
  });
}
