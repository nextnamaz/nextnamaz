'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { LandingCopy } from '@/lib/landing-copy';
import type { SupportedLocale } from '@/types/locale';
import { isRtlLocale, resolveDisplayLocale } from '@/lib/display-locale';
import { cn } from '@/lib/utils';
import { SceneLayer, SceneTv, StepForeground, StepScreen, StepStage } from './step-scenes';

const PANEL_ID = 'how-panel';
/** The fixed navbar the pinned panel sits under, in px (top-16). */
const NAV_PX = 64;
/** Breathing room kept around the pinned panel, in px. */
const PIN_ROOM = 8;

/** Share of the whole scroll through the track spent on each step, 0 to 1 per step. */
const segment = (i: number, count: number) => `clamp(0, calc(var(--how-p, 0) * ${count} - ${i}), 1)`;

/**
 * The three steps, driven by scrolling.
 *
 * The section is a tall track with the steps pinned inside it, under the
 * navbar. Scrolling through the track moves the steps on, one third of it
 * each, while the picture crossfades; past the last step the panel lets go
 * and the page carries on. Picking a step scrolls to it, so the scroll and
 * the step can never disagree. It pins whenever the steps fit the visible
 * height under the navbar, measured, so zoom, window size and the length of
 * a language's words all count; where they do not fit (a phone held
 * sideways, a very short window) it is a plain set of tabs.
 *
 * The scroll position reaches the page as a CSS variable, not React state,
 * so the progress bars move every frame without re-rendering anything. Only
 * a change of step renders.
 *
 * One stage serves every width: beside the list from lg, above the step's
 * words below it.
 */
interface HowItWorksStepperProps {
  steps: LandingCopy['howItWorks']['steps'];
  display: SupportedLocale;
}

