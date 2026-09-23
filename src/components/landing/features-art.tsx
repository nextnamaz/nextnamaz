import { ChevronDown, MapPin } from 'lucide-react';
import { DEFAULT_TRANSLATIONS } from '@/lib/locale/presets';
import { PRAYER_NAMES } from '@/types/prayer';
import type { PrayerName } from '@/types/prayer';
import { cn } from '@/lib/utils';
import { TvFrame } from './tv-frame';
import { Board } from './features-board';
import type { BoardProps, BoardRow } from './features-board';
import { SettingsPhone } from './features-phone';
import { LANDING_COPY } from '@/lib/landing-copy';

const COPY = LANDING_COPY.features;

/**
 * The drawings at the top of the feature tiles. Each one is a real screen of
 * the product, drawn still: the source step of the setup wizard, a screen's
 * settings on a phone beside the two TVs they control, the dark screen, and a
 * poster taking over the display between the times.
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

function boardFor(code: 'en' | 'tr'): BoardProps {
  const t = DEFAULT_TRANSLATIONS[code];
  return {
    lang: code,
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

const EN_BOARD = boardFor('en');
const TR_BOARD = boardFor('tr');

/* ---------- Times from the source you use ---------- */

interface SourceRow {
  title: string;
  subtitle: string;
}

/**
 * The wizard's source step for Gothenburg, the place that ranks the most
 * sources (rankSources in prayer-sources/match.ts). Titles and subtitles are
 * SOURCE_META in source-wizard.tsx.
 */
