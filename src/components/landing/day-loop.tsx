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
/** Minutes a second at full speed; calibrated so a whole day, slowdowns included, takes about twelve seconds. */
const SPEED = 182;
/** How close to a prayer the clock starts to slow, in minutes. */
const SLOW_WITHIN = 35;
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
  return SPEED * (0.1 + 0.9 * smooth(clamp01(near / SLOW_WITHIN)));
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

/** A fixed scatter of stars, out at night, each twinkling on its own beat. */
const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 37.7 + (i % 7) * 3.1) % 100,
  y: (i * 23.3 + (i % 5) * 7) % 70,
  r: 1 + (i % 3) * 0.7,
  beat: 1.6 + (i % 5) * 0.55,
  delay: (i % 9) * -0.37,
}));

/** Soft clouds that drift across by day: where each starts, its size and speed. */
const CLOUDS = [
  { start: 10, y: 8, w: 18, pace: 0.05 },
  { start: 55, y: 17, w: 24, pace: 0.035 },
  { start: 95, y: 5, w: 14, pace: 0.065 },
];

/** A flock, as offsets from its leader, in cqw. */
const FLOCK = [
  [0, 0],
  [-2.2, 1.2],
  [-2.4, -1.1],
  [-4.4, 2.3],
  [-4.8, -0.2],
];

/** Birds fly out in the morning, left to right, and home in the evening, right to left. */
function flockAt(minute: number): { x: number; y: number; opacity: number; flip: boolean } | null {
  const flights = [
    { from: SUNRISE - 20, to: SUNRISE + 170, flip: false, y: 16 },
    { from: SUNSET - 150, to: SUNSET + 10, flip: true, y: 12 },
  ];
  for (const f of flights) {
    if (minute < f.from || minute > f.to) continue;
    const p = (minute - f.from) / (f.to - f.from);
    const x = f.flip ? 108 - p * 120 : -12 + p * 120;
    return { x, y: f.y + Math.sin(p * Math.PI * 3) * 2, opacity: Math.min(1, Math.sin(p * Math.PI) * 2.5), flip: f.flip };
  }
  return null;
}

