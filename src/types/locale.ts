import type { PrayerName } from './prayer';

// --- Supported Language Codes ---

export type SupportedLocale =
  | 'en' | 'ar' | 'bs' | 'sv' | 'tr' | 'ur' | 'de' | 'fr' | 'es';

// --- Language Metadata ---

export interface LanguageOption {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

// --- Translation Keys ---

export type PrayerNameTranslations = Record<PrayerName, string>;

export interface UILabelTranslations {
  prayer: string;
  iqamah: string;
  begins: string;
  next: string;
}

export interface DisplayTextConfig {
  prayers: PrayerNameTranslations;
  labels: UILabelTranslations;
}

// --- Date Format ---

export type DateFormatOption =
  | 'DD/MM/YYYY'
  | 'MM/DD/YYYY'
  | 'YYYY-MM-DD'
  | 'DD MMM YYYY'
  | 'MMMM DD, YYYY';

export interface DateFormatChoice {
  value: DateFormatOption;
  label: string;
  dateFnsFormat: string;
}

// --- Time Format ---

export interface LocaleMetadata {
  dateFormat: DateFormatOption;
  use24Hour: boolean;
  showSeconds: boolean;
  timezone: string;
}
