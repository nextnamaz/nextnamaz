import type { CSSProperties } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { SourceLogo } from '@/components/settings/setup-art';
import type { WizardSource } from '@/lib/prayer-sources/match';
import { DEFAULT_TRANSLATIONS, LANGUAGES } from '@/lib/locale/presets';
import { PRAYER_NAMES } from '@/types/prayer';
import type { PrayerName } from '@/types/prayer';
import type { SupportedLocale } from '@/types/locale';
import { cn } from '@/lib/utils';
import { TvFrame } from './tv-frame';
import { Board } from './features-board';
import type { BoardProps, BoardRow } from './features-board';
import { SettingsPhone } from './features-phone';
import type { LandingCopy } from '@/lib/landing-copy';

type FeaturesCopy = LandingCopy['features'];

/**
 * The drawings at the top of the feature tiles. Each one is a real screen of
 * the product: the source step of the setup wizard, a screen's settings on a
 * phone beside the two TVs they control, the dark screen, and a poster taking
 * over the display between the times. Each acts its feature out once its
 * tile's MotionStage is in view, and comes to rest as the still it is without
 * JavaScript or with reduced motion. The TVs speak the page's language, as
 * a mosque's own would; the phone and the wizard stay in English, as the app
 * itself does.
 * Decorative: each tile's own heading and text carry the meaning.
 */

/* ---------- Sample day ---------- */

const TIMES: Record<PrayerName, string> = {
  fajr: '05:30',
  sunrise: '07:00',
  dhuhr: '12:30',
  asr: '15:45',
  maghrib: '19:30',
  isha: '21:00',
};

/** Mid-afternoon: Dhuhr has begun, Asr is next. */
const STATES: Record<PrayerName, BoardRow['state']> = {
  fajr: 'past',
  sunrise: 'past',
  dhuhr: 'current',
  asr: 'next',
  maghrib: 'upcoming',
  isha: 'upcoming',
};

/** A board in a display language, mirrored for a right-to-left one as the real theme is. */
function boardFor(code: SupportedLocale): BoardProps {
  const t = DEFAULT_TRANSLATIONS[code];
  return {
    lang: code,
    dir: LANGUAGES.find((l) => l.code === code)?.rtl ? 'rtl' : 'ltr',
    clock: '14:05:12',
    labels: { prayer: t.labels.prayer, begins: t.labels.begins, next: t.labels.next },
    rows: PRAYER_NAMES.map((key) => ({
      name: t.prayers[key],
      time: TIMES[key],
      state: STATES[key],
      sunrise: key === 'sunrise',
    })),
    next: { name: t.prayers.asr, time: TIMES.asr, countdown: '1:39:48' },
    footer: 'بسم الله الرحمن الرحيم',
  };
}

/* ---------- Times from the source you use ---------- */

interface SourceRow {
  id: WizardSource;
  title: string;
  subtitle: string;
}

/**
 * The wizard's source step for Gothenburg, the place that ranks the most
 * sources (rankSources in prayer-sources/match.ts). Titles and subtitles are
 * SOURCE_META in source-wizard.tsx.
 */
const SOURCES: SourceRow[] = [
  { id: 'islamiska_forbundet', title: 'Islamiska Förbundet', subtitle: 'Official Swedish prayer timetable' },
  { id: 'vaktija_eu', title: 'Vaktija.eu', subtitle: 'Bosnian takvim for cities across Europe' },
  { id: 'aladhan', title: 'AlAdhan', subtitle: 'Worldwide service with the conventions of 20+ national authorities.' },
  { id: 'adhan', title: 'Calculate the times', subtitle: 'No external source. Computed astronomically for your exact location.' },
];

/** Today in Gothenburg, as the recommended source's preview shows it. */
const PREVIEW: Record<PrayerName, string> = {
  fajr: '05:04',
  sunrise: '07:06',
  dhuhr: '13:12',
  asr: '16:14',
  maghrib: '19:12',
  isha: '20:46',
};

/**
 * In view, the wizard does its work: the sources arrive one by one, the
 * recommended one is picked, its preview fills in with today's times, and
 * "Use this source" is pressed. It comes to rest as the still drawing.
 * Keyed on MotionStage.
 */
const SOURCE_MOTION = `
@media (prefers-reduced-motion: no-preference) {
  [data-enter='wait'] :is(.src-row, .src-pick, .src-time) { opacity: 0; }
  [data-enter='play'] .src-row { animation: src-rise 560ms cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: calc(100ms + var(--i) * 110ms); }
  [data-enter='play'] .src-pick { animation: src-pick 480ms cubic-bezier(0.16, 1, 0.3, 1) 800ms both; }
  [data-enter='play'] .src-time { animation: src-rise 420ms cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: calc(1050ms + var(--k) * 80ms); }
  [data-enter='play'] .src-use { animation: src-press 380ms ease-in-out 1900ms both; }
}
@keyframes src-rise { from { opacity: 0; transform: translateY(8px); } }
@keyframes src-pick { from { opacity: 0; transform: scale(1.025); } }
@keyframes src-press { 45% { transform: scale(0.95); } }
`;

