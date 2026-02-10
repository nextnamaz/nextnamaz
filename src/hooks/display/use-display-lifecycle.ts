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
  isPreview: boolean;
  themeOverride?: string;
  onError?: (payload: DisplayErrorPayload) => void;
}

export function useDisplayLifecycle(
  cacheData: CacheData,
  options: UseDisplayLifecycleOptions,
): void {
  const { slug, isPreview, themeOverride, onError } = options;
  const lastRenderTimestamp = useRef(Date.now());

  // Update watchdog heartbeat every time cacheData changes
  lastRenderTimestamp.current = Date.now();

  // Cache to localStorage on mount and updates
  useEffect(() => {
    saveDisplayCache(slug, cacheData);
  }, [slug, cacheData]);

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

  // Service worker registration
  useEffect(() => {
    if (isPreview || themeOverride) return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/display-sw.js', { scope: '/display/' }).catch((err) => {
        console.warn('[PrayerDisplay] SW registration failed:', err);
      });
    }
  }, [isPreview, themeOverride]);
}
