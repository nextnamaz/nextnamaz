import { useEffect, useRef } from 'react';
import type { Mosque, Screen, MosqueSettings } from '@/types/database';
import { saveDisplayCache } from '@/lib/display-cache';
import type { DisplayErrorPayload } from '@/lib/display-logger';
import { useInterval } from './use-interval';

interface CacheData {
  screen: Screen;
  mosque: Mosque;
  settings: MosqueSettings;
}

interface UseDisplayLifecycleOptions {
  slug: string;
  shortCode?: string;
  isPreview: boolean;
  themeOverride?: string;
  onError?: (payload: DisplayErrorPayload) => void;
}

export function useDisplayLifecycle(
  cacheData: CacheData,
  options: UseDisplayLifecycleOptions,
): void {
  const { slug, shortCode, isPreview, themeOverride, onError } = options;
  const lastRenderTimestamp = useRef(Date.now());

  // Update watchdog heartbeat every time cacheData changes
  lastRenderTimestamp.current = Date.now();

  // Cache to localStorage on mount and updates
  useEffect(() => {
    saveDisplayCache(slug, cacheData);
    // Save short_code → slug mapping so offline page can resolve /screen/[code] URLs
    if (shortCode) {
      try {
        localStorage.setItem(`nextnamaz:alias:${shortCode}`, slug);
      } catch { /* localStorage full */ }
    }
  }, [slug, shortCode, cacheData]);

  // Watchdog: reload if render stalls > 5 min
  useInterval(
    () => {
      const elapsed = Date.now() - lastRenderTimestamp.current;
      if (elapsed > 5 * 60 * 1000) {
        window.location.reload();
      }
    },
    isPreview ? null : 60000,
  );

  // Global error handlers
  useEffect(() => {
    if (isPreview) return;

    const handleError = (e: ErrorEvent) => {
      console.error('[PrayerDisplay] Uncaught error:', e.error);
      e.preventDefault();
      onError?.({
        errorType: 'unhandled_error',
        message: e.message || String(e.error),
        stack: e.error?.stack,
      });
    };

    const handleRejection = (e: PromiseRejectionEvent) => {
      console.error('[PrayerDisplay] Unhandled rejection:', e.reason);
      e.preventDefault();
      onError?.({
        errorType: 'unhandled_rejection',
        message: e.reason instanceof Error ? e.reason.message : String(e.reason),
        stack: e.reason instanceof Error ? e.reason.stack : undefined,
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [isPreview, onError]);

  // Service worker registration (covers /display/ and /screen/ routes)
  useEffect(() => {
    if (isPreview || themeOverride) return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/display-sw.js', { scope: '/' }).catch((err) => {
      console.warn('[PrayerDisplay] SW registration failed:', err);
    });

    // On first SW activation, reload so all resources get cached through the SW.
    // Uses a sessionStorage flag to avoid infinite reload loops.
    const SW_READY_KEY = 'nextnamaz:sw-ready';
    if (!sessionStorage.getItem(SW_READY_KEY)) {
      navigator.serviceWorker.ready.then(() => {
        sessionStorage.setItem(SW_READY_KEY, '1');
        window.location.reload();
      });
    }
  }, [isPreview, themeOverride]);
}
