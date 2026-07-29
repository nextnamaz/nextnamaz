'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { UUID_RE } from '@/lib/screens';
import { prayerTimesSchema } from '@/lib/validations';
import { LANGUAGES } from '@/lib/locale/presets';
import { fetchPrayerTimes } from '@/lib/prayer-sources';
import type { PrayerSourceConfig } from '@/types/prayer-config';
import type { PrayerTimesMap, Json } from '@/types/database';

/** Create a blank screen and return its secret id. */
export async function createScreen(): Promise<string> {
  const { data, error } = await createAdminClient()
    .from('screens')
    .insert({})
    .select('id')
    .single();
  if (error || !data) {
    console.error('createScreen failed:', error?.message ?? 'no row returned');
    throw new Error('Could not create screen');
  }
  return data.id;
}

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

function parseSourceConfig(source: PrayerSourceInput, config: unknown): PrayerSourceConfig | null {
  const parsed = sourceConfigSchemas[source].safeParse(config);
  return parsed.success ? (parsed.data as PrayerSourceConfig) : null;
}

// Theme ids duplicated from THEME_REGISTRY so the server action bundle
// doesn't pull in the display components.
const screenSettingsSchema = z.object({
  prayer_times: prayerTimesSchema,
  locale: z.string().refine((l) => LANGUAGES.some((x) => x.code === l)),
  display_text: z.record(z.string(), z.string().max(100)),
  prayer_source: prayerSourceSchema,
  prayer_source_config: z.record(z.string(), z.unknown()),
  theme: z.enum(['default', 'andalusi', 'manuscript', 'zellij']),
  theme_config: z.record(
    z.string(),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ),
});

export type ScreenSettingsInput = z.infer<typeof screenSettingsSchema>;

type SaveResult = { ok: true } | { ok: false; error: string };

/**
 * Nudge the TV to reload. Sending on a channel the server never subscribed to
 * goes out over Realtime's HTTP broadcast endpoint, so no websocket is held
 * open. Best-effort: the TV also polls, so a lost broadcast only costs time.
 */
async function broadcastRefresh(id: string): Promise<void> {
  const client = createAdminClient();
  const channel = client.channel(`screen:${id}`);
  try {
    await channel.send({ type: 'broadcast', event: 'command', payload: {} });
  } catch (error) {
    console.error('broadcast failed:', error);
  } finally {
    await client.removeChannel(channel);
  }
}

/** Save settings for a screen. Possession of the id is the authorization. */
export async function saveScreen(
  id: string,
  input: ScreenSettingsInput
): Promise<SaveResult> {
  if (!UUID_RE.test(id)) return { ok: false, error: 'Unknown screen' };
  const parsed = screenSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid settings' };

  const sourceConfig = parseSourceConfig(parsed.data.prayer_source, parsed.data.prayer_source_config);
  if (sourceConfig === null) return { ok: false, error: 'Invalid source settings' };

  const { error } = await createAdminClient()
    .from('screens')
    .update({
      ...parsed.data,
      prayer_source_config: sourceConfig as unknown as Json,
      configured: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { ok: false, error: 'Could not save' };

  await broadcastRefresh(id);
  return { ok: true };
}

type FetchTimesResult = { ok: true; times: PrayerTimesMap } | { ok: false; error: string };

/** Fetch today's times from a live source — used by the setup wizard preview. */
export async function fetchSourceTimes(
  source: PrayerSourceInput,
  config: unknown
): Promise<FetchTimesResult> {
  if (source === 'manual') return { ok: false, error: 'Manual source has no provider' };
  const parsed = parseSourceConfig(source, config);
  if (parsed === null) return { ok: false, error: 'Invalid source settings' };
  try {
    const times = await fetchPrayerTimes(source, parsed);
    return { ok: true, times };
  } catch {
    return { ok: false, error: 'Could not reach the prayer time source' };
  }
}