export function HowItWorksStepper({ steps, display }: HowItWorksStepperProps) {
  const count = steps.length;
  const [active, setActive] = useState(0);
  /** The step fading out, kept mounted until its fade ends. */
  const [leaving, setLeaving] = useState<number | null>(null);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)', true);
  // Assume it fits until measured: most screens do, and the page then renders its final height first.
  const [pinned, setPinned] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);

  // Pin only when the steps fit between the navbar and the bottom of the window.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => setPinned(grid.getBoundingClientRect().height <= window.innerHeight - NAV_PX - PIN_ROOM);
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const show = (index: number) => {
    if (index === activeRef.current) return;
    setLeaving(reduced ? null : activeRef.current);
    activeRef.current = index;
    setActive(index);
  };

  /** How far through the track the panel is, 0 at the pin and 1 at the release. */
  const progressOf = (track: HTMLElement) => {
    const rect = track.getBoundingClientRect();
    const range = rect.height - (window.innerHeight - NAV_PX);
    return range > 0 ? Math.min(1, Math.max(0, (NAV_PX - rect.top) / range)) : 0;
  };

  /** One frame's work: publish the scroll to CSS, and move the step on if its third is reached. */
  const onFrame = useEffectEvent((track: HTMLElement) => {
    const p = progressOf(track);
    track.style.setProperty('--how-p', p.toFixed(4));
    show(Math.min(count - 1, Math.floor(p * count)));
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !pinned) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      onFrame(track);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [pinned]);

  const pick = (index: number) => {
    const track = trackRef.current;
    if (!pinned || !track) {
      show(index);
      return;
    }
    // Land in the middle of the step's third of the track; the scroll does the rest.
    const rect = track.getBoundingClientRect();
    const range = rect.height - (window.innerHeight - NAV_PX);
    const top = window.scrollY + rect.top - NAV_PX + range * ((index + 0.5) / count);
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = count - 1;
    // On a right-to-left page the next step is to the left.
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const targets: Record<string, number> = {
      ArrowDown: Math.min(last, active + 1),
      [rtl ? 'ArrowLeft' : 'ArrowRight']: Math.min(last, active + 1),
      ArrowUp: Math.max(0, active - 1),
      [rtl ? 'ArrowRight' : 'ArrowLeft']: Math.max(0, active - 1),
      Home: 0,
      End: last,
    };
    const next = targets[e.key];
    if (next === undefined) return;
    e.preventDefault();
    // Focus moves within the list that has it: the cards or the bar.
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus({ preventScroll: true });
    pick(next);
  };

  // The last step, the live display, stays mounted under the others, so moving on to it is only a fade.
  const mounted = (i: number) => i === active || i === leaving || i === count - 1;
  const rtl = isRtlLocale(resolveDisplayLocale(display));

  return (
    <div ref={trackRef} className={cn('relative mt-12 sm:mt-14', pinned && 'h-[calc(100svh-4rem+150svh)]')}>
      <div className={cn('flex items-center-safe', pinned && 'sticky top-16 h-[calc(100svh-4rem)]')}>
        <div ref={gridRef} className="grid w-full grid-cols-1 items-center gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] lg:gap-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-14">
          {/* lg and up: the steps as a vertical list of cards. */}
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-labelledby="how-title"
            onKeyDown={onKeyDown}
            className="hidden flex-col gap-1.5 lg:flex"
          >
            {steps.map((step, i) => {
              const on = i === active;
              return (
                <button
                  key={step.title}
                  type="button"
                  role="tab"
                  id={`how-tab-${i}`}
                  aria-selected={on}
                  aria-controls={PANEL_ID}
                  aria-labelledby={`how-tab-${i}-title`}
                  aria-describedby={`how-tab-${i}-text how-tab-${i}-detail`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => pick(i)}
                  className={cn(
                    // Viewports 800px tall or less set the cards tighter, so all three fit the pinned panel in any language.
                    'flex w-full gap-4 rounded-2xl px-5 pt-[18px] pb-6 text-start [@media(max-height:50rem)]:pt-3 [@media(max-height:50rem)]:pb-5 outline-none transition-[background-color,box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none',
                    on
                      ? 'bg-card shadow-[0_1px_2px_rgba(38,24,10,0.05),0_12px_32px_-16px_rgba(38,24,10,0.22)] ring-1 ring-border/80'
                      : 'hover:bg-secondary/70'
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'mt-px flex size-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold tabular-nums transition-colors duration-300',
                      on ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'
                    )}
                  >
                    {i + 1}
                  </span>

                  <span className="relative min-w-0 flex-1">
                    <span
                      id={`how-tab-${i}-title`}
                      className={cn(
                        'block text-[20px] leading-snug font-semibold tracking-[-0.02em] text-pretty transition-colors duration-300 [@media(max-height:50rem)]:text-[18px]',
                        on ? 'text-foreground' : 'text-foreground/80'
                      )}
                    >
                      {step.title}
                    </span>
                    <span
                      id={`how-tab-${i}-text`}
                      className="mt-1.5 block text-[15px] leading-relaxed text-pretty text-muted-foreground [@media(max-height:50rem)]:text-[14px] [@media(max-height:50rem)]:leading-normal"
                    >
                      {step.description}
                    </span>
                    <span
                      id={`how-tab-${i}-detail`}
                      className={cn(
                        'mt-3 flex items-start gap-2 text-[14px] leading-normal font-medium text-pretty transition-colors duration-300 [@media(max-height:50rem)]:mt-2',
                        on ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'mt-[7px] size-1.5 shrink-0 rounded-full transition-colors duration-300',
                          on ? 'bg-primary' : 'bg-border'
                        )}
                      />
                      {step.detail}
                    </span>

                    {pinned && (
                      <span aria-hidden className="absolute inset-x-0 -bottom-3 h-[3px] overflow-hidden rounded-full bg-border/60">
                        <span
                          className="block h-full origin-left rounded-full rtl:origin-right bg-primary"
                          style={{ transform: `scaleX(${segment(i, count)})` }}
                        />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* The one stage, for every width. */}
          <div
            role="tabpanel"
            id={PANEL_ID}
            aria-label={steps[active]?.title}
            className="lg:col-start-2 lg:row-start-1"
          >
            <StepStage withPhone label={steps[active]?.sceneAlt}>
              <SceneTv>
                {steps.map((step, i) => (
                  <SceneLayer key={step.title} on={i === active} hold>
                    {mounted(i) && <StepScreen index={i} display={display} />}
                  </SceneLayer>
                ))}
              </SceneTv>
              {steps.map((step, i) => (
                <SceneLayer
                  key={step.title}
                  on={i === active}
                  onFadedOut={() => setLeaving((l) => (l === i ? null : l))}
                >
                  {mounted(i) && <StepForeground index={i} rtl={rtl} />}
                </SceneLayer>
              ))}
            </StepStage>
          </div>

          {/* Below lg: a segmented bar for the steps, then the step's words. */}
          <div className="lg:hidden">
            <div role="tablist" aria-labelledby="how-title" onKeyDown={onKeyDown} className="flex gap-2">
              {steps.map((step, i) => {
                const on = i === active;
                return (
                  <button
                    key={step.title}
                    type="button"
                    role="tab"
                    id={`how-tab-m-${i}`}
                    aria-selected={on}
                    aria-controls={PANEL_ID}
                    aria-label={step.title}
                    tabIndex={on ? 0 : -1}
                    onClick={() => pick(i)}
                    className="flex-1 rounded-full py-3 outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                  >
                    <span className="block h-1 overflow-hidden rounded-full bg-border">
                      <span
                        className={cn('block h-full origin-left rounded-full rtl:origin-right bg-primary', !pinned && (i <= active ? 'scale-x-100' : 'scale-x-0'))}
                        style={pinned ? { transform: `scaleX(${segment(i, count)})` } : undefined}
                      />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Every step's words share one cell, so the block keeps its height as they change. */}
            <div className="mt-3 grid">
              {steps.map((step, i) => {
                const on = i === active;
                return (
                  <div
                    key={step.title}
                    aria-hidden={!on}
                    className={cn(
                      'flex gap-4 [grid-area:1/1] transition-opacity duration-300 motion-reduce:transition-none',
                      on ? 'opacity-100' : 'pointer-events-none opacity-0'
                    )}
                  >
                    <span
                      aria-hidden
                      className="mt-px flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[14px] font-bold tabular-nums text-primary-foreground"
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 max-w-[62ch]">
                      <h3 className="text-[20px] leading-snug font-semibold tracking-[-0.02em] text-pretty">{step.title}</h3>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-pretty text-muted-foreground">{step.description}</p>
                      <p className="mt-3 flex items-start gap-2 text-[14px] font-medium text-[#3E3A30]">
                        <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary" />
                        {step.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
