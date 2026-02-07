import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PrayerDisplay } from '@/components/display/prayer-display';
import type { MosqueSettings } from '@/types/database';
import { toMosqueSettings } from '@/types/database';

interface DisplayPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ theme?: string }>;
}

export async function generateMetadata({ params }: DisplayPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: screen } = await supabase
    .from('screens')
    .select('name, mosques(name)')
    .eq('slug', slug)
    .single();

  const mosqueName = screen?.mosques?.name ?? null;

  return {
    title: mosqueName ? `${mosqueName} - Prayer Times` : 'Prayer Times Display',
  };
}

export default async function DisplayPage({ params, searchParams }: DisplayPageProps) {
  const { slug } = await params;
  const { theme: themeOverride } = await searchParams;
  const supabase = await createClient();

  // Fetch screen by slug
  const { data: screen, error: screenError } = await supabase
    .from('screens')
    .select('*')
    .eq('slug', slug)
    .single();

  if (screenError || !screen) {
    notFound();
  }

  // Fetch mosque
  const { data: mosque } = await supabase
    .from('mosques')
    .select('*')
    .eq('id', screen.mosque_id)
    .single();

  if (!mosque) notFound();

  // Fetch mosque settings
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
    />
  );
}
