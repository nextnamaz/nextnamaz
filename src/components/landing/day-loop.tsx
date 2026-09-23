'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { TvFrame } from './tv-frame';
import { PREVIEW_PRAYERS } from '@/lib/theme-preview';
import { minutesOf } from '@/lib/display-schedule';
import { isRtlLocale } from '@/lib/display-locale';
import type { DisplayLocale } from '@/lib/display-locale';
import type { PrayerName } from '@/types/prayer';

interface Row {
  name: PrayerName;
  at: number;
  time: string;
}

const ROWS: Row[] = PREVIEW_PRAYERS.map(({ name, time }) => ({ name, time, at: minutesOf(time) ?? 0 }));
/** The moments the day slows down for: the five prayers, not sunrise. */
const PRAYERS = ROWS.filter((r) => r.name !== 'sunrise');
const SUNRISE = ROWS.find((r) => r.name === 'sunrise')?.at ?? 420;
const SUNSET = ROWS.find((r) => r.name === 'maghrib')?.at ?? 1170;

const DAY = 1440;
/** Minutes a second at full speed; calibrated so a whole day, slowdowns included, takes about twenty seconds. */
const SPEED = 139;
/** How close to a prayer the clock starts to slow, in minutes. */
const SLOW_WITHIN = 45;
/** Where the loop begins: before dawn, so the first thing seen is Fajr arriving. */
const START = 270;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (t: number) => t * t * (3 - 2 * t);
const wrap = (m: number) => ((m % DAY) + DAY) % DAY;
const gap = (a: number, b: number) => {
  const d = Math.abs(a - b);
  return Math.min(d, DAY - d);
};

/** The clock eases in to each prayer, so its minute can be seen to turn. */
function speedAt(minute: number): number {
  const near = Math.min(...PRAYERS.map((p) => gap(minute, p.at)));
  return SPEED * (0.06 + 0.94 * smooth(clamp01(near / SLOW_WITHIN)));
}

type RGB = [number, number, number];
/** The wall through the day, top and bottom: night blue, dawn violet, peach sunrise, warm white noon, gold afternoon, a red dusk. */
type Stop = [number, RGB, RGB];
const WALL: Stop[] = [
  [0, [12, 18, 44], [30, 38, 78]],
  [270, [22, 28, 66], [58, 58, 112]],
  [330, [70, 66, 128], [176, 138, 168]],
  [420, [168, 184, 214], [248, 196, 160]],
  [540, [226, 232, 238], [242, 234, 222]],
  [750, [232, 236, 240], [240, 235, 226]],
  [945, [236, 226, 206], [244, 214, 170]],
  [1110, [196, 150, 150], [246, 176, 120]],
  [1170, [92, 76, 138], [238, 128, 96]],
  [1230, [34, 36, 84], [96, 70, 120]],
  [1290, [14, 20, 48], [36, 42, 84]],
  [DAY, [12, 18, 44], [30, 38, 78]],
];

const mix = (x: RGB, y: RGB, t: number) => `rgb(${x.map((v, k) => Math.round(v + ((y[k] ?? v) - v) * t)).join(',')})`;

function wallAt(minute: number): string {
  const i = Math.max(1, WALL.findIndex(([at]) => at > minute));
  const [a, topA, botA] = WALL[i - 1] as Stop;
  const [b, topB, botB] = WALL[i] as Stop;
  const t = b === a ? 0 : (minute - a) / (b - a);
  return `linear-gradient(180deg, ${mix(topA, topB, t)}, ${mix(botA, botB, t)})`;
}

/** A fixed scatter of stars, out at night. */
const STARS = Array.from({ length: 36 }, (_, i) => ({
  x: (i * 37.7) % 100,
  y: (i * 23.3 + (i % 5) * 7) % 62,
  r: 1 + (i % 3) * 0.6,
}));

const pad = (n: number) => String(n).padStart(2, '0');
const clock = (minute: number) => `${pad(Math.floor(minute / 60))}:${pad(Math.floor(minute % 60))}`;

/** The prayer whose time it is: the last one begun, or last night's Isha before Fajr. None between sunrise and Dhuhr, as on the real screen. */
function currentAt(minute: number): Row | null {
  const last = [...ROWS].reverse().find((r) => r.at <= minute) ?? (ROWS.at(-1) as Row);
  return last.name === 'sunrise' ? null : last;
}
function nextAt(minute: number): Row {
  return PRAYERS.find((r) => r.at > minute) ?? (PRAYERS[0] as Row);
}

