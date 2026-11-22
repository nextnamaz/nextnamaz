export type PrayerSourceType =
  | 'manual'
  | 'adhan'
  | 'aladhan'
  | 'vaktija_ba'
  | 'vaktija_eu'
  | 'islamiska_forbundet'
  | 'calendar';

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

/** api.aladhan.com: `method` is one of its numeric convention ids (see ALADHAN_METHODS). */
export interface AlAdhanSourceConfig {
  latitude: number;
  longitude: number;
  method: number;
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

/** A mosque's own calendar: one row of six HH:MM times per YYYY-MM-DD. */
export interface CalendarSourceConfig {
  /** Whose "today" picks the row. */
  timezone: string;
  days: Record<string, string[]>;
}

export type PrayerSourceConfig =
  | AdhanSourceConfig
  | AlAdhanSourceConfig
  | VaktijaBaSourceConfig
  | VaktijaEuSourceConfig
  | IslamiskaForbundetSourceConfig
  | CalendarSourceConfig
  | Record<string, never>;
