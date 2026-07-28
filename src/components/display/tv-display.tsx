'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { THEME_REGISTRY } from '@/components/display/themes';
import type { ThemeProps } from '@/components/display/themes';
import { resolveDisplayLocale, isRtlLocale } from '@/lib/display-locale';
import { asRecord, asStringRecord } from '@/types/database';
import type { Screen, PrayerTimesMap } from '@/types/database';
import { getNextPrayer, prayerTimesMapToEntries } from '@/types/prayer';
import type { PrayerTimeEntry } from '@/types/prayer';
import { SCREEN_STORAGE_KEY } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

const OVERLAY_HIDE_MS = 15_000;

function useViewportPortrait(): boolean {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const update = () => setPortrait(window.innerHeight > window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return portrait;
}

function useNextPrayer(prayers: PrayerTimeEntry[]): PrayerTimeEntry | null {
  const [next, setNext] = useState<PrayerTimeEntry | null>(null);
  useEffect(() => {
    const update = () => setNext(getNextPrayer(prayers));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [prayers]);
  return next;
}

interface TvDisplayProps {
  screen: Screen;
  todayTimes: PrayerTimesMap;
  settingsUrl: string;
}

export function TvDisplay({ screen, todayTimes, settingsUrl }: TvDisplayProps) {
  const router = useRouter();
  const isPortrait = useViewportPortrait();
  const [overlayVisible, setOverlayVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live updates: saving on the phone broadcasts on screen:<id>. Refreshing
  // on every SUBSCRIBED also catches up after a websocket drop, when
  // broadcasts sent during the gap are lost.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`screen:${screen.id}`)
      .on('broadcast', { event: 'command' }, () => router.refresh());
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') router.refresh();
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [screen.id, router]);

  // Safety net if realtime is down entirely: refetch fast while waiting for
  // setup, slowly once configured. Refreshing fails soft when offline.
  useEffect(() => {
    const ms = screen.configured ? 15 * 60_000 : 8_000;
    const id = setInterval(() => router.refresh(), ms);
    return () => clearInterval(id);
  }, [screen.configured, router]);

  // Refresh just past local midnight so the new day's times appear promptly
  // instead of waiting for the next poll. Re-arms after each day's data loads.
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const id = setTimeout(() => router.refresh(), nextMidnight.getTime() - now.getTime() + 5_000);
    return () => clearTimeout(id);
  }, [todayTimes, router]);

  // Daily hard reload to pick up app updates — only when reachable, so a
  // flaky connection never strands the kiosk on an error page.
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
        if (res.ok) window.location.reload();
      } catch {
        // offline — keep showing what we have
      }
    }, 24 * 60 * 60_000);
    return () => clearInterval(id);
  }, []);

  const showOverlay = useCallback(() => {
    setOverlayVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setOverlayVisible(false), OVERLAY_HIDE_MS);
  }, []);

  const hideOverlay = useCallback(() => {
    setOverlayVisible(false);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  // Any mouse/remote/keyboard activity brings the QR overlay back.
  useEffect(() => {
    if (!screen.configured) return;
    const events: (keyof WindowEventMap)[] = ['pointermove', 'pointerdown', 'keydown'];
    events.forEach((e) => window.addEventListener(e, showOverlay));
    return () => {
      events.forEach((e) => window.removeEventListener(e, showOverlay));
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [screen.configured, showOverlay]);

  const startOver = () => {
    if (!confirm('Set up this TV as a new screen? Current settings stay reachable via their link.')) return;
    localStorage.removeItem(SCREEN_STORAGE_KEY);
    router.push('/s');
  };

  const displayLocale = useMemo(
    () => resolveDisplayLocale(screen.locale, asStringRecord(screen.display_text)),
    [screen.locale, screen.display_text]
  );
  const prayers = useMemo(
    () => prayerTimesMapToEntries(todayTimes, displayLocale.prayerNames),
    [todayTimes, displayLocale]
  );
  const nextPrayer = useNextPrayer(prayers);

  if (!screen.configured) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-8 text-center">
        <Logo size="lg" />
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Scan to set up this screen</h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Open your phone camera and scan the code. Prayer times appear here the moment you save.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <QRCodeSVG value={settingsUrl} size={280} level="M" />
        </div>
        <p className="text-sm text-muted-foreground font-mono">{settingsUrl}</p>
      </div>
    );
  }

  const themeDef = THEME_REGISTRY[screen.theme] ?? THEME_REGISTRY['default'];
  const ThemeComponent = themeDef.component;
  const themeProps: ThemeProps = {
    prayers,
    nextPrayer,
    config: { ...themeDef.defaultConfig, ...asRecord(screen.theme_config) },
    isPortrait,
    locale: displayLocale,
  };

  return (
    <div
      dir={isRtlLocale(displayLocale) ? 'rtl' : 'ltr'}
      className={overlayVisible ? undefined : 'cursor-none'}
    >
      {/* Themes size their text with container-query units, so they need an
          explicitly sized container with containerType: size. */}
      <div
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          containerType: 'size' as CSSProperties['containerType'],
        }}
      >
        <ThemeComponent {...themeProps} />
      </div>

      {overlayVisible && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8" dir="ltr">
          <div className="bg-background rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 max-w-sm text-center">
            <h2 className="text-xl font-semibold">Screen settings</h2>
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG value={settingsUrl} size={180} level="M" />
            </div>
            <p className="text-sm text-muted-foreground">
              Scan with your phone to change prayer times, language or theme.
            </p>
            <p className="text-xs text-muted-foreground font-mono break-all">{settingsUrl}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={hideOverlay}>Hide</Button>
              <Button variant="ghost" className="text-destructive" onClick={startOver}>
                New setup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
