import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PrayerDisplay } from '@/components/display/prayer-display';
import type { MosqueSettings } from '@/types/database';
import { toMosqueSettings } from '@/types/database';

interface ShortUrlPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ theme?: string; preview?: string }>;
}

export async function generateMetadata({ params }: ShortUrlPageProps) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: screen } = await supabase
    .from('screens')
    .select('name, mosques(name)')
    .eq('short_code', code)
    .single();

  const mosqueName = screen?.mosques?.name ?? null;

  return {
    title: mosqueName ? `${mosqueName} - Prayer Times` : 'Prayer Times Display',
  };
}

export default async function ShortUrlPage({ params, searchParams }: ShortUrlPageProps) {
  const { code } = await params;
  const { theme: themeOverride, preview } = await searchParams;
  const supabase = await createClient();

  const { data: screen, error: screenError } = await supabase
    .from('screens')
    .select('*')
    .eq('short_code', code)
    .single();

  if (screenError || !screen) {
    notFound();
  }

  const { data: mosque } = await supabase
    .from('mosques')
    .select('*')
    .eq('id', screen.mosque_id)
    .single();

  if (!mosque) notFound();

  const { data: settings } = await supabase
    .from('mosque_settings')
    .select('*')
    .eq('mosque_id', screen.mosque_id)
    .single();

  const defaultSettings: MosqueSettings = {
    mosque_id: screen.mosque_id,
    prayer_times: {
      fajr: '05:00',
      sunrise: '06:30',
      dhuhr: '13:00',
      asr: '16:30',
      maghrib: '19:00',
      isha: '20:30',
    },
    prayer_source: 'manual',
    prayer_source_config: {},
    prayer_config: {},
    locale: 'en',
    display_text: {},
    metadata: {},
    updated_at: new Date().toISOString(),
  };

  const typedSettings = settings ? toMosqueSettings(settings) : defaultSettings;

  return (
    <PrayerDisplay
      mosque={mosque}
      screen={screen}
      settings={typedSettings}
      themeOverride={themeOverride}
      isPreview={preview === '1'}
    />
  );
}