export function SourcePickerArt() {
  const names = DEFAULT_TRANSLATIONS.en.prayers;
  return (
    <div
      aria-hidden
      dir="ltr"
      className="w-full max-w-[30rem] rounded-3xl bg-card px-4 pt-5 pb-4 shadow-[0_1px_2px_rgba(38,24,10,0.06),0_18px_40px_-22px_rgba(38,24,10,0.35)] sm:px-5"
    >
      <style>{SOURCE_MOTION}</style>
      <p className="font-heading text-[19px] leading-tight font-semibold tracking-[-0.02em] text-foreground">
        Where should the times come from?
      </p>
      {/* One line at any width: the place gives way before "Change" does. */}
      <p className="mt-1.5 flex items-center gap-x-1.5 text-[13px] text-muted-foreground">
        <span aria-hidden>🇸🇪</span>
        <span className="min-w-0 truncate">Gothenburg, Västra Götaland, Sweden</span>
        <span className="shrink-0 font-medium text-foreground underline underline-offset-2">Change</span>
      </p>

      <ul className="mt-4 space-y-2">
        {SOURCES.map((row, i) => {
          const active = i === 0;
          return (
            <li
              key={row.title}
              className="src-row relative rounded-2xl border border-border bg-card"
              style={{ '--i': i } as CSSProperties}
            >
              {/* The choice, drawn over the row's own border so it can arrive after the row. */}
              {active && (
                <span className="src-pick pointer-events-none absolute -inset-px rounded-2xl border-2 border-primary shadow-[0_10px_30px_-18px_rgba(184,122,8,0.6)]" />
              )}
              <div className="flex items-center gap-3 px-3 py-3">
                <SourceLogo source={row.id} />
                <div className="min-w-0 flex-1">
                  {/* A narrow card moves the badge under the name rather than breaking the name. */}
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[14.5px] font-semibold whitespace-nowrap text-foreground">{row.title}</span>
                    {active && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10.5px] font-semibold text-[#8A6206]">
                        Recommended
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{row.subtitle}</p>
                </div>
                {active && (
                  <span className="src-pick flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </div>

              {active && (
                <div className="space-y-2 px-3 pb-3">
                  <div className="flex h-9 items-center justify-between rounded-xl border border-border px-3 text-[13.5px] text-foreground">
                    Göteborg
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </div>
                  <div className="rounded-xl bg-secondary/60 p-3">
                    <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Today</p>
                    <div className="grid grid-cols-3 gap-y-2 text-center">
                      {PRAYER_NAMES.map((key, k) => (
                        <div key={key}>
                          <div className="text-[11px] text-muted-foreground">{names[key]}</div>
                          <div className="src-time text-[15px] font-semibold tabular-nums text-foreground" style={{ '--k': k } as CSSProperties}>
                            {PREVIEW[key]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="src-use mt-3 flex h-10 items-center justify-center rounded-full bg-primary text-[14px] font-semibold text-primary-foreground">
        Use these times
      </div>
    </div>
  );
}

/* ---------- Change it from your phone ---------- */

interface Room {
  name: string;
  link: string;
  board: BoardProps;
  /** The screen the phone is changing: it goes from light to dark as the tile plays. */
  changed?: boolean;
  /** Shown on phones too; the other room joins from `sm`. */
  always?: boolean;
}

type RoomKey = keyof FeaturesCopy['rooms'];

interface RoomPlan {
  /** The room whose screen the phone changes. It speaks the page's language, and is the one shown on phones. */
  changed: RoomKey;
  /** The other room's language. */
  other: SupportedLocale;
}

/**
 * Which room is which, as each page's FAQ tells it: in English, Swedish and
 * German the women's section runs in the page's language and the main hall in
 * Turkish; the Bosnian and Turkish pages have the main hall in their own.
 */
const PLANS: Partial<Record<SupportedLocale, RoomPlan>> = {
  bs: { changed: 'main', other: 'de' },
  tr: { changed: 'main', other: 'en' },
};
const DEFAULT_PLAN: RoomPlan = { changed: 'womens', other: 'tr' };

/** The screen on the phone, just switched to Dark, then the other room's, untouched. */
function roomsFor(names: FeaturesCopy['rooms'], display: SupportedLocale): Room[] {
  const plan = PLANS[display] ?? DEFAULT_PLAN;
  const otherRoom: RoomKey = plan.changed === 'womens' ? 'main' : 'womens';
  return [
    { name: names[plan.changed], link: 'nextnamaz.com/s/a81e07d4…', board: boardFor(display), changed: true, always: true },
    { name: names[otherRoom], link: 'nextnamaz.com/s/3f9c2a1b…', board: boardFor(plan.other) },
  ];
}

/**
 * In view, the phone makes the change: a tap on Mode, Light turns to Dark,
 * the page says it has saved, and then the women's section TV redraws in
 * dark, top to bottom, while the main hall's stays as it was. It comes to rest as the still drawing.
 * The phone's parts (.ph-*) are in features-phone.tsx. Keyed on MotionStage.
 */
const REMOTE_MOTION = `
@media (prefers-reduced-motion: no-preference) {
  [data-enter='wait'] :is(.ph-now, .ph-pick, .ph-toast) { opacity: 0; }
  [data-enter='wait'] .ph-dark { clip-path: inset(0 0 100% 0); }
  [data-enter='wait'] .ph-was { opacity: 1; }
  [data-enter='play'] .ph-tap { animation: ph-tap 700ms ease-out 300ms both; }
  [data-enter='play'] .ph-pick { animation: ph-fade 260ms ease-out 380ms both; }
  [data-enter='play'] .ph-was { animation: ph-out 240ms ease-in 700ms both; }
  [data-enter='play'] .ph-now { animation: ph-in 320ms ease-out 760ms both; }
  [data-enter='play'] .ph-toast { animation: ph-toast 520ms cubic-bezier(0.16, 1, 0.3, 1) 1250ms both; }
  [data-enter='play'] .ph-dark { animation: ph-redraw 800ms cubic-bezier(0.65, 0, 0.35, 1) 2050ms both; }
}
@keyframes ph-tap {
  0% { opacity: 0; transform: scale(0.4); }
  20% { opacity: 1; transform: scale(0.8); }
  100% { opacity: 0; transform: scale(1.5); }
}
@keyframes ph-fade { from { opacity: 0; } }
@keyframes ph-out { from { opacity: 1; } to { opacity: 0; transform: translateY(-40%); } }
@keyframes ph-in { from { opacity: 0; transform: translateY(40%); } }
@keyframes ph-redraw { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes ph-toast { from { opacity: 0; transform: translateY(35%) scale(0.96); } }
`;

/**
 * The phone, then the TV it just changed, then the other room's. Stacked on
 * phones (one TV), the two TVs in a column beside the phone on tablets, and
 * all three in a row from `xl`, where the stage is wide enough for it.
 */
export function RemoteArt({ rooms: names, display }: { rooms: FeaturesCopy['rooms']; display: SupportedLocale }) {
  const rooms = roomsFor(names, display);
  const phoneUrl = rooms[0]?.link ?? '';
  return (
    <div
      aria-hidden
      dir="ltr"
      className="mx-auto grid w-full max-w-[20rem] grid-cols-1 items-center gap-8 sm:max-w-[40rem] sm:grid-cols-[minmax(0,0.56fr)_minmax(0,1fr)] xl:max-w-none xl:grid-cols-[minmax(0,0.5fr)_minmax(0,2fr)] xl:gap-9"
    >
      <style>{REMOTE_MOTION}</style>
      <SettingsPhone url={phoneUrl} className="mx-auto w-[12.5rem] sm:w-full" />
      <div className="space-y-6 xl:grid xl:grid-cols-2 xl:gap-9 xl:space-y-0">
        {rooms.map((room) => (
          <figure key={room.name} className={cn(!room.always && 'hidden sm:block')}>
            <TvFrame>
              <Board {...room.board} />
              {room.changed && (
                <div className="ph-dark absolute inset-0">
                  <Board {...room.board} mode="dark" />
                </div>
              )}
            </TvFrame>
            <figcaption dir="auto" className="mt-3.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5">
              <span className="text-[13px] font-medium text-foreground">{room.name}</span>
              <span className="rounded-full border border-border bg-white/70 px-2.5 py-1 font-mono text-[11px] tracking-tight text-muted-foreground">
                {room.link}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ---------- A dark screen for prayer ---------- */

/** Minutes before the dark screen: Dhuhr began at 12:30, Asr is next. */
function prayingBoard(display: SupportedLocale): BoardProps {
  const board = boardFor(display);
  return { ...board, clock: '12:40:52', next: { ...board.next, countdown: '3:04:08' } };
}

/**
 * A slow loop: the display, then the black screen it gives way to while the
 * congregation prays, then the display again. Stills and reduced motion hold
 * the black screen, which is the feature. A stage that plays from its
 * entrance opens on the display, so the first thing seen is the change.
 */
const DARK_MOTION = `
@media (prefers-reduced-motion: no-preference) {
  [data-live] :is(.dk-black, .dk-clock) { animation: dk-black 14s ease-in-out -6s infinite both; }
  [data-live] .dk-clock { animation-name: dk-clock; }
  [data-enter] :is(.dk-black, .dk-clock) { animation-delay: -0.6s; }
}
@keyframes dk-black {
  0%, 28% { opacity: 0; }
  34%, 84% { opacity: 1; }
  90%, 100% { opacity: 0; }
}
@keyframes dk-clock {
  0%, 34% { opacity: 0; }
  40%, 78% { opacity: 1; }
  83%, 100% { opacity: 0; }
}
`;

/** As tv-display.tsx draws it: black, the time in light white figures, nothing else. */
export function DarkScreenArt({ className, display }: { className?: string; display: SupportedLocale }) {
  return (
    <div aria-hidden className={cn('w-full', className)}>
      <style>{DARK_MOTION}</style>
      <TvFrame>
        <Board {...prayingBoard(display)} />
        <div className="dk-black absolute inset-0 flex items-center justify-center bg-black">
          <span
            className="dk-clock font-sans font-light tabular-nums text-white"
            style={{ fontSize: '18cqmin', letterSpacing: '-0.02em', lineHeight: 1 }}
          >
            12:41:07
          </span>
        </div>
      </TvFrame>
    </div>
  );
}

/* ---------- Announcements between times ---------- */
/** A mosque's own poster, as it might be uploaded: a 16:9 slide, filling the screen. */
function Poster({ poster }: { poster: FeaturesCopy['poster'] }) {
  return (
    <div className="absolute inset-0 flex items-center overflow-hidden bg-[#17463B] text-[#F5EEDF]">
      <div className="relative w-[62%]" style={{ paddingInlineStart: '9cqmin' }}>
        <p className="font-sans font-semibold text-[#E8B53A]" style={{ fontSize: '6cqmin' }}>
          {poster.kicker}
        </p>
        <p className="font-heading font-semibold leading-[1.05] tracking-[-0.03em]" style={{ fontSize: '14cqmin', marginTop: '2.5cqmin' }}>
          {poster.title}
        </p>
        <p className="font-sans text-[#F5EEDF]/85" style={{ fontSize: '5.6cqmin', marginTop: '6cqmin' }}>
          {poster.details}
        </p>
        <p className="font-sans text-[#E8B53A]" style={{ fontSize: '5.6cqmin', marginTop: '1.2cqmin' }}>
          {poster.action}
        </p>
      </div>
      {/* The poster's own art: a pointed arch, as a mosque's designer might draw one. */}
      <svg
        viewBox="0 0 100 140"
        className="absolute top-[14%] end-[9%] h-[72%] text-[#E8B53A]/70"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
      >
        <path d="M6 138V62C6 34 30 14 50 2c20 12 44 32 44 60v76" />
        <path d="M18 138V66c0-22 18-39 32-48 14 9 32 26 32 48v72" opacity={0.6} />
      </svg>
    </div>
  );
}

/**
 * The slideshow: the poster slides away to show the times, then slides back
 * over them, as a TV with an announcement does between prayers. Mirrored for
 * right-to-left pages. Stills and reduced motion hold the poster; a stage
 * that plays from its entrance opens on the times, a second before the
 * poster slides in over them.
 */
const SLIDE_MOTION = `
.an-poster { --an-out: -101%; --an-in: 101%; }
[dir='rtl'] .an-poster { --an-out: 101%; --an-in: -101%; }
@media (prefers-reduced-motion: no-preference) {
  [data-live] .an-poster { animation: an-cycle 13s cubic-bezier(0.65, 0, 0.35, 1) infinite both; }
  [data-enter] .an-poster { animation-delay: -9.6s; }
}
@keyframes an-cycle {
  0%, 44% { transform: translateX(0); }
  51% { transform: translateX(var(--an-out)); animation-timing-function: step-end; }
  52%, 86% { transform: translateX(var(--an-in)); }
  94%, 100% { transform: translateX(0); }
}
`;

interface AnnouncementArtProps {
  className?: string;
  poster: FeaturesCopy['poster'];
  display: SupportedLocale;
}

export function AnnouncementArt({ className, poster, display }: AnnouncementArtProps) {
  return (
    <div aria-hidden className={cn('w-full', className)}>
      <style>{SLIDE_MOTION}</style>
      <TvFrame>
        <Board {...boardFor(display)} />
        <div className="an-poster absolute inset-0 bg-black shadow-[0_0_4cqw_rgba(0,0,0,0.35)]">
          <Poster poster={poster} />
        </div>
      </TvFrame>
    </div>
  );
}
