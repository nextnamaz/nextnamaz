'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { LANGUAGES } from '@/lib/locale/presets';
import { resolveDisplayLocale } from '@/lib/display-locale';
import type { SupportedLocale } from '@/types/locale';
import { cn } from '@/lib/utils';
import { Reveal } from './reveal';
import { TvFrame } from './tv-frame';
import { AnatomyBadge } from './screen-anatomy-badge';
import { ScreenPlaceholder } from './screen-placeholder';

/* Client-only: the theme reads the clock. The placeholder is the theme's own
   blocks in its own colours, inside the same TvFrame, so the live screen
   swaps in without a shift or a flash. */
const AnatomyScreen = dynamic(() => import('./screen-anatomy-screen').then((m) => m.AnatomyScreen), {
  ssr: false,
  loading: () => <ScreenPlaceholder />,
});

/** Below md the legend is a swipeable strip under the set, one part at a time. */
const NARROW = '(max-width: 767.98px)';

function subscribeToNarrow(onChange: () => void): () => void {
  const query = window.matchMedia(NARROW);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const readNarrow = () => window.matchMedia(NARROW).matches;
const readNarrowOnServer = () => false;

interface Callout {
  readonly title: string;
  readonly body: string;
}

interface AnatomyStageProps {
  callouts: readonly Callout[];
  languagesLabel: string;
  /** One line under the language switch on what it changes. */
  languagesNote?: string;
}

/**
 * The interactive part of "What the room sees": the language switch, the set
 * on its wall, and the legend. The legend is the content; the markers on the
 * screen only point at it.
 *
 * Which part is lit: on a desktop, the item or marker under the mouse, else
 * the one picked by focus or a tap. On a phone, the card in view in the strip,
 * and the screen zooms onto that part so it can be read.
 */
export function AnatomyStage({ callouts, languagesLabel, languagesNote }: AnatomyStageProps) {
  const [code, setCode] = useState<SupportedLocale>('en');
  const locale = useMemo(() => resolveDisplayLocale(code), [code]);
  const narrow = useSyncExternalStore(subscribeToNarrow, readNarrow, readNarrowOnServer);
  const [hovered, setHovered] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [inStrip, setInStrip] = useState(0);
  const active = narrow ? inStrip : (hovered ?? picked);
  const listRef = useRef<HTMLOListElement>(null);
  const bodyId = useId();

  useEffect(() => {
    const list = listRef.current;
    if (!narrow || !list) return;
    // Whichever card shows most wins. Entries alone mislead in a fast swipe,
    // when two cards can both be past any one threshold.
    const observer = new IntersectionObserver(
      () => {
        const strip = list.getBoundingClientRect();
        let best = 0;
        let most = -Infinity;
        Array.from(list.children).forEach((card, i) => {
          const r = card.getBoundingClientRect();
          const seen = Math.min(r.right, strip.right) - Math.max(r.left, strip.left);
          if (seen > most) {
            most = seen;
            best = i;
          }
        });
        setInStrip(best);
      },
      { root: list, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    for (const item of list.children) observer.observe(item);
    return () => observer.disconnect();
  }, [narrow]);

  /** Brings a card to the front of the strip, which then lights its part. */
  const showCard = (index: number) => {
    const list = listRef.current;
    const card = list?.children[index];
    if (!list || !(card instanceof HTMLElement)) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // The list is the card's offset parent; 24px is the strip's scroll padding.
    list.scrollTo({ left: card.offsetLeft - 24, behavior: still ? 'auto' : 'smooth' });
  };

  const pickFromScreen = (index: number) => {
    if (narrow) showCard(index);
    else setPicked((current) => (current === index ? null : index));
  };

  return (
    <>
      <Reveal delay={80} className="mt-12 sm:mt-14">
        {/* The wall: the hero's plaster, so the set hangs on a wall again.
            Same radius, gutter and recess as the step stages. */}
        <div className="relative isolate overflow-hidden rounded-3xl bg-[#E9E1D1] px-4 pt-9 pb-9 sm:px-10 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-20">
          {/* The hero wall. Unsplash, mk. s (kJL4SiTBXqg), Unsplash License. */}
          <Image
            src="/landing/hero-wall.jpg"
            alt=""
            fill
            sizes="(min-width: 1200px) 1152px, 100vw"
            className="-z-10 object-cover object-[50%_40%]"
          />
          {/* A picture light above the set, falling off toward the floor, and the
              step stages' recess (the photo would cover a shadow on the wall itself). */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-[inherit] bg-[radial-gradient(ellipse_55%_45%_at_50%_0%,rgba(255,251,242,0.55),transparent_75%),linear-gradient(to_bottom,transparent_55%,rgba(90,66,38,0.1))] shadow-[inset_0_1px_2px_rgba(38,24,10,0.10),inset_0_14px_28px_-18px_rgba(38,24,10,0.28),inset_0_0_0_1px_rgba(38,24,10,0.06)]"
          />

          <div role="group" aria-labelledby="display-languages" className="flex flex-col items-center text-center">
            <p id="display-languages" className="text-sm font-medium text-[#4A4538]">
              {languagesLabel}
            </p>
            {/* Three by three on a phone; two even rows on a tablet; one row from lg. */}
            <div className="mt-3 grid w-full max-w-[21rem] grid-cols-3 gap-1.5 sm:flex sm:max-w-[30rem] sm:flex-wrap sm:justify-center sm:gap-2 lg:max-w-none">
              {LANGUAGES.map((lang) => {
                const pressed = lang.code === code;
                return (
                  <Button
                    key={lang.code}
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-pressed={pressed}
                    onClick={() => setCode(lang.code)}
                    className={cn(
                      'h-8 px-3 text-[13px] font-medium shadow-[0_1px_2px_rgba(38,24,10,0.08)] sm:h-9 sm:px-4 sm:text-sm',
                      'focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#EEE7DB]',
                      pressed
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#1A1A1A] hover:text-white'
                        : 'border-[#D3C9B7] bg-[#FBF8F2] text-[#2A261D] hover:bg-white hover:text-[#1A1A1A]'
                    )}
                  >
                    <span lang={lang.code} dir={lang.rtl ? 'rtl' : undefined}>
                      {lang.nativeName}
                    </span>
                  </Button>
                );
              })}
            </div>
            {languagesNote && (
              <p className="mt-3 max-w-[46ch] text-[13px] leading-relaxed text-pretty text-[#5E5747]">{languagesNote}</p>
            )}
          </div>

          <div className="mx-auto mt-7 max-w-[900px] sm:mt-10">
            <TvFrame>
              <AnatomyScreen
                locale={locale}
                active={active}
                zoom={narrow}
                onHover={setHovered}
                onPick={pickFromScreen}
              />
            </TvFrame>
          </div>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <ol
          ref={listRef}
          className={cn(
            // Phone: a strip right under the set, one card per part, the next one peeking.
            // pb-8 holds the cards' shadow (the scroller clips it); -mb-4 keeps the spacing.
            'relative -mx-6 mt-5 -mb-4 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pt-1 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            // Tablet: three over two, centred. Desktop: one row of five.
            'md:mx-0 md:mt-12 md:mb-0 md:grid md:grid-cols-6 md:gap-3 md:overflow-visible md:p-0 lg:grid-cols-5 xl:gap-4'
          )}
        >
          {callouts.map((item, i) => (
            <li
              key={item.title}
              data-index={i}
              data-active={active === i}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(i)}
              onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(null)}
              className={cn(
                'relative isolate w-[84%] max-w-[22rem] shrink-0 snap-start rounded-2xl border border-border/80 bg-card p-5',
                'shadow-[0_1px_2px_rgba(38,24,10,0.05),0_12px_28px_-18px_rgba(38,24,10,0.35)]',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
                'md:col-span-2 md:w-auto md:max-w-none md:border-transparent md:bg-transparent md:p-4 md:shadow-none md:nth-4:col-start-2 lg:col-span-1 lg:nth-4:col-start-auto xl:p-5',
                'md:before:absolute md:before:inset-0 md:before:-z-10 md:before:rounded-2xl md:before:bg-card md:before:opacity-0 md:before:shadow-[0_1px_2px_rgba(38,24,10,0.06),0_10px_30px_-14px_rgba(38,24,10,0.25)] md:before:transition-opacity md:before:duration-200 motion-reduce:before:transition-none',
                'md:data-[active=true]:before:opacity-100'
              )}
            >
              <h3 className="font-heading text-[17px] font-semibold leading-tight tracking-[-0.01em]">
                {/* Stretched over the card: tap or focus it to light the part. The part is
                    hidden from assistive tech, so the tab stop reads the explanation instead. */}
                <button
                  type="button"
                  aria-describedby={`${bodyId}-${i}`}
                  onFocus={() => setPicked(i)}
                  onBlur={() => setPicked((current) => (current === i ? null : current))}
                  onClick={() => (narrow ? showCard(i) : setPicked(i))}
                  className="flex w-full items-center gap-3 text-start outline-none after:absolute after:inset-0 after:rounded-2xl md:flex-col md:items-start"
                >
                  <AnatomyBadge
                    aria-hidden
                    n={i + 1}
                    active={active === i}
                    className="size-8 text-sm transition-[scale,opacity] duration-200 motion-reduce:transition-none"
                  />
                  <span className="text-balance lg:min-h-[2lh]">{item.title}</span>
                </button>
              </h3>
              <p
                id={`${bodyId}-${i}`}
                className="mt-2 text-[15px] leading-relaxed text-pretty text-muted-foreground md:mt-1.5"
              >
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </Reveal>
    </>
  );
}
