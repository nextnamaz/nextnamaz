import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchPrayerTimes } from '@/lib/prayer-sources';
import type { PrayerSourceType, PrayerSourceConfig } from '@/types/prayer-config';
import type { Json } from '@/types/database';

interface SyncRequest {
  mosqueId: string;
  source: PrayerSourceType;
  config: PrayerSourceConfig;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: SyncRequest = await request.json();

  if (!body.mosqueId || !body.source || body.source === 'manual') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Verify user is a member of this mosque
  const { data: member } = await supabase
    .from('mosque_members')
    .select('role')
    .eq('mosque_id', body.mosqueId)
    .eq('user_id', user.id)
    .single();

  if (!member || member.role === 'viewer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const times = await fetchPrayerTimes(body.source, body.config);

    const { error } = await supabase
      .from('mosque_settings')
      .update({
        prayer_times: times,
        prayer_source: body.source,
        prayer_source_config: body.config as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('mosque_id', body.mosqueId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ times });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to sync prayer times';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
