'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { formatMonth, resolveDisplayLocale } from '@/lib/display-locale';
import type { SupportedLocale } from '@/types/locale';
import { AmbientVideo } from './ambient-video';
import { ScreenPlaceholder } from './screen-placeholder';

const DemoDisplay = dynamic(() => import('./demo-display').then((m) => m.DemoDisplay), {
  ssr: false,
  loading: () => <ScreenPlaceholder />,
});

interface Month {
  /** Where the month begins in the film, in its own seconds. */
  start: number;
  /** Done by hand: when the new sheet is up, the moment it is crossed out. */
  sheetUp?: number;
}

/** The film's three months: the sheet changed by hand twice, then the month the set goes up. */
const MONTHS: readonly Month[] = [{ start: 0, sheetUp: 7.9 }, { start: 9.003, sheetUp: 15.3 }, { start: 16.22 }];
/** How long each month's title card holds, in film seconds. */
const TITLE_HOLD = 1.4;
/** How long the screen holds, running, before the film starts over, in ms. */
const AFTER_HOLD = 7000;
/** The set's screen in the film's last frame, as shares of the frame. */
const SCREEN = { left: '36.56%', top: '24.54%', width: '27.6%', height: '29.54%' };
/** The middle of the taped sheet, where it gets its cross. */
const SHEET = { left: '51.6%', top: '39%' };

/** The edit: a month's title rising in, the calendar turning, the cross stamped on. Only ever mounted while the film runs. */
const MOTION = `
@keyframes owf-title { from { opacity: 0; transform: translateY(1.6cqw) scale(0.97); } to { opacity: 1; transform: none; } }
@keyframes owf-turn { from { transform: rotateX(-80deg); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes owf-stamp { 0% { transform: translate(-50%, -50%) scale(1.9) rotate(-14deg); opacity: 0; } 60% { transform: translate(-50%, -50%) scale(0.92) rotate(0); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
.owf-title { animation: owf-title 520ms cubic-bezier(0.16, 1, 0.3, 1) both; }
.owf-turn { transform-origin: top; animation: owf-turn 420ms cubic-bezier(0.16, 1, 0.3, 1) both; }
.owf-stamp { animation: owf-stamp 380ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both; }
`;

interface OldWayFilmProps {
  label: string;
  /** The caption while the sheet is changed by hand. */
  before: string;
  /** The caption while the set goes up instead. */
  instead: string;
  /** The caption once the set is running. */
  after: string;
  display: SupportedLocale;
}

/**
 * Before and after, filmed (ElevenLabs: Seedream stills, Kling clips) and cut
 * like a short explainer. In a mosque entrance a man tears the printed
 * timetable off the wall, leaving it bare, then comes back and tapes up the
 * next one. Each month opens on a title card with its date; each new sheet is
 * crossed out in red as it goes up. In the third month he and a friend hang a
 * set where the sheet was, the caption turns green, and when the film ends the
 * set switches on, running the real display, and holds before it all starts
 * over.
 *
 * Each clip was generated between fixed first and last frames (the wall with
 * the sheet, bare, or with the set), so the cuts between them do not show.
 *
 * It opens on the sheet on the wall. Under reduced motion the film never runs
 * and the after is shown instead, once it is in view.
 */