const SOURCES: SourceRow[] = [
  { title: 'Islamiska Förbundet', subtitle: 'Official Swedish prayer timetable' },
  { title: 'Vaktija.eu', subtitle: 'Bosnian takvim for cities across Europe' },
  { title: 'Calculate the times', subtitle: 'No external source. Computed astronomically for your exact location.' },
  { title: 'AlAdhan', subtitle: 'Worldwide service with the conventions of 20+ national authorities.' },
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

export function SourcePickerArt() {
  const names = DEFAULT_TRANSLATIONS.en.prayers;
  return (
    <div
      aria-hidden
      className="w-full max-w-[30rem] rounded-2xl bg-card px-4 pt-5 pb-4 shadow-[0_1px_2px_rgba(38,24,10,0.06),0_18px_40px_-22px_rgba(38,24,10,0.35)] sm:px-5"
    >
      <p className="text-[15px] leading-none font-medium text-foreground">Choose a source</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-1 text-[13px] text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" />
        <span>Gothenburg, Västra Götaland, Sweden</span>
        <span className="underline">change</span>
      </p>

      <ul className="mt-4 space-y-2">
        {SOURCES.map((row, i) => {
          const active = i === 0;
          return (
            <li
              key={row.title}
              className={cn('rounded-lg border', active ? 'border-primary ring-3 ring-primary/15' : 'border-border')}
            >
              <div className="px-3 py-2.5">
                <p className="flex items-center gap-2.5">
                  <span className="text-[14px] font-medium text-foreground">{row.title}</span>
                  {active && (
                    <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                      Recommended
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{row.subtitle}</p>
              </div>

              {active && (
                <div className="space-y-2 px-3 pb-3">
                  <div className="flex h-9 items-center justify-between rounded-md border border-border px-3 text-[13.5px] text-foreground">
                    Göteborg
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-background/80 p-3 text-center">
                    {PRAYER_NAMES.map((key) => (
                      <div key={key}>
                        <div className="text-[11px] text-muted-foreground">{names[key]}</div>
                        <div className="text-[14px] font-semibold tabular-nums text-foreground">{PREVIEW[key]}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex h-9 items-center justify-center rounded-full bg-primary text-[13.5px] font-medium text-primary-foreground">
                    Use this source
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Change it from your phone ---------- */

interface Room {
  name: string;
  link: string;
  board: BoardProps;
  mode: 'light' | 'dark';
  /** Shown on phones too; the other room joins from `sm`. */
  always?: boolean;
}

/** The women's section is the screen on the phone, just switched to Dark; the main hall is untouched. */
const ROOMS: Room[] = [
  { name: COPY.rooms.womens, link: 'nextnamaz.com/s/a81e07d4…', board: EN_BOARD, mode: 'dark', always: true },
  { name: COPY.rooms.main, link: 'nextnamaz.com/s/3f9c2a1b…', board: TR_BOARD, mode: 'light' },
];

/**
 * The phone, then the TV it just changed, then the other room's. Stacked on
 * phones (one TV), the two TVs in a column beside the phone on tablets, and
 * all three in a row from `xl`, where the stage is wide enough for it.
 */
export function RemoteArt() {
  const phoneUrl = ROOMS[0]?.link ?? '';
  return (
    <div
      aria-hidden
      className="mx-auto grid w-full max-w-[20rem] grid-cols-1 items-center gap-8 sm:max-w-[40rem] sm:grid-cols-[minmax(0,0.56fr)_minmax(0,1fr)] xl:max-w-none xl:grid-cols-[minmax(0,0.5fr)_minmax(0,2fr)] xl:gap-9"
    >
      <SettingsPhone url={phoneUrl} className="mx-auto w-[12.5rem] sm:w-full" />
      <div className="space-y-6 xl:grid xl:grid-cols-2 xl:gap-9 xl:space-y-0">
        {ROOMS.map((room) => (
          <figure key={room.name} className={cn(!room.always && 'hidden sm:block')}>
            <TvFrame>
              <Board {...room.board} mode={room.mode} />
            </TvFrame>
            <figcaption className="mt-3.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5">
              <span className="text-[13px] font-medium text-[#3F3A2E]">{room.name}</span>
              <span className="rounded-full border border-[#DCD3C3] bg-white/70 px-2.5 py-1 font-mono text-[11px] tracking-tight text-[#5C5646]">
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

/** As tv-display.tsx draws it: black, the time in light white figures, nothing else. */
export function DarkScreenArt({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('w-full', className)}>
      <TvFrame>
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <span
            className="font-sans font-light tabular-nums text-white"
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
function Poster() {
  return (
    <div className="absolute inset-0 flex items-center overflow-hidden bg-[#17463B] text-[#F5EEDF]">
      <div className="relative w-[62%]" style={{ paddingInlineStart: '9cqmin' }}>
        <p className="font-sans font-semibold text-[#E8B53A]" style={{ fontSize: '6cqmin' }}>
          {COPY.poster.kicker}
        </p>
        <p className="font-heading font-semibold leading-[1.05] tracking-[-0.03em]" style={{ fontSize: '14cqmin', marginTop: '2.5cqmin' }}>
          {COPY.poster.title}
        </p>
        <p className="font-sans text-[#F5EEDF]/85" style={{ fontSize: '5.6cqmin', marginTop: '6cqmin' }}>
          {COPY.poster.details}
        </p>
        <p className="font-sans text-[#E8B53A]" style={{ fontSize: '5.6cqmin', marginTop: '1.2cqmin' }}>
          {COPY.poster.action}
        </p>
      </div>
      {/* The poster's own art: a pointed arch, as a mosque's designer might draw one. */}
      <svg
        viewBox="0 0 100 140"
        className="absolute top-[14%] right-[9%] h-[72%] text-[#E8B53A]/70"
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
 * The poster, then the display it gives way to, then the poster again: the
 * order the slideshow keeps. Opens on the poster, since the neighbouring
 * drawings already show the display, and waits while the tile's Reveal is
 * still pending, so the loop starts when the tile scrolls into view. Held on
 * the poster when motion is reduced.
 */
export function AnnouncementArt({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('w-full', className)}>
      <style>{`
        @keyframes features-slide {
          0%, 52% { opacity: 1; }
          58%, 86% { opacity: 0; }
          92%, 100% { opacity: 1; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .features-slide { animation: features-slide 11s ease-in-out infinite; }
          [data-reveal='pending'] .features-slide { animation-play-state: paused; }
        }
      `}</style>
      <TvFrame>
        <Board {...EN_BOARD} />
        <div className="features-slide absolute inset-0 bg-black">
          <Poster />
        </div>
      </TvFrame>
    </div>
  );
}
