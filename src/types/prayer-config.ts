export type PrayerSourceType =
  | 'manual'
  | 'adhan'
  | 'vaktija_ba'
  | 'vaktija_eu'
  | 'islamiska_forbundet';

export type AdhanCalculationMethod =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'Qatar'
  | 'Kuwait'
  | 'MoonsightingCommittee'
  | 'Singapore'
  | 'Turkey'
  | 'Tehran'
  | 'NorthAmerica';

export interface AdhanSourceConfig {
  latitude: number;
  longitude: number;
  method: AdhanCalculationMethod;
  madhab: 'shafi' | 'hanafi';
  timezone: string;
  locationName: string;
}

export interface VaktijaBaSourceConfig {
  locationId: number;
  locationName: string;
}

export interface VaktijaEuSourceConfig {
  countryCode: string;
  locationSlug: string;
  locationName: string;
}

export interface IslamiskaForbundetSourceConfig {
  city: string;
}

export type PrayerSourceConfig =
  | AdhanSourceConfig
  | VaktijaBaSourceConfig
  | VaktijaEuSourceConfig
  | IslamiskaForbundetSourceConfig
  | Record<string, never>;
