'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { UUID_RE } from '@/lib/screens';
import { fetchPrayerTimes } from '@/lib/prayer-sources';
import { parseSourceConfig, screenSettingsSchema } from '@/lib/screen-settings';
import type { PrayerSourceInput, ScreenSettingsInput } from '@/lib/screen-settings';
import { asDisplayConfig } from '@/types/database';
import type { PrayerTimesMap, Json } from '@/types/database';

export type { PrayerSourceInput, ScreenSettingsInput } from '@/lib/screen-settings';

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

  // Media must live in this screen's own storage folder.
  const ownPath = (p: string) => p.startsWith(`${id}/`) && !p.includes('..');
  if (!parsed.data.display_config.announcements.items.every((i) => ownPath(i.path))) {
    return { ok: false, error: 'Invalid announcement media' };
  }

  // Slides removed from the list are deleted from storage on save, so the
  // bucket doesn't accumulate every image ever uploaded.
  const client = createAdminClient();
  const { data: existing } = await client
    .from('screens')
    .select('display_config')
    .eq('id', id)
    .single();
  if (existing) {
    const keep = new Set(parsed.data.display_config.announcements.items.map((i) => i.path));
    const stale = asDisplayConfig(existing.display_config)
      .announcements.items.map((i) => i.path)
      // Only ever delete inside this screen's own folder, so a crafted path
      // stored earlier can't reach another screen's media.
      .filter((p) => p.startsWith(`${id}/`) && !p.includes('..') && !keep.has(p));
    if (stale.length > 0) {
      await client.storage.from('slides').remove(stale);
    }
  }

  const { error } = await client
    .from('screens')
    .update({
      ...parsed.data,
      // Zod-validated plain object; the assertion only bridges the gap between
      // a keyed interface and Json's index signature.
      prayer_source_config: sourceConfig as Json,
      configured: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { ok: false, error: 'Could not save' };

  await broadcastRefresh(id);
  return { ok: true };
}

const SLIDE_TYPES: Record<string, { ext: string; kind: 'image' | 'video'; maxBytes: number }> = {
  'image/jpeg': { ext: 'jpg', kind: 'image', maxBytes: 4 * 1024 * 1024 },
  'image/png': { ext: 'png', kind: 'image', maxBytes: 4 * 1024 * 1024 },
  'image/webp': { ext: 'webp', kind: 'image', maxBytes: 4 * 1024 * 1024 },
  'video/mp4': { ext: 'mp4', kind: 'video', maxBytes: 40 * 1024 * 1024 },
  'video/webm': { ext: 'webm', kind: 'video', maxBytes: 40 * 1024 * 1024 },
};

type UploadSlideResult =
  | { ok: true; item: { path: string; url: string; kind: 'image' | 'video' } }
  | { ok: false; error: string };

/**
 * Store an announcement image or video for a screen. The file lands in
 * storage immediately; it only shows on the TV once the settings are saved
 * with the returned item in the list. Possession of the screen id authorizes.
 */
export async function uploadSlideImage(
  screenId: string,
  formData: FormData
): Promise<UploadSlideResult> {
  if (!UUID_RE.test(screenId)) return { ok: false, error: 'Unknown screen' };

  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'No file received' };
  const spec = SLIDE_TYPES[file.type];
  if (!spec) return { ok: false, error: 'Use a JPG, PNG, WebP image or an MP4/WebM video' };
  if (file.size > spec.maxBytes) {
    return {
      ok: false,
      error: spec.kind === 'video' ? 'Video is over 40 MB' : 'Image is over 4 MB',
    };
  }
  const { ext, kind } = spec;

  const client = createAdminClient();
  const { data: screen } = await client
    .from('screens')
    .select('id')
    .eq('id', screenId)
    .single();
  if (!screen) return { ok: false, error: 'Unknown screen' };

  const path = `${screenId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage
    .from('slides')
    .upload(path, file, { contentType: file.type });
  if (error) {
    console.error('slide upload failed:', error.message);
    return { ok: false, error: 'Upload failed. Try again.' };
  }

  const { data } = client.storage.from('slides').getPublicUrl(path);
  return { ok: true, item: { path, url: data.publicUrl, kind } };
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
