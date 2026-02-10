import { Coordinates, CalculationMethod, CalculationParameters, PrayerTimes, Madhab } from 'adhan';
import type { PrayerTimesMap } from '@/types/database';
import type { AdhanCalculationMethod } from '@/types/prayer-config';

const METHOD_MAP: Record<AdhanCalculationMethod, () => CalculationParameters> = {
  MuslimWorldLeague: () => CalculationMethod.MuslimWorldLeague(),
  Egyptian: () => CalculationMethod.Egyptian(),
  Karachi: () => CalculationMethod.Karachi(),
  UmmAlQura: () => CalculationMethod.UmmAlQura(),
  Dubai: () => CalculationMethod.Dubai(),
  Qatar: () => CalculationMethod.Qatar(),
  Kuwait: () => CalculationMethod.Kuwait(),
  MoonsightingCommittee: () => CalculationMethod.MoonsightingCommittee(),
  Singapore: () => CalculationMethod.Singapore(),
  Turkey: () => CalculationMethod.Turkey(),
  Tehran: () => CalculationMethod.Tehran(),
  NorthAmerica: () => CalculationMethod.NorthAmerica(),
};

export interface AdhanCalculationParams {
  latitude: number;
  longitude: number;
  method: AdhanCalculationMethod;
  madhab: 'shafi' | 'hanafi';
  timezone: string;
}

function formatTime(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  });
  return formatter.format(date);
}

export function calculateAdhanTimes(params: AdhanCalculationParams, date?: Date): PrayerTimesMap {
  const coordinates = new Coordinates(params.latitude, params.longitude);
  const calcParams = METHOD_MAP[params.method]();
  calcParams.madhab = params.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  const prayerTimes = new PrayerTimes(coordinates, date ?? new Date(), calcParams);
  const tz = params.timezone;

  return {
    fajr: formatTime(prayerTimes.fajr, tz),
    sunrise: formatTime(prayerTimes.sunrise, tz),
    dhuhr: formatTime(prayerTimes.dhuhr, tz),
    asr: formatTime(prayerTimes.asr, tz),
    maghrib: formatTime(prayerTimes.maghrib, tz),
    isha: formatTime(prayerTimes.isha, tz),
  };
}

export interface CalculationMethodOption {
  id: AdhanCalculationMethod;
  name: string;
  description: string;
}

export const CALCULATION_METHODS: CalculationMethodOption[] = [
  { id: 'MuslimWorldLeague', name: 'Muslim World League', description: 'Fajr 18°, Isha 17°' },
  { id: 'Egyptian', name: 'Egyptian', description: 'Fajr 19.5°, Isha 17.5°' },
  { id: 'Karachi', name: 'Karachi', description: 'Fajr 18°, Isha 18°' },
  { id: 'UmmAlQura', name: 'Umm al-Qura', description: 'Makkah, Fajr 18.5°' },
  { id: 'Dubai', name: 'Dubai', description: 'UAE, Fajr/Isha 18.2°' },
  { id: 'Qatar', name: 'Qatar', description: 'Fajr 18°, Isha 90min' },
  { id: 'Kuwait', name: 'Kuwait', description: 'Fajr 18°, Isha 17.5°' },
  { id: 'MoonsightingCommittee', name: 'Moonsighting Committee', description: 'North America & UK' },
  { id: 'Singapore', name: 'Singapore', description: 'SE Asia, Fajr 20°' },
  { id: 'Turkey', name: 'Turkey (Diyanet)', description: 'Approximation for Turkey' },
  { id: 'Tehran', name: 'Tehran', description: 'Iran, Fajr 17.7°' },
  { id: 'NorthAmerica', name: 'ISNA', description: 'North America, Fajr/Isha 15°' },
];
