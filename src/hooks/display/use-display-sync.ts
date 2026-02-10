import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Mosque, Screen, MosqueSettings, MosqueSettingsRow, PrayerTimesMap } from '@/types/database';
import { toMosqueSettings } from '@/types/database';
import type { ScreenCommand, DevicePresenceState } from '@/types/prayer-config';
import {
  saveYearlyCache,
  loadYearlyCache,
  isYearlyCacheStale,
  getDeviceId,
  type ConnectionStatus,
} from '@/lib/display-cache';
import type { DisplayErrorPayload } from '@/lib/display-logger';
import { useOnlineStatus } from './use-online-status';
import { useDocumentVisible } from './use-document-visible';

interface UseDisplaySyncOptions {
  themeOverride?: string;
  isPreview: boolean;
  onError?: (payload: DisplayErrorPayload) => void;
}

interface UseDisplaySyncResult {
  settings: MosqueSettings;
  currentScreen: Screen;
  currentTheme: string;
  connectionStatus: ConnectionStatus;
}

export function useDisplaySync(
  mosque: Mosque,
  screen: Screen,
  initialSettings: MosqueSettings,
  slug: string,
  options: UseDisplaySyncOptions,
): UseDisplaySyncResult {
  const { themeOverride, isPreview, onError } = options;

  const [settings, setSettings] = useState(initialSettings);
  const [currentScreen, setCurrentScreen] = useState(screen);
  const [currentTheme, setCurrentTheme] = useState(themeOverride || screen.theme);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const presenceJoined = useRef(false);

  const isOnline = useOnlineStatus();
  const isVisible = useDocumentVisible();

  // Track previous states for transition detection
  const prevOnlineRef = useRef(isOnline);
  const prevVisibleRef = useRef(isVisible);

  const refetchSettings = useCallback(async () => {
    try {
      const supabase = supabaseRef.current ?? createClient();
      const { data } = await supabase
        .from('mosque_settings')
        .select('*')
        .eq('mosque_id', mosque.id)
        .single();

      if (data) {
        setSettings(toMosqueSettings(data as MosqueSettingsRow));
      }
    } catch (err) {
      onError?.({
        errorType: 'network_error',
        message: `Failed to refetch settings: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }, [mosque.id, onError]);

  const fetchYearlyIfStale = useCallback(async () => {
    if (isPreview) return;
    const existing = loadYearlyCache(slug);
    if (existing && !isYearlyCacheStale(existing)) return;

    try {
      const res = await fetch(`/api/display/${slug}/yearly-times`);
      if (res.ok) {
        const times: Record<string, PrayerTimesMap> = await res.json();
        saveYearlyCache(slug, times);
      }
    } catch (err) {
      onError?.({
        errorType: 'network_error',
        message: `Failed to fetch yearly times: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }, [isPreview, slug, onError]);

  // React to online/visible transitions
  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    const wasHidden = !prevVisibleRef.current;

    prevOnlineRef.current = isOnline;
    prevVisibleRef.current = isVisible;

    if (!isOnline) {
      setConnectionStatus('offline');
      return;
    }

    // Came back online or became visible
    if ((wasOffline && isOnline) || (wasHidden && isVisible)) {
      setConnectionStatus('reconnecting');
      refetchSettings().then(() => setConnectionStatus('connected'));
      fetchYearlyIfStale();
    }
  }, [isOnline, isVisible, refetchSettings, fetchYearlyIfStale]);

  // Realtime subscriptions
  useEffect(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    const supabase = supabaseRef.current;

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
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('reconnecting');
        } else if (status === 'TIMED_OUT') {
          setConnectionStatus('offline');
        }
      });

    // Screen record changes
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
        },
      )
      .subscribe();

    // Broadcast commands + presence
    const commandChannel = supabase
      .channel(`screen:${screen.id}`)
      .on('broadcast', { event: 'command' }, ({ payload }) => {
        const cmd = payload as ScreenCommand;
        if (cmd.type === 'refresh') {
          window.location.reload();
        }
      });

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

    // Fetch yearly on mount
    fetchYearlyIfStale();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(screenChannel);
      supabase.removeChannel(commandChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mosque.id, screen.id, themeOverride, isPreview]);

  return { settings, currentScreen, currentTheme, connectionStatus };
}