export function OldWayFilm({ label, before, instead, after, display }: OldWayFilmProps) {
  const [isAfter, setIsAfter] = useState(false);
  const [month, setMonth] = useState(0);
  const [title, setTitle] = useState(true);
  const [crossed, setCrossed] = useState(false);
  /** The month the film first played in; until then none of the edit shows. */
  const [firstMonth, setFirstMonth] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const video = useRef<HTMLVideoElement | null>(null);
  const listening = useRef<AbortController | null>(null);

  const locale = resolveDisplayLocale(display);
  const { month: monthName, dayMonth: dateLabel } = formatMonth(new Date(2026, (firstMonth ?? 0) + month, 1), locale.locale);
  const playing = firstMonth !== null && !isAfter;
  const installing = month === MONTHS.length - 1;

  const keep = useCallback((el: HTMLVideoElement | null) => {
    video.current = el;
    listening.current?.abort();
    if (!el) {
      window.clearTimeout(timer.current);
      return;
    }
    const { signal } = (listening.current = new AbortController());
    // The film only plays once it is on screen; the calendar starts from the month it first does.
    el.addEventListener('playing', () => setFirstMonth((m) => m ?? new Date().getMonth()), { signal });
    el.addEventListener(
      'timeupdate',
      () => {
        const t = el.currentTime;
        const i = Math.max(0, MONTHS.filter((m) => t >= m.start).length - 1);
        const current = MONTHS[i];
        setMonth(i);
        setTitle(t - (current?.start ?? 0) < TITLE_HOLD);
        setCrossed(current?.sheetUp !== undefined && t >= current.sheetUp);
      },
      { signal }
    );
  }, []);
  const showAfter = useCallback(() => setIsAfter(true), []);

  const onEnded = () => {
    setIsAfter(true);
    timer.current = window.setTimeout(() => {
      const el = video.current;
      if (!el) return;
      el.currentTime = 0;
      setMonth(0);
      setTitle(true);
      setCrossed(false);
      setIsAfter(false);
      // Off screen it waits at the start; AmbientVideo plays it when it is back in view.
      const box = el.getBoundingClientRect();
      if (box.bottom > 0 && box.top < window.innerHeight) void el.play().catch(() => {});
    }, AFTER_HOLD);
  };

  return (
    <div
      role="img"
      aria-label={label}
      dir="ltr"
      className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#EFEBE3] ring-1 ring-[rgba(38,24,10,0.08)]"
      style={{ containerType: 'inline-size' }}
    >
      <style>{MOTION}</style>
      {/* The wall as it ends: the set up, switched off. The film's last frame, under it. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed backdrop the film lies over, the same size as the film. */}
      <img src="/landing/old-way-after.jpg" alt="" className="absolute inset-0 size-full object-cover" />

      <AmbientVideo
        src="/landing/old-way-story.mp4"
        poster="/landing/old-timetable.jpg"
        loop={false}
        onVideo={keep}
        onEnded={onEnded}
        onStill={showAfter}
        className="absolute inset-0 size-full object-cover transition-opacity duration-700"
        style={{ opacity: isAfter ? 0 : 1 }}
      />

      {/* After: the set switches on, running the real display. */}
      <div
        className="absolute overflow-hidden rounded-[0.2cqw] bg-black transition-opacity duration-700"
        style={{ ...SCREEN, containerType: 'size', opacity: isAfter ? 1 : 0, transitionDelay: isAfter ? '250ms' : '0ms' }}
        aria-hidden={!isAfter}
      >
        <DemoDisplay locale={locale} />
      </div>
      <span
        aria-hidden
        className="absolute flex size-[4cqw] items-center justify-center rounded-full bg-[#2F9E5B] text-white shadow-[0_0.6cqw_1.6cqw_rgba(38,24,10,0.3)] transition-transform duration-500"
        style={{
          left: `calc(${SCREEN.left} + ${SCREEN.width})`,
          top: SCREEN.top,
          transform: `translate(-50%, -50%) scale(${isAfter ? 1 : 0})`,
          transitionDelay: isAfter ? '900ms' : '0ms',
        }}
      >
        <Check className="size-[2.2cqw]" strokeWidth={3} />
      </span>

      {/* By hand: the new sheet crossed out as it goes up. */}
      {playing && crossed && (
        <span
          key={month}
          aria-hidden
          className="owf-stamp absolute flex size-[10cqw] items-center justify-center rounded-full bg-[#D92D20] text-white shadow-[0_0.8cqw_2.4cqw_rgba(80,10,5,0.45)] ring-[0.6cqw] ring-white"
          style={SHEET}
        >
          <X className="size-[6cqw]" strokeWidth={3.5} />
        </span>
      )}

      {/* Each month opens on its date, over a dimmed frame; the third also says what changes. */}
      {playing && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[1.6cqw] bg-[rgba(20,14,6,0.5)] transition-opacity duration-300"
          style={{ opacity: title ? 1 : 0 }}
        >
          <p key={month} className="owf-title text-[max(26px,7cqw)] leading-none font-semibold tracking-[-0.035em] text-white [text-shadow:0_0.3cqw_2cqw_rgba(0,0,0,0.35)]">
            {dateLabel}
          </p>
          {installing && (
            <p className="owf-title flex items-center gap-[max(5px,1cqw)] rounded-full bg-[#2F9E5B] px-[max(12px,2.2cqw)] py-[max(5px,1cqw)] text-[max(13px,2.4cqw)] font-semibold text-white [animation-delay:180ms]">
              <Check className="size-[max(13px,2.4cqw)]" strokeWidth={3} />
              {instead}
            </p>
          )}
        </div>
      )}

      {/* The wall calendar, on the first of each month. */}
      {playing && (
        <div aria-hidden className="absolute top-[3cqw] left-[3cqw] w-[max(58px,13cqw)]" style={{ perspective: '40cqw' }}>
          <div key={month} className="owf-turn overflow-hidden rounded-[0.9cqw] bg-white text-center shadow-[0_0.6cqw_1.6cqw_-0.4cqw_rgba(38,24,10,0.35)]">
            <p className="bg-[#C0392B] py-[max(3px,0.7cqw)] text-[max(10px,1.8cqw)] font-semibold text-white capitalize">{monthName}</p>
            <p className="py-[max(4px,0.8cqw)] text-[max(18px,4.2cqw)] leading-none font-semibold text-[#1F1A12]">1</p>
          </div>
        </div>
      )}

      {/* The caption: by hand, crossed out; then the better way; then running. */}
      <p className="absolute bottom-[3cqw] left-[3cqw] flex h-[max(28px,5cqw)] items-center gap-[max(6px,1.1cqw)] rounded-full bg-white ps-[max(4px,0.9cqw)] pe-[max(12px,2.4cqw)] text-[max(12px,2cqw)] font-semibold text-foreground shadow-[0_1px_2px_rgba(38,24,10,0.12),0_6px_16px_-6px_rgba(38,24,10,0.3)]">
        {isAfter || installing ? (
          <span className="flex size-[max(20px,3.3cqw)] items-center justify-center rounded-full bg-[#2F9E5B] text-white">
            <Check className="size-[max(12px,2cqw)]" strokeWidth={3} />
          </span>
        ) : (
          <span className="flex size-[max(20px,3.3cqw)] items-center justify-center rounded-full bg-[#D92D20] text-white">
            <X className="size-[max(12px,2cqw)]" strokeWidth={3} />
          </span>
        )}
        {isAfter ? after : installing ? instead : before}
      </p>
    </div>
  );
}
