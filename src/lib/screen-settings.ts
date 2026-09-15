import { z } from 'zod';

import { prayerTimesSchema } from '@/lib/validations';
import { LANGUAGES } from '@/lib/locale/presets';
import type { PrayerSourceConfig } from '@/types/prayer-config';

// --- Prayer source validation (schema picked by source type) ---

const adhanConfigSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  method: z.enum([
    'MuslimWorldLeague', 'Egyptian', 'Karachi', 'UmmAlQura', 'Dubai', 'Qatar',
    'Kuwait', 'MoonsightingCommittee', 'Singapore', 'Turkey', 'Tehran', 'NorthAmerica',
  ]),
  madhab: z.enum(['shafi', 'hanafi']),
  timezone: z.string().max(64),
  locationName: z.string().max(100),
});

const sourceConfigSchemas = {
  manual: z.object({}),
  adhan: adhanConfigSchema,
  vaktija_ba: z.object({
    locationId: z.number().int().min(0).max(1000),
    locationName: z.string().max(100),
  }),
  vaktija_eu: z.object({
    countryCode: z.string().max(2),
    locationSlug: z.string().regex(/^[a-z0-9-]+$/).max(100),
    locationName: z.string().max(100),
  }),
  islamiska_forbundet: z.object({
    city: z.string().regex(/^[A-Za-zÀ-ž .'-]+$/).max(60),
  }),
} as const;

const prayerSourceSchema = z.enum(['manual', 'adhan', 'vaktija_ba', 'vaktija_eu', 'islamiska_forbundet']);
export type PrayerSourceInput = z.infer<typeof prayerSourceSchema>;

export function parseSourceConfig(source: PrayerSourceInput, config: unknown): PrayerSourceConfig | null {
  const parsed = sourceConfigSchemas[source].safeParse(config);
  return parsed.success ? (parsed.data as PrayerSourceConfig) : null;
}

// Theme ids duplicated from THEME_REGISTRY so the server action bundle
// doesn't pull in the display components.
export const screenSettingsSchema = z.object({
  prayer_times: prayerTimesSchema,
  locale: z.string().refine((l) => LANGUAGES.some((x) => x.code === l)),
  display_text: z.record(z.string(), z.string().max(100)),
  prayer_source: prayerSourceSchema,
  prayer_source_config: z.record(z.string(), z.unknown()),
  // 'mihrab' is retired but still accepted: screens saved before it was
  // replaced must remain editable. It resolves to 'night' at render time
  // (see THEME_ALIASES in components/display/themes).
  theme: z.enum(['default', 'night', 'mihrab']),
  theme_config: z.record(
    z.string(),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ),
  display_config: z.object({
    rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
    zoom: z.number().min(0.8).max(1),
    blackout: z.object({
      enabled: z.boolean(),
      minutes: z.number().min(1).max(60),
    }),
    controlQr: z.object({
      enabled: z.boolean(),
    }),
    announcements: z.object({
      enabled: z.boolean(),
      layout: z.enum(['full', 'split']),
      intervalMin: z.number().min(1).max(120),
      showSeconds: z.number().min(3).max(60),
      items: z
        .array(
          z.object({
            path: z.string().max(300),
            url: z.string().url().max(600),
            kind: z.enum(['image', 'video']),
          })
        )
        .max(12),
    }),
  }),
});

export type ScreenSettingsInput = z.infer<typeof screenSettingsSchema>;

/** A PIN is four to eight digits. Shared by the client fields and the server. */
export const PIN_RE = /^\d{4,8}$/;
