import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchPrayerTimes } from '@/lib/prayer-sources';
import type { PrayerSourceType, PrayerSourceConfig } from '@/types/prayer-config';

interface FetchRequest {
  source: PrayerSourceType;
  config: PrayerSourceConfig;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: FetchRequest = await request.json();

  if (!body.source || body.source === 'manual') {
    return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
  }

  try {
    const times = await fetchPrayerTimes(body.source, body.config);
    return NextResponse.json({ times });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch prayer times';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
