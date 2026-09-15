'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { resolveTheme } from '@/components/display/themes';
import { defaultDefinition } from '@/components/display/themes/default';
import type { ThemeProps } from '@/components/display/themes';
import { resolveDisplayLocale, isRtlLocale } from '@/lib/display-locale';
import Image from 'next/image';
import { asDisplayConfig, asRecord, asStringRecord } from '@/types/database';
import type { Screen, PrayerTimesMap } from '@/types/database';
import { getNextPrayer, prayerTimesMapToEntries } from '@/types/prayer';
import type { PrayerTimeEntry } from '@/types/prayer';
import { SCREEN_STORAGE_KEY } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { useBlackout, useControlQr, useSlideshow } from './use-schedule';

const OVERLAY_HIDE_MS = 10_000;

/** Sits under the corner QR after each prayer. Short: it renders very small. */
const CONTROL_QR_CAPTION = 'Scan to manage';

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
  const fitConfig = useMemo(() => asDisplayConfig(screen.display_config), [screen.display_config]);
  const blackout = useBlackout(prayers, fitConfig.blackout.enabled, fitConfig.blackout.minutes);
  const controlQrVisible = useControlQr(prayers, fitConfig.controlQr.enabled);
  const { slide, onMediaEnd } = useSlideshow(
    fitConfig.announcements.items,
    fitConfig.announcements.enabled,
    fitConfig.announcements.intervalMin,
    fitConfig.announcements.showSeconds
  );

  if (!screen.configured) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-8 text-center">
        <Logo size="lg" />
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground border-b border-border pb-2.5 mb-6">
            Step 2 of 2 &middot; On your phone
          </p>
          <h1 className="text-4xl sm:text-5xl tracking-[-0.015em] mb-4">Scan to set up this screen</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Open your phone camera and scan the code. Prayer times appear here the moment you save.
          </p>
        </div>
        <div className="bg-white p-6 rounded-md border border-border">
          <QRCodeSVG value={settingsUrl} size={280} level="M" />
        </div>
        <p className="text-sm text-muted-foreground font-mono">{settingsUrl}</p>
      </div>
    );
  }

  // An unknown saved theme must never blank the TV: fall back to the default.
  const themeDef = resolveTheme(screen.theme) ?? defaultDefinition;
  const ThemeComponent = themeDef.component;
  // Short form of the settings address for the overlay link — the QR carries
  // the full secret, the text only needs to be recognisable.
  const settingsDisplay = settingsUrl
    .replace(/^https?:\/\//, '')
    .replace(/(\/s\/[0-9a-f]{8})[0-9a-f-]+$/i, '$1…');
  const fit = fitConfig;
  const sideways = fit.rotation === 90 || fit.rotation === 270;
  // A physically rotated TV reports the opposite viewport orientation.
  const displayPortrait = sideways ? !isPortrait : isPortrait;
  const slideVisible = !!slide && !blackout;
  const splitActive = slideVisible && fit.announcements.layout === 'split';
  const themeProps: ThemeProps = {
    prayers,
    nextPrayer,
    config: { ...themeDef.defaultConfig, ...asRecord(screen.theme_config) },
    // Splitting halves the long axis, which flips the half's orientation.
    isPortrait: splitActive ? !displayPortrait : displayPortrait,
    locale: displayLocale,
  };

  const slideMedia =
    slide &&
    (slide.kind === 'video' ? (
      <video
        key={slide.path}
        src={slide.url}
        autoPlay
        muted
        playsInline
        onEnded={onMediaEnd}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
      />
    ) : (
      <Image src={slide.url} alt="" fill unoptimized className="object-contain" />
    ));

  // For 90/270 the sized container swaps dimensions and is rotated back into
  // place, so themes (and their container queries) see the upright geometry.
  const rotationStyle: CSSProperties =
    fit.rotation === 180
      ? { transform: 'rotate(180deg)' }
      : sideways
        ? {
            width: '100vh',
            height: '100vw',
            transformOrigin: 'top left',
            transform:
              fit.rotation === 90
                ? 'rotate(90deg) translateY(-100%)'
                : 'rotate(-90deg) translateX(-100%)',
          }
        : {};

  return (
    <div
      dir={isRtlLocale(displayLocale) ? 'rtl' : 'ltr'}
      className={overlayVisible ? undefined : 'cursor-none'}
    >
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
        {/* Zoom compensates TV overscan; margins fall in the cropped band. */}
        <div
          style={{
            width: '100%',
            height: '100%',
            ...(fit.zoom < 1 ? { transform: `scale(${fit.zoom})` } : {}),
          }}
        >
          <div
            style={{
              width: '100vw',
              height: '100vh',
              overflow: 'hidden',
              ...rotationStyle,
            }}
          >
            {/* Split view shares the screen between times and announcement. */}
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: displayPortrait ? 'column' : 'row',
              }}
            >
              {/* Themes size their text with container-query units, so they
                  need an explicitly sized container with containerType: size. */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 0,
                  position: 'relative',
                  overflow: 'hidden',
                  containerType: 'size' as CSSProperties['containerType'],
                }}
              >
                <ThemeComponent {...themeProps} />
              </div>
              {splitActive && (
                <div style={{ flex: 1, position: 'relative', background: '#000' }}>
                  {slideMedia}
                </div>
              )}
            </div>

            {/* Full-screen announcement takeover. */}
            {slideVisible && !splitActive && (
              <div className="absolute inset-0 z-40 bg-black">{slideMedia}</div>
            )}

            {/* Dark screen while the congregation prays. */}
            <div
              aria-hidden
              className="absolute inset-0 z-45 bg-black transition-opacity duration-1000"
              style={{ opacity: blackout ? 1 : 0, pointerEvents: 'none' }}
            />

            {/* Control QR, for a while after each prayer. Sits above the
                blackout on purpose: a kiosk has nothing to wiggle, so this is
                the only way into the settings, and waiting for the screen to
                lift would hide it from the people standing in the room. */}
            <div
              dir="ltr"
              data-control-qr={controlQrVisible ? 'visible' : 'hidden'}
              className="absolute bottom-[3%] right-[3%] z-46 flex flex-col items-center rounded-[0.6vmin] bg-white shadow-lg transition-opacity duration-700"
              style={{
                // Sized against the viewport, not in pixels: a fixed 104px is
                // a postage stamp on a 4K wall panel and a blot on a small
                // one. vmin keeps it the same fraction of the screen either
                // way, and the clamp stops it vanishing or dominating at the
                // extremes.
                padding: 'clamp(4px, 0.7vmin, 12px)',
                gap: 'clamp(2px, 0.35vmin, 6px)',
                opacity: controlQrVisible ? 1 : 0,
                pointerEvents: controlQrVisible ? undefined : 'none',
              }}
            >
              <QRCodeSVG
                value={settingsUrl}
                size={256}
                level="M"
                style={{ width: 'clamp(56px, 8vmin, 150px)', height: 'auto' }}
              />
              <span
                className="font-medium tracking-wide text-neutral-500"
                style={{ fontSize: 'clamp(6px, 0.85vmin, 13px)' }}
              >
                {CONTROL_QR_CAPTION}
              </span>
            </div>

            {overlayVisible && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8" dir="ltr">
                <div className="bg-background rounded-lg border border-border shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] p-8 flex flex-col items-center gap-5 max-w-sm text-center">
                  <h2 className="text-2xl">Screen settings</h2>
                  <div className="bg-white p-4 rounded-md border border-border">
                    <QRCodeSVG value={settingsUrl} size={180} level="M" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Scan with your phone to change prayer times, language or
                    theme, or open the settings on this TV:
                  </p>
                  <a
                    href={settingsUrl}
                    className="text-sm font-mono text-primary underline underline-offset-4 rounded-sm px-1 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {settingsDisplay}
                  </a>
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
        </div>
      </div>
    </div>
  );
}
