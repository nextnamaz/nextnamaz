import type { PrayerName } from './prayer';

// --- Iqamah Configuration ---

export type IqamahType = 'fixed' | 'offset';

export interface IqamahConfig {
  type: IqamahType;
  /** For 'fixed': HH:MM string. For 'offset': minutes after adhan. */
  value: string | number;
}

export interface PrayerConfig {
  iqamah?: IqamahConfig;
}

/** Per-prayer config map stored in mosque_settings.prayer_config */
export type PrayerConfigMap = Partial<Record<PrayerName, PrayerConfig>>;

// --- Prayer Source ---

export type PrayerSourceType = 'manual' | 'adhan' | 'vaktija_ba' | 'vaktija_eu' | 'islamiska_forbundet';

export interface AdhanSourceConfig {
  latitude: number;
  longitude: number;
  method: AdhanCalculationMethod;
  madhab: 'shafi' | 'hanafi';
  timezone: string;
  locationName: string;
}

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

/** Union of all source configs — extensible per source type */
export type PrayerSourceConfig =
  | AdhanSourceConfig
  | VaktijaBaSourceConfig
  | VaktijaEuSourceConfig
  | IslamiskaForbundetSourceConfig
  | Record<string, never>;

// --- Screen Display Controls ---

export type ScreenRotation = 0 | 90 | 180 | 270;

export type ZoomPreset = 75 | 100 | 125 | 150;

export type BrightnessPreset = 25 | 50 | 75 | 100;

export interface RotationOption {
  value: ScreenRotation;
  label: string;
}

export interface ZoomOption {
  value: ZoomPreset;
  label: string;
  description: string;
}

export interface BrightnessOption {
  value: BrightnessPreset;
  label: string;
}

export interface ScreenDisplayControls {
  rotation: ScreenRotation;
  zoom: number;
  brightness: number;
}

// --- Device Presence ---

export interface DevicePresenceState {
  deviceId: string;
  userAgent: string;
  screenResolution: string;
  connectedAt: string;
}

// --- Broadcast Commands ---

export type ScreenCommandType = 'refresh';

export interface ScreenCommand {
  type: ScreenCommandType;
  timestamp: number;
}