/** Domes, two minarets with their balconies and caps, and a row of houses, on a 1000 by 110 box. */
const SKYLINE = [
  'M0 110 V92 H60 V80 H110 V88 H150 V110 Z',
  'M168 110 V30 L176 12 L184 30 V110 Z M163 52 H189 V57 H163 Z',
  'M200 110 V78 H236 A64 64 0 0 1 364 78 H400 V110 Z',
  'M296 16 H304 V30 H296 Z',
  'M214 78 A18 18 0 0 1 250 78 Z M350 78 A18 18 0 0 1 386 78 Z',
  'M416 110 V30 L424 12 L432 30 V110 Z M411 52 H437 V57 H411 Z',
  'M450 110 V86 H520 V74 H580 V90 H640 V70 H700 V84 H760 V78 H830 V92 H900 V80 H960 V88 H1000 V110 Z',
].join(' ');
/** Where the town's windows are, to light at night. */
const WINDOWS: [number, number][] = [
  [20, 96], [80, 88], [120, 94], [260, 90], [300, 90], [334, 90], [470, 94], [530, 84], [560, 84],
  [600, 96], [660, 80], [680, 92], [720, 92], [780, 86], [850, 98], [880, 98], [920, 90], [975, 96],
];

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
 * A day at the mosque, played in twelve seconds. The sky over the town takes
 * the light of each hour: the sun arcs over, clouds drift, birds fly out in
 * the morning and home in the evening, and at night the stars and a crescent
 * come out and the windows light up. The display on the set keeps time on its own: the current prayer is
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
  const night = 1 - daylight;
  const moon = clamp01(wrap(minute - SUNSET) / (DAY - SUNSET + SUNRISE));
  const flock = flockAt(minute);
  const skyline = mix([22, 24, 44], [120, 112, 124], daylight);
  const current = currentAt(minute);
  const next = nextAt(minute);
  const left = wrap(next.at - minute);
  const countdown = `${Math.floor(left / 60)}:${pad(Math.floor(left % 60))}`;
  const rtl = isRtlLocale(locale);

  return (
    <div ref={watch}>
      <div
        className="relative overflow-hidden rounded-3xl pt-[9cqw] pb-[13cqw]"
        style={{ containerType: 'inline-size', backgroundImage: wallAt(minute), boxShadow: 'inset 0 1px 2px rgba(38,24,10,0.06), inset 0 0 0 1px rgba(38,24,10,0.05)' }}
        aria-hidden
      >
        {/* Stars, out as the light goes. */}
        <div className="pointer-events-none absolute inset-0" style={{ opacity: night ** 1.5 }}>
          {STARS.map((star, i) => (
            <span
              key={i}
              className="day-twinkle absolute rounded-full bg-white"
              style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.r, height: star.r, animationDuration: `${star.beat}s`, animationDelay: `${star.delay}s` }}
            />
          ))}
        </div>
        {/* The sun, arcing from east to west, reddening near the horizon. */}
        <span
          className="pointer-events-none absolute left-0 top-0 size-[7cqw] rounded-full will-change-transform"
          style={{
            transform: `translate3d(${3 + sun * 88}cqw, ${44 - Math.sin(Math.PI * sun) * 42}cqw, 0)`,
            opacity: daylight > 0 ? Math.min(1, daylight * 3) : 0,
            background: `radial-gradient(circle, #FFF8E1 0%, ${daylight > 0.45 ? '#FFD76A' : '#FF9F5A'} 55%, transparent 72%)`,
            boxShadow: `0 0 6cqw 2cqw ${daylight > 0.45 ? 'rgba(255,220,120,0.35)' : 'rgba(255,140,80,0.35)'}`,
          }}
        />
        {/* The moon, a crescent crossing the night. */}
        <span
          className="pointer-events-none absolute left-0 top-0 size-[4.2cqw] rounded-full will-change-transform"
          style={{
            transform: `translate3d(${4 + moon * 88}cqw, ${44 - Math.sin(Math.PI * moon) * 40}cqw, 0) rotate(-20deg)`,
            opacity: night,
            boxShadow: 'inset 1.1cqw -0.5cqw 0 0 #F6F1DA, 0 0 3cqw rgba(246,241,218,0.25)',
          }}
        />
        {/* Clouds by day, tinted by the sky behind them. */}
        {CLOUDS.map((c, i) => (
          <span
            key={i}
            className="pointer-events-none absolute left-0 top-0 rounded-full bg-white blur-[1.2cqw] will-change-transform"
            style={{
              width: `${c.w}cqw`,
              height: `${c.w * 0.32}cqw`,
              transform: `translate3d(${((c.start + minute * c.pace) % 130) - 20}cqw, ${c.y}cqw, 0)`,
              opacity: daylight * 0.75,
            }}
          />
        ))}
        {/* A flock out in the morning, home in the evening. */}
        {flock && (
          <div
            className="pointer-events-none absolute left-0 top-0 will-change-transform"
            style={{ transform: `translate3d(${flock.x}cqw, ${flock.y}cqw, 0) scaleX(${flock.flip ? -1 : 1})`, opacity: flock.opacity }}
          >
            {FLOCK.map(([dx, dy], i) => (
              <svg
                key={i}
                viewBox="0 0 16 6"
                className="day-flap absolute w-[1.8cqw]"
                style={{ left: `${dx}cqw`, top: `${dy}cqw`, animationDelay: `${i * -0.13}s` }}
              >
                <path d="M1 5 Q4.5 0.5 8 4 Q11.5 0.5 15 5" fill="none" stroke={daylight > 0.5 ? '#3B3F55' : '#2A2238'} strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            ))}
          </div>
        )}
        {/* The town at the foot of the sky: a mosque with two minarets, and houses whose windows light up after dark. */}
        <svg viewBox="0 0 1000 110" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-[11cqw] w-full">
          <path fill={skyline} d={SKYLINE} />
          <g fill="#FFD27A" opacity={night}>
            {WINDOWS.map(([x, y], i) => (
              <rect key={i} x={x} y={y} width="6" height="8" rx="1" />
            ))}
          </g>
        </svg>
        {/* At night the screen is the light in the room. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: night * 0.9, background: 'radial-gradient(ellipse 45% 55% at 50% 45%, rgba(255,242,214,0.3), transparent 70%)' }}
        />
        <div className="relative mx-auto w-[58cqw] min-w-[17rem]">
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
            <div className="absolute inset-0 origin-left rounded-full bg-primary will-change-transform" style={{ transform: `scaleX(${minute / DAY})` }} />
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
@media (prefers-reduced-motion: no-preference) {
  .day-twinkle { animation: day-twinkle ease-in-out infinite alternate; }
  .day-flap { animation: day-flap 0.45s ease-in-out infinite alternate; transform-origin: 50% 70%; }
}
@keyframes day-twinkle { from { opacity: 1; } to { opacity: 0.25; } }
@keyframes day-flap { from { transform: scaleY(1); } to { transform: scaleY(0.35); } }
@keyframes day-flash {
  0% { opacity: 0.9; transform: scaleX(0.15); transform-origin: left; }
  35% { opacity: 0.75; transform: scaleX(1); }
  100% { opacity: 0; transform: scaleX(1); }
}
`;
