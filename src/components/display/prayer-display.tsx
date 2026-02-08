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
  const isPortrait = Number(controls.rotation) === 90 || Number(controls.rotation) === 270;
  const scaleFactor = controls.zoom / 100;

  const displayStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) rotate(${controls.rotation}deg)`,
    filter: `brightness(${controls.brightness / 100})`,
    transformOrigin: 'center center',
    width: isPortrait ? '100vh' : '100vw',
    height: isPortrait ? '100vw' : '100vh',
    overflow: 'hidden',
    background: '#000',
  };

  // Container wrapper: establishes a CSS container for cqmin-based theme sizing.
  // transform: scale() magnifies the rendered output while keeping the container
  // dimensions at full size — so cqmin stays correct regardless of zoom level.
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    containerType: 'size' as React.CSSProperties['containerType'],
    transform: scaleFactor !== 1 ? `scale(${scaleFactor})` : undefined,
    transformOrigin: 'center center',
  };

  const themeProps = {
    mosqueName: mosque.name,
    prayers,
    nextPrayer,
    config: asRecord(currentScreen.theme_config),
    isPortrait,
  };

  const renderTheme = () => {
    const def = THEME_REGISTRY[currentTheme] ?? THEME_REGISTRY['default'];
    const ThemeComponent = def.component;
    return <ThemeComponent {...themeProps} />;
  };

  // Preview paths: use viewport units so the container has real dimensions
  // (percentage-based height collapses to 0 when body has no explicit height,
  // which makes cqmin=0 and all text invisible).
  if (themeOverride) {
    return (
      <div style={{ width: '100vw', height: '100vh', containerType: 'size' as React.CSSProperties['containerType'] }}>
        {renderTheme()}
      </div>
    );
  }

  if (isPreview) {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', containerType: 'size' as React.CSSProperties['containerType'] }}>
        {renderTheme()}
      </div>
    );
  }

  return (
    <div style={displayStyle}>
      <div style={containerStyle}>
        {renderTheme()}
      </div>
    </div>
  );
}
