'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LandingCopy } from '@/lib/landing-copy';
import type { SupportedLocale } from '@/types/locale';
import { cn } from '@/lib/utils';
import { PlaygroundPanel } from './playground-panel';
import type { GhostField, PlaygroundSettings } from './playground-panel';
import { ScreenPlaceholder } from './screen-placeholder';
import { TvFrame } from './tv-frame';

/* Client-only: the themes read the visitor's clock. The placeholder is the
   Default theme's blocks in its own colours, inside the same frame, so the
   live screen swaps in without a shift. */
const PlaygroundScreen = dynamic(() => import('./playground-screen').then((m) => m.PlaygroundScreen), {
  ssr: false,
  loading: () => <ScreenPlaceholder />,
});

/** The line the demo screens carry: the bismillah. */
const BISMILLAH = 'بسم الله الرحمن الرحيم';

function startingSettings(language: SupportedLocale): PlaygroundSettings {
  return {
    language,
    theme: 'default',
    mode: 'light',
    scheme: 'classic',
    accent: 'amber',
    line: BISMILLAH,
    blackout: false,
  };
}

interface GhostStep {
  /** Wait after the previous step, in ms. */
  wait: number;
  field: GhostField;
  change: Partial<PlaygroundSettings>;
}

/**
 * The demo that plays once for a visitor who has not touched anything:
 * another language, then Dark, then the Night theme, then back to the start.
 * Mode comes before theme because Mode belongs to Default: under Night it has
 * nothing to change.
 */
function ghostSteps(start: PlaygroundSettings): GhostStep[] {
  return [
    { wait: 1100, field: 'language', change: { language: start.language === 'ar' ? 'en' : 'ar' } },
    { wait: 2600, field: 'mode', change: { mode: 'dark' } },
    { wait: 2600, field: 'theme', change: { theme: 'night' } },
    { wait: 3000, field: 'reset', change: start },
  ];
}
/** How long the last light stays on after the demo has put everything back. */
const GHOST_TAIL = 1400;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

interface PlaygroundStageProps {
  t: LandingCopy['display'];
  /** The language the screen starts in: the page's own. */
  display: SupportedLocale;
}

/**
 * Try it yourself: the real display on a set on the wall, and beside it the
 * settings a phone would show for it. Every change reaches the screen at once.
 */
export function PlaygroundStage({ t, display }: PlaygroundStageProps) {
  const start = useMemo(() => startingSettings(display), [display]);
  const [settings, setSettings] = useState<PlaygroundSettings>(start);
  const [ghost, setGhost] = useState<GhostField | null>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  /** Ends the ghost demo for good. Replaced by the effect once it is armed. */
  const stopGhost = useRef<() => void>(() => {});

  // The ghost demo: it starts once the set is well in view, starts over if the
  // visitor scrolls away before it ends, and never runs again once it has
  // finished or the visitor has touched a control. Not at all for reduced motion.
  useEffect(() => {
    const wall = wallRef.current;
    if (!wall || window.matchMedia(REDUCED_MOTION).matches) return;

    let phase: 'waiting' | 'playing' | 'over' = 'waiting';
    let timers: number[] = [];
    const clear = () => {
      for (const id of timers) window.clearTimeout(id);
      timers = [];
    };
    const finish = () => {
      phase = 'over';
      clear();
      io.disconnect();
      setGhost(null);
    };
    const play = () => {
      phase = 'playing';
      let at = 0;
      for (const step of ghostSteps(start)) {
        at += step.wait;
        timers.push(
          window.setTimeout(() => {
            setSettings((current) => ({ ...current, ...step.change }));
            setGhost(step.field);
          }, at)
        );
      }
      timers.push(window.setTimeout(finish, at + GHOST_TAIL));
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry || phase === 'over') return;
        if (entry.isIntersecting && phase === 'waiting') play();
        else if (!entry.isIntersecting && phase === 'playing') {
          clear();
          phase = 'waiting';
          setSettings(start);
          setGhost(null);
        }
      },
      { threshold: 0.6 }
    );
    io.observe(wall);
    stopGhost.current = () => {
      if (phase === 'over') return;
      // Put back what the demo changed first. This runs on the first pointer, key or focus
      // in the panel, before the control's own change, so the visitor's choice lands on the
      // page's own settings and not on the demo's Arabic, Dark or Night.
      if (phase === 'playing') setSettings(start);
      finish();
    };
    return () => {
      io.disconnect();
      clear();
      stopGhost.current = () => {};
    };
  }, [start]);

  const change = (patch: Partial<PlaygroundSettings>) => setSettings((current) => ({ ...current, ...patch }));

  return (
    <div className="grid gap-5 lg:grid-cols-12 lg:gap-6 xl:gap-8">
      {/* Below lg, where the settings sit under the set, the set stays in view while they
          scroll past, on screens tall enough to hold both. A band of page ground above and
          below it hides the settings as they pass under. */}
      <div
        className={cn(
          // From lg the stage hugs the set, and stays beside the settings while they scroll past.
          'flex lg:sticky lg:top-24 lg:col-span-8 lg:self-start',
          'max-lg:[@media(min-height:40rem)]:sticky max-lg:[@media(min-height:40rem)]:top-16 max-lg:[@media(min-height:40rem)]:z-10',
          'max-lg:[@media(min-height:40rem)]:-mx-6 max-lg:[@media(min-height:40rem)]:-my-2.5 max-lg:[@media(min-height:40rem)]:bg-background max-lg:[@media(min-height:40rem)]:px-6 max-lg:[@media(min-height:40rem)]:py-2.5'
        )}
      >
        {/* The wall: plaster in soft light. */}
        <div
          ref={wallRef}
          className="relative isolate flex flex-1 items-center justify-center overflow-hidden rounded-3xl px-4 py-7 sm:px-10 sm:py-12 lg:px-10 xl:px-12"
          style={{ background: 'linear-gradient(165deg, #F6F4F0 0%, #EDEAE4 100%)' }}
        >
          {/* A picture light above the set, and the wall's recess. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,255,255,0.7),transparent_75%)] shadow-[inset_0_1px_2px_rgba(38,24,10,0.06),inset_0_14px_28px_-20px_rgba(38,24,10,0.16),inset_0_0_0_1px_rgba(38,24,10,0.05)]"
          />
          <div role="img" aria-label={t.screenAlt} className="w-full">
            <TvFrame>
              <PlaygroundScreen settings={settings} />
            </TvFrame>
          </div>
        </div>
      </div>

      <PlaygroundPanel
        t={t}
        settings={settings}
        onChange={change}
        onReset={() => setSettings(start)}
        ghost={ghost}
        onInteract={() => stopGhost.current()}
        className="lg:col-span-4"
      />
    </div>
  );
}