interface DayLoopProps {
  locale: DisplayLocale;
  t: { play: string; pause: string; scrub: string };
}

/**
 * A day at the mosque, played in twenty seconds. The wall takes the light of
 * each hour, the sun crosses it, and at night the screen is what lights the
 * room. The display on the set keeps time on its own: the current prayer is
 * marked, the next one counts down, and as each begins it lights up. The clock
 * slows as a prayer comes, so its minute can be seen to turn.
 *
 * Drawn from a single minute, advanced once a frame while it is on screen.
 * Reduced motion does not start it; the slider still moves through the day.
 */
export function DayLoop({ locale, t }: DayLoopProps) {
  const [minute, setMinute] = useState(START);
  const [playing, setPlaying] = useState(false);
  /** Bumped as each prayer begins, to replay its flash. */
  const [arrival, setArrival] = useState<{ name: PrayerName; n: number } | null>(null);
  const visible = useRef(false);
  const userPaused = useRef(false);
  const minuteRef = useRef(START);

  const watch = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const seen = entries.some((e) => e.isIntersecting);
      visible.current = seen;
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setPlaying(seen && !still && !userPaused.current);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const before = minuteRef.current;
      const after = wrap(before + speedAt(before) * dt);
      const begun = PRAYERS.find((p) => (after >= before ? p.at > before && p.at <= after : p.at > before || p.at <= after));
      if (begun) setArrival((a) => ({ name: begun.name, n: (a?.n ?? 0) + 1 }));
      minuteRef.current = after;
      setMinute(after);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const scrub = (m: number) => {
    minuteRef.current = m;
    setMinute(m);
  };
  const toggle = () => {
    userPaused.current = playing;
    setPlaying(!playing && visible.current);
  };

  const sun = clamp01((minute - SUNRISE) / (SUNSET - SUNRISE));
  const daylight = minute > SUNRISE - 30 && minute < SUNSET + 30 ? Math.sin(Math.PI * clamp01((minute - SUNRISE + 30) / (SUNSET - SUNRISE + 60))) : 0;
  const current = currentAt(minute);
  const next = nextAt(minute);
  const left = wrap(next.at - minute);
  const countdown = `${Math.floor(left / 60)}:${pad(Math.floor(left % 60))}`;
  const rtl = isRtlLocale(locale);

  return (
    <div ref={watch}>
      <div
        className="relative overflow-hidden rounded-3xl px-6 py-12 sm:px-16 sm:py-16 lg:px-28 lg:py-20"
        style={{ backgroundImage: wallAt(minute), boxShadow: 'inset 0 1px 2px rgba(38,24,10,0.06), inset 0 0 0 1px rgba(38,24,10,0.05)' }}
        aria-hidden
      >
        {STARS.map((star, i) => (
          <span
            key={i}
            className="pointer-events-none absolute rounded-full bg-white"
            style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.r, height: star.r, opacity: (1 - daylight) * (0.35 + (i % 4) * 0.15) }}
          />
        ))}
        {/* Sunlight through a two-pane window, crossing the wall from east to west, warmest at either end of the day. */}
        <div
          className="pointer-events-none absolute top-[6%] flex h-[88%] w-[26%] gap-[6%]"
          style={{ left: `${92 - sun * 110}%`, opacity: daylight * 0.8, transform: 'skewX(-16deg)', filter: 'blur(10px)' }}
        >
          {[0, 1].map((pane) => (
            <span
              key={pane}
              className="flex-1 rounded-sm"
              style={{ background: `linear-gradient(180deg, rgba(255,${214 + Math.round(daylight * 36)},${150 + Math.round(daylight * 90)},0.85), rgba(255,236,200,0.15))` }}
            />
          ))}
        </div>
        {/* At night the screen is the light in the room. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: (1 - daylight) * 0.9,
            background: 'radial-gradient(ellipse 45% 55% at 50% 50%, rgba(255,242,214,0.38), transparent 70%)',
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <TvFrame>
            <Screen minute={minute} current={current} next={next} countdown={countdown} arrival={arrival} locale={locale} rtl={rtl} />
          </TvFrame>
        </div>
      </div>

      {/* The day as a timeline: a marker at each prayer, and the playhead. */}
      <div dir="ltr" className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? t.pause : t.play}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-foreground"
        >
          {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4 translate-x-px" aria-hidden />}
        </button>
        <div className="relative flex-1 pb-6">
          <div className="relative h-1.5 rounded-full bg-border">
            <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${(minute / DAY) * 100}%` }} />
            {ROWS.map((r) => (
              <span
                key={r.name}
                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background"
                style={{ left: `${(r.at / DAY) * 100}%`, backgroundColor: r.at <= minute ? '#E8A817' : '#C9C4BA' }}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 top-4 hidden sm:block" aria-hidden>
            {ROWS.map((r) => (
              <span
                key={r.name}
                lang={locale.locale}
                className="absolute -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground"
                style={{ left: `${(r.at / DAY) * 100}%` }}
              >
                {locale.prayerNames[r.name]}
              </span>
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={DAY - 1}
            value={Math.floor(minute)}
            onChange={(e) => scrub(Number(e.target.value))}
            aria-label={t.scrub}
            aria-valuetext={clock(minute)}
            className="absolute inset-x-0 -top-3 h-7 w-full cursor-pointer opacity-0"
          />
        </div>
      </div>
    </div>
  );
}

interface ScreenProps {
  minute: number;
  current: Row | null;
  next: Row;
  countdown: string;
  arrival: { name: PrayerName; n: number } | null;
  locale: DisplayLocale;
  rtl: boolean;
}

/**
 * The display on the set, drawn after the Classic theme: the clock across the
 * top, the day's times with the passed ones ticked off, and the next prayer
 * counting down in the dark panel.
 */
function Screen({ minute, current, next, countdown, arrival, locale, rtl }: ScreenProps) {
  return (
    <div dir={rtl ? 'rtl' : 'ltr'} lang={locale.locale} className="absolute inset-0 flex flex-col bg-white text-[#1F2937]">
      <style>{FLASH}</style>
      <div className="flex flex-col items-center justify-center bg-linear-to-b from-[#E4EAF1] to-[#F4F6F9]" style={{ height: '29cqh' }}>
        <p className="font-bold tabular-nums leading-none tracking-[-0.03em]" style={{ fontSize: '17cqh' }}>
          {clock(minute)}
        </p>
      </div>
      <div className="grid flex-1 grid-cols-[1.4fr_1fr]">
        <ul className="flex flex-col">
          {ROWS.map((r) => {
            const on = r.name === current?.name;
            const upcoming = r.name === next.name;
            const passed = !on && r.at < minute && !upcoming;
            return (
              <li
                key={r.name}
                className="relative flex flex-1 items-center justify-between overflow-hidden border-b border-[#E5E7EB] transition-colors duration-500"
                style={{
                  fontSize: '5.2cqh',
                  paddingInline: '3cqw',
                  backgroundColor: on ? '#DCEFE3' : upcoming ? '#FBEFD5' : undefined,
                  boxShadow: on ? 'inset 0.5cqw 0 0 #2F9E5B' : upcoming ? 'inset 0.5cqw 0 0 #E8A817' : undefined,
                }}
              >
                {arrival?.name === r.name && <span key={arrival.n} className="day-flash absolute inset-0 bg-[#E8A817]" />}
                <span className={`relative flex items-center gap-[1cqw] font-semibold ${passed ? 'text-[#6B7280]' : ''}`}>
                  {passed && <span className="inline-block size-[3.4cqh] rounded-full bg-[#34A853] text-center text-white" style={{ fontSize: '2.4cqh', lineHeight: '3.4cqh' }}>✓</span>}
                  {locale.prayerNames[r.name]}
                </span>
                <span className={`relative font-bold tabular-nums ${passed ? 'text-[#6B7280] line-through' : ''}`}>{r.time}</span>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col items-center justify-center bg-[#475467] text-white">
          <p className="text-white/80" style={{ fontSize: '4.6cqh' }}>
            {locale.labels.next}
          </p>
          <p className="font-bold uppercase tracking-wide" style={{ fontSize: '6cqh' }}>
            {locale.prayerNames[next.name]}
          </p>
          <p className="font-bold tabular-nums leading-none" style={{ fontSize: '15cqh' }}>
            {next.time}
          </p>
          <p className="mt-[1.5cqh] font-semibold tabular-nums" style={{ fontSize: '6cqh' }}>
            {countdown}
          </p>
        </div>
      </div>
    </div>
  );
}

/** The flash as a prayer begins: its row catches the light, then settles into gold. */
const FLASH = `
.day-flash { opacity: 0; }
@media (prefers-reduced-motion: no-preference) {
  .day-flash { animation: day-flash 1100ms cubic-bezier(0.16, 1, 0.3, 1) both; }
}
@keyframes day-flash {
  0% { opacity: 0.9; transform: scaleX(0.15); transform-origin: left; }
  35% { opacity: 0.75; transform: scaleX(1); }
  100% { opacity: 0; transform: scaleX(1); }
}
`;
