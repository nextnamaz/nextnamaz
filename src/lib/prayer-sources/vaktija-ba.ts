import type { PrayerTimesMap } from '@/types/database';

interface VaktijaResponse {
  vpiod: string;
  vakat: string[];
  datum: string[];
}

/** Vaktija.ba vakat[] index → prayer key mapping */
const VAKAT_MAP: [keyof PrayerTimesMap, number][] = [
  ['fajr', 0],
  ['sunrise', 1],
  ['dhuhr', 2],
  ['asr', 3],
  ['maghrib', 4],
  ['isha', 5],
];

export async function fetchVaktijaBa(locationId: number): Promise<PrayerTimesMap> {
  const res = await fetch(`https://api.vaktija.ba/vaktija/v1/${locationId}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Vaktija.ba API error: ${res.status}`);
  }

  const data: VaktijaResponse = await res.json();

  const times = {} as PrayerTimesMap;
  for (const [key, idx] of VAKAT_MAP) {
    const raw = data.vakat[idx];
    // API returns "HH:MM" format — normalize to ensure 2-digit
    const [h, m] = raw.split(':');
    times[key] = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }

  return times;
}

export interface VaktijaLocation {
  id: number;
  name: string;
}

export const VAKTIJA_LOCATIONS: VaktijaLocation[] = [
  { id: 77, name: 'Sarajevo' },
  { id: 91, name: 'Tuzla' },
  { id: 107, name: 'Zenica' },
  { id: 60, name: 'Mostar' },
  { id: 8, name: 'Banja Luka' },
  { id: 10, name: 'Bihać' },
  { id: 17, name: 'Brčko' },
  { id: 25, name: 'Doboj' },
  { id: 33, name: 'Goražde' },
  { id: 37, name: 'Gradačac' },
  { id: 47, name: 'Kakanj' },
  { id: 52, name: 'Konjic' },
  { id: 56, name: 'Livno' },
  { id: 58, name: 'Lukavac' },
  { id: 65, name: 'Novi Travnik' },
  { id: 67, name: 'Orašje' },
  { id: 72, name: 'Prijedor' },
  { id: 80, name: 'Srebrenik' },
  { id: 87, name: 'Travnik' },
  { id: 96, name: 'Visoko' },
  { id: 100, name: 'Zavidovići' },
  { id: 14, name: 'Bosanska Krupa' },
  { id: 18, name: 'Bugojno' },
  { id: 22, name: 'Čapljina' },
  { id: 27, name: 'Foča' },
  { id: 31, name: 'Gračanica' },
  { id: 38, name: 'Kladanj' },
  { id: 41, name: 'Jajce' },
  { id: 44, name: 'Kalesija' },
  { id: 49, name: 'Kiseljak' },
  { id: 54, name: 'Ključ' },
  { id: 62, name: 'Maglaj' },
  { id: 64, name: 'Neum' },
  { id: 69, name: 'Olovo' },
  { id: 74, name: 'Prozor-Rama' },
  { id: 82, name: 'Stolac' },
  { id: 84, name: 'Sanski Most' },
  { id: 88, name: 'Trebinje' },
  { id: 93, name: 'Vareš' },
  { id: 98, name: 'Velika Kladuša' },
  { id: 103, name: 'Zvornik' },
];
