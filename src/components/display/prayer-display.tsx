'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Mosque, Screen, MosqueSettings, MosqueSettingsRow } from '@/types/database';
import { asRecord, toMosqueSettings, getScreenControls } from '@/types/database';
import type { PrayerTimeEntry } from '@/types/prayer';
import { prayerTimesMapToEntries, getNextPrayer } from '@/types/prayer';
import type { PrayerConfigMap, ScreenCommand, DevicePresenceState } from '@/types/prayer-config';
import { THEME_REGISTRY } from './themes';

interface PrayerDisplayProps {
  mosque: Mosque;
  screen: Screen;
  settings: MosqueSettings;
  themeOverride?: string;
  isPreview?: boolean;
}

function getDeviceId(): string {
  let id = sessionStorage.getItem('device_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('device_id', id);
  }
  return id;
}

export function PrayerDisplay({
  mosque,
  screen,
  settings: initialSettings,
  themeOverride,
  isPreview = false,
}: PrayerDisplayProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [currentTheme, setCurrentTheme] = useState(themeOverride || screen.theme);
  const [currentScreen, setCurrentScreen] = useState(screen);
  const [prayers, setPrayers] = useState<PrayerTimeEntry[]>(() =>
    prayerTimesMapToEntries(initialSettings.prayer_times, initialSettings.prayer_config as PrayerConfigMap)
  );
  const [nextPrayer, setNextPrayer] = useState<PrayerTimeEntry | null>(null);
  const presenceJoined = useRef(false);

  // Update prayers when settings change
  useEffect(() => {
    setPrayers(prayerTimesMapToEntries(settings.prayer_times, settings.prayer_config as PrayerConfigMap));
  }, [settings.prayer_times, settings.prayer_config]);

  // Update next prayer every minute
  const updateNextPrayer = useCallback(() => {
    setNextPrayer(getNextPrayer(prayers));
  }, [prayers]);

  useEffect(() => {
    updateNextPrayer();
    const interval = setInterval(updateNextPrayer, 60000);
    return () => clearInterval(interval);
  }, [updateNextPrayer]);

  // Realtime subscriptions: settings, screen changes, broadcast commands, presence
  useEffect(() => {
    const supabase = createClient();

    // Settings changes
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

    // Screen record changes (theme + display controls)
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
          if (payload.new) {
            const updated = payload.new as Screen;
            setCurrentScreen(updated);
            if (!themeOverride) {
              setCurrentTheme(updated.theme);
            }
          }
        }
      )
      .subscribe();

    // Broadcast commands (refresh)
    const commandChannel = supabase
      .channel(`screen:${screen.id}`)
      .on('broadcast', { event: 'command' }, ({ payload }) => {
        const cmd = payload as ScreenCommand;
        if (cmd.type === 'refresh') {
          window.location.reload();
        }
      });

    // Presence tracking — skip for admin preview iframes
    if (!isPreview && !presenceJoined.current) {
      const presenceState: DevicePresenceState = {
        deviceId: getDeviceId(),
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        connectedAt: new Date().toISOString(),
      };
      commandChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await commandChannel.track(presenceState);
          presenceJoined.current = true;
        }
      });
    } else {
      commandChannel.subscribe();
    }

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(screenChannel);
      supabase.removeChannel(commandChannel);
    };
  }, [mosque.id, screen.id, themeOverride]);

  const controls = getScreenControls(currentScreen);
  const isPortrait = controls.rotation === 90 || controls.rotation === 270;

  const displayStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) rotate(${controls.rotation}deg) scale(${controls.zoom / 100})`,
    filter: `brightness(${controls.brightness / 100})`,
    transformOrigin: 'center center',
    width: isPortrait ? '100vh' : '100vw',
    height: isPortrait ? '100vw' : '100vh',
  };

  const themeProps = {
    mosqueName: mosque.name,
    prayers,
    nextPrayer,
    config: asRecord(currentScreen.theme_config),
  };

  const renderTheme = () => {
    const def = THEME_REGISTRY[currentTheme] ?? THEME_REGISTRY['classic'];
    const ThemeComponent = def.component;
    return <ThemeComponent {...themeProps} />;
  };

  // Only apply display transforms if not in preview mode (themeOverride)
  if (themeOverride) {
    return renderTheme();
  }

  return (
    <div className="overflow-hidden" style={displayStyle}>
      {renderTheme()}
    </div>
  );
}
