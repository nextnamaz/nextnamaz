import type { DisplayTextConfig, LocaleMetadata, SupportedLocale } from '@/types/locale';
import { DEFAULT_TRANSLATIONS } from './presets';

/**
 * Parse flat display_text JSONB into typed DisplayTextConfig.
 * Falls back to language preset for missing keys.
 */
export function parseDisplayText(
  raw: Record<string, string>,
  locale: string
): DisplayTextConfig {
  const safeLocale = (locale in DEFAULT_TRANSLATIONS ? locale : 'en') as SupportedLocale;
  const preset = DEFAULT_TRANSLATIONS[safeLocale];

  return {
    prayers: {
      fajr:     raw.fajr     ?? preset.prayers.fajr,
      sunrise:  raw.sunrise  ?? preset.prayers.sunrise,
      dhuhr:    raw.dhuhr    ?? preset.prayers.dhuhr,
      asr:      raw.asr      ?? preset.prayers.asr,
      maghrib:  raw.maghrib  ?? preset.prayers.maghrib,
      isha:     raw.isha     ?? preset.prayers.isha,
    },
    labels: {
      prayer:  raw.prayer  ?? preset.labels.prayer,
      iqamah:  raw.iqamah  ?? preset.labels.iqamah,
      begins:  raw.begins  ?? preset.labels.begins,
      next:    raw.next    ?? preset.labels.next,
    },
  };
}

/**
 * Flatten DisplayTextConfig to a flat Record for DB storage.
 */
export function flattenDisplayText(config: DisplayTextConfig): Record<string, string> {
  return {
    ...config.prayers,
    ...config.labels,
  };
}

/**
 * Parse metadata JSONB into typed LocaleMetadata with defaults.
 */
export function parseLocaleMetadata(raw: Record<string, unknown>): LocaleMetadata {
  return {
    dateFormat:  (raw.dateFormat as LocaleMetadata['dateFormat']) ?? 'DD/MM/YYYY',
    use24Hour:   typeof raw.use24Hour === 'boolean' ? raw.use24Hour : true,
    showSeconds: typeof raw.showSeconds === 'boolean' ? raw.showSeconds : true,
    timezone:    typeof raw.timezone === 'string' ? raw.timezone : 'auto',
  };
}
