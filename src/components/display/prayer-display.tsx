'use client';

import { useMemo, useCallback } from 'react';
import type { Mosque, Screen, MosqueSettings } from '@/types/database';
import { asRecord, getScreenControls } from '@/types/database';
import { getMosqueTimezone } from '@/lib/display-cache';
import { resolveDisplayLocale } from '@/lib/display-locale';
import { createDisplayLogger } from '@/lib/display-logger';
import type { DisplayErrorPayload } from '@/lib/display-logger';
import { useDisplaySync, usePrayerTimes, useDisplayLifecycle } from '@/hooks/display';
import { THEME_REGISTRY } from './themes';
import { DisplayErrorBoundary } from './display-error-boundary';
import { ConnectionIndicator } from './connection-indicator';

interface PrayerDisplayProps {
  mosque: Mosque;
  screen: Screen;
  settings: MosqueSettings;
  themeOverride?: string;
  isPreview?: boolean;
}

export function PrayerDisplay({
  mosque,
  screen,
  settings: initialSettings,
  themeOverride,
  isPreview = false,
}: PrayerDisplayProps) {
  // Error logger (stable across renders via useMemo)
  const logger = useMemo(
    () => createDisplayLogger({ screenId: screen.id, slug: screen.slug, enabled: !isPreview }),
    [screen.id, screen.slug, isPreview],
  );

  const onError = useCallback(
    (payload: DisplayErrorPayload) => logger.logError(payload),
    [logger],
  );

  // Realtime sync: settings, screen, theme, connection status
  const { settings, currentScreen, currentTheme, connectionStatus } = useDisplaySync(
    mosque,
    screen,
    initialSettings,
    screen.slug,
    { themeOverride, isPreview, onError },
  );

  // Resolve display locale from settings
  const displayLocale = useMemo(() => resolveDisplayLocale(settings), [settings]);

  // Prayer time derivation (zero effects)
  const mosqueTimezone = getMosqueTimezone(settings);
  const { prayers, nextPrayer } = usePrayerTimes(
    settings, screen.slug, mosqueTimezone, isPreview, displayLocale.prayerNames,
  );

  // Lifecycle: cache, watchdog, SW, global error handlers
  const cacheData = useMemo(
    () => ({ screen: currentScreen, mosque, settings }),
    [currentScreen, mosque, settings],
  );
  useDisplayLifecycle(cacheData, { slug: screen.slug, shortCode: screen.short_code, isPreview, themeOverride, onError });

  // Screen display controls
  const controls = getScreenControls(currentScreen);
  const isPortrait = Number(controls.rotation) === 90 || Number(controls.rotation) === 270;
  const scaleFactor = controls.zoom / 100;

  const themeProps = {
    mosqueName: mosque.name,
    prayers,
    nextPrayer,
    config: asRecord(currentScreen.theme_config),
    isPortrait,
    locale: displayLocale,
  };

  const def = THEME_REGISTRY[currentTheme] ?? THEME_REGISTRY['default'];
  const ThemeComponent = def.component;

  const renderTheme = () => (
    <DisplayErrorBoundary mosqueName={mosque.name} prayers={prayers} onError={onError}>
      <ThemeComponent {...themeProps} />
    </DisplayErrorBoundary>
  );

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
    <div
      style={{
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
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          containerType: 'size' as React.CSSProperties['containerType'],
          transform: scaleFactor !== 1 ? `scale(${scaleFactor})` : undefined,
          transformOrigin: 'center center',
        }}
      >
        {renderTheme()}
      </div>
      <ConnectionIndicator status={connectionStatus} />
    </div>
  );
}
