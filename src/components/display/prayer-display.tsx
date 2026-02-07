'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Mosque, Screen, MosqueSettings, MosqueSettingsRow } from '@/types/database';
import { asRecord, toMosqueSettings } from '@/types/database';
import type { PrayerTimeEntry } from '@/types/prayer';
import { prayerTimesMapToEntries, getNextPrayer } from '@/types/prayer';
import { ClassicTheme, ModernTheme, LightTheme, RamadanTheme } from './themes';

interface PrayerDisplayProps {
  mosque: Mosque;
  screen: Screen;
  settings: MosqueSettings;
  themeOverride?: string;
}

export function PrayerDisplay({
  mosque,
  screen,
  settings: initialSettings,
  themeOverride,
}: PrayerDisplayProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [currentTheme, setCurrentTheme] = useState(themeOverride || screen.theme);
  const [prayers, setPrayers] = useState<PrayerTimeEntry[]>(() =>
    prayerTimesMapToEntries(initialSettings.prayer_times)
  );
  const [nextPrayer, setNextPrayer] = useState<PrayerTimeEntry | null>(null);

  // Update prayers when settings change
  useEffect(() => {
    setPrayers(prayerTimesMapToEntries(settings.prayer_times));
  }, [settings.prayer_times]);

  // Update next prayer every minute
  const updateNextPrayer = useCallback(() => {
    setNextPrayer(getNextPrayer(prayers));
  }, [prayers]);

  useEffect(() => {
    updateNextPrayer();
    const interval = setInterval(updateNextPrayer, 60000);
    return () => clearInterval(interval);
  }, [updateNextPrayer]);

  // Realtime subscriptions
  useEffect(() => {
    const supabase = createClient();

    const settingsChannel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mosque_settings',
          filter: `mosque_id=eq.${mosque.id}`,
        },
        (payload) => {
          if (payload.new) {
            setSettings(toMosqueSettings(payload.new as MosqueSettingsRow));
          }
        }
      )
      .subscribe();

    const screenChannel = supabase
      .channel('screen-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'screens',
          filter: `id=eq.${screen.id}`,
        },
        (payload) => {
          if (payload.new && !themeOverride) {
            const updated = payload.new as Screen;
            setCurrentTheme(updated.theme);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(screenChannel);
    };
  }, [mosque.id, screen.id, themeOverride]);

  const themeProps = {
    mosqueName: mosque.name,
    prayers,
    nextPrayer,
    config: asRecord(screen.theme_config),
  };

  switch (currentTheme) {
    case 'modern':
      return <ModernTheme {...themeProps} />;
    case 'light':
      return <LightTheme {...themeProps} />;
    case 'ramadan':
      return <RamadanTheme {...themeProps} />;
    case 'classic':
    default:
      return <ClassicTheme {...themeProps} />;
  }
}
