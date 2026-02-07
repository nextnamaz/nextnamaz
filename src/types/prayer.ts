export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimeEntry {
  name: PrayerName;
  displayName: string;
  time: string;
}

export const PRAYER_NAMES: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_DISPLAY_NAMES: Record<PrayerName, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export function formatTime12h(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function getNextPrayer(prayers: PrayerTimeEntry[]): PrayerTimeEntry | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const prayer of prayers) {
    if (prayer.name === 'sunrise') continue;
    const [hours, minutes] = prayer.time.split(':').map(Number);
    if (hours * 60 + minutes > currentMinutes) return prayer;
  }

  return prayers.find((p) => p.name === 'fajr') ?? null;
}

export function prayerTimesMapToEntries(
  times: Record<PrayerName, string>
): PrayerTimeEntry[] {
  return PRAYER_NAMES.map((name) => ({
    name,
    displayName: PRAYER_DISPLAY_NAMES[name],
    time: times[name] || '00:00',
  }));
}
