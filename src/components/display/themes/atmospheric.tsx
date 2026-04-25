'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ThemeProps, ThemeDefinition } from './index';
import type { PrayerTimeEntry } from '@/types/prayer';
import type { DisplayLocale } from '@/lib/display-locale';
import { formatPrayerTime, formatDisplayDate } from '@/lib/display-locale';

// ─── Types ───────────────────────────────────────────────────────────

interface Palette {
  bg: [string, string, string];
  ink: string;
  sub: string;
  accent: string;
  stars: number;
  mode: PaletteMode;
}

type PaletteMode =
  | 'night'
  | 'fajr'
  | 'isha'
  | 'dawn'
  | 'dusk'
  | 'sunrise'
  | 'sunset'
  | 'morning'
  | 'asr'
  | 'day';

interface PaletteAnchor {
  bg: [string, string, string];
  ink: string;
  sub: string;
  accent: string;
  stars: number;
  mode: PaletteMode;
}

interface SolarGeometry {
  sunriseMin: number;
  sunsetMin: number;
  solarNoonMin: number;
  halfDayMin: number;
  maxAltDeg: number;
}

// ─── Time helpers ────────────────────────────────────────────────────

const pad = (n: number): string => String(n).padStart(2, '0');
const toMins = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// ─── Solar model ─────────────────────────────────────────────────────

function computeGeometry(prayers: PrayerTimeEntry[]): SolarGeometry {
  const sunrise = prayers.find((p) => p.name === 'sunrise');
  const maghrib = prayers.find((p) => p.name === 'maghrib');
  const dhuhr = prayers.find((p) => p.name === 'dhuhr');
  const sunriseMin = sunrise ? toMins(sunrise.time) : 6 * 60 + 30;
  const sunsetMin = maghrib ? toMins(maghrib.time) : 19 * 60 + 30;
  const solarNoonMin = dhuhr ? toMins(dhuhr.time) - 4 : (sunriseMin + sunsetMin) / 2;
  const halfDayMin = Math.max(60, (sunsetMin - sunriseMin) / 2);

  // Approximate peak sun altitude from day length (min). Longer day → higher sun.
  // 12h day → ~45°, 16h → ~60°, 8h → ~20°.
  const dayHours = (sunsetMin - sunriseMin) / 60;
  const maxAltDeg = Math.max(15, Math.min(70, 30 + (dayHours - 8) * 4));

  return { sunriseMin, sunsetMin, solarNoonMin, halfDayMin, maxAltDeg };
}

function solarAltitude(mins: number, geo: SolarGeometry): number {
  const dt = mins - geo.solarNoonMin;
  const HOUR_ANGLE_PER_MIN = 90 / geo.halfDayMin;
  const H = dt * HOUR_ANGLE_PER_MIN;
  const sinMax = Math.sin((geo.maxAltDeg * Math.PI) / 180);
  const sinAlt = sinMax * Math.cos((H * Math.PI) / 180);
  return (Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180) / Math.PI;
}

// ─── Palette by altitude ─────────────────────────────────────────────

function lerpHex(h1: string, h2: string, u: number): string {
  const parse = (h: string): [number, number, number] => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(h1);
  const [r2, g2, b2] = parse(h2);
  return (
    '#' +
    [
      Math.round(r1 + (r2 - r1) * u),
      Math.round(g1 + (g2 - g1) * u),
      Math.round(b1 + (b2 - b1) * u),
    ]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

function paletteForAltitude(alt: number, mins: number, solarNoon: number): Palette {
  const isMorning = mins < solarNoon;

  const A_DEEP_NIGHT: PaletteAnchor = { bg: ['#05071a', '#0a0c24', '#03050f'], ink: '#FFFFFF', sub: '#9aa0c0', accent: '#FFD27A', stars: 1.0,  mode: 'night' };
  const A_NIGHT: PaletteAnchor      = { bg: ['#0a0e2a', '#13163a', '#08091e'], ink: '#FFFFFF', sub: '#a0a4c8', accent: '#FFD27A', stars: 0.95, mode: 'night' };
  const A_TWILIGHT: PaletteAnchor   = { bg: ['#16193e', '#1f2350', '#15183c'], ink: '#FFFFFF', sub: '#b8bcd8', accent: '#FFD27A', stars: 0.55, mode: isMorning ? 'fajr' : 'isha' };
  const A_CIVIL: PaletteAnchor      = { bg: ['#1f2a52', '#2d3a64', '#3a4570'], ink: '#FFFFFF', sub: '#c4cce0', accent: '#FFD27A', stars: 0.18, mode: isMorning ? 'dawn' : 'dusk' };
  const A_HORIZON_M: PaletteAnchor  = { bg: ['#F5C898', '#F8DBB4', '#FBEDD2'], ink: '#1a1408', sub: '#6a5544', accent: '#E55A00', stars: 0,    mode: 'sunrise' };
  const A_HORIZON_E: PaletteAnchor  = { bg: ['#D87856', '#7a4868', '#1f2548'], ink: '#FFFFFF', sub: '#e8d8d0', accent: '#FFD27A', stars: 0.06, mode: 'sunset' };
  const A_LOW_M: PaletteAnchor      = { bg: ['#FAE4C4', '#F0EEE4', '#E4ECF4'], ink: '#1a1408', sub: '#5a5448', accent: '#E55A00', stars: 0,    mode: 'morning' };
  const A_LOW_E: PaletteAnchor      = { bg: ['#F0BF8A', '#E8AC88', '#C89488'], ink: '#1a0e08', sub: '#5a4438', accent: '#C03A00', stars: 0,    mode: 'asr' };
  const A_BLUE: PaletteAnchor       = { bg: ['#9ACBEC', '#CEE5F4', '#EEF5FB'], ink: '#0A0A0A', sub: '#506070', accent: '#E55A00', stars: 0,    mode: 'morning' };
  const A_HIGH: PaletteAnchor       = { bg: ['#5DAEE0', '#A0CFEA', '#E0EEF7'], ink: '#0A0A0A', sub: '#3a4858', accent: '#E55A00', stars: 0,    mode: 'day' };

  const stops: { alt: number; p: PaletteAnchor }[] = isMorning
    ? [
        { alt: -30, p: A_DEEP_NIGHT },
        { alt: -18, p: A_TWILIGHT },
        { alt: -6,  p: A_CIVIL },
        { alt: -0.83, p: A_HORIZON_M },
        { alt: 10,  p: A_LOW_M },
        { alt: 30,  p: A_BLUE },
        { alt: 70,  p: A_HIGH },
      ]
    : [
        { alt: -30, p: A_NIGHT },
        { alt: -18, p: A_TWILIGHT },
        { alt: -6,  p: A_CIVIL },
        { alt: -0.83, p: A_HORIZON_E },
        { alt: 10,  p: A_LOW_E },
        { alt: 30,  p: A_BLUE },
        { alt: 70,  p: A_HIGH },
      ];

  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (alt >= stops[i].alt && alt <= stops[i + 1].alt) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const span = b.alt - a.alt || 1;
  const u = Math.max(0, Math.min(1, (alt - a.alt) / span));

  return {
    bg: [
      lerpHex(a.p.bg[0], b.p.bg[0], u),
      lerpHex(a.p.bg[1], b.p.bg[1], u),
      lerpHex(a.p.bg[2], b.p.bg[2], u),
    ],
    ink: lerpHex(a.p.ink, b.p.ink, u),
    sub: lerpHex(a.p.sub, b.p.sub, u),
    accent: lerpHex(a.p.accent, b.p.accent, u),
    stars: a.p.stars + (b.p.stars - a.p.stars) * u,
    mode: u < 0.5 ? a.p.mode : b.p.mode,
  };
}

// ─── Decorative layers ───────────────────────────────────────────────

interface Star {
  x: number;
  y: number;
  r: number;
  twinkle: number;
  delay: number;
}

const STARS: Star[] = (() => {
  const arr: Star[] = [];
  let seed = 1337;
  const rand = (): number => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 80; i++) {
    arr.push({ x: rand() * 100, y: rand() * 60, r: rand() * 1.4 + 0.4, twinkle: rand() * 4 + 2, delay: rand() * 4 });
  }
  return arr;
})();

function Stars({ opacity }: { opacity: number }) {
  if (opacity <= 0.02) return null;
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity }}>
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={`${s.x}%`}
          cy={`${s.y}%`}
          r={s.r}
          fill="#fff"
          style={{ animation: `atmoTwinkle ${s.twinkle}s ease-in-out ${s.delay}s infinite` }}
        />
      ))}
      <circle cx="78%" cy="18%" r="2.4" fill="#fff" opacity="0.95" />
      <circle cx="22%" cy="11%" r="1.8" fill="#fff" opacity="0.9" />
      <circle cx="62%" cy="32%" r="1.6" fill="#fff" opacity="0.85" />
    </svg>
  );
}

interface CloudConfig {
  y: number;
  scale: number;
  duration: number;
  startOffset: number;
  opacity: number;
}

const CLOUDS: CloudConfig[] = [
  { y: 8,  scale: 1.2,  duration: 360, startOffset: 0,    opacity: 0.55 },
  { y: 18, scale: 0.85, duration: 360, startOffset: 0.33, opacity: 0.45 },
  { y: 28, scale: 1.0,  duration: 360, startOffset: 0.66, opacity: 0.50 },
];

function Clouds({ daylight }: { daylight: number }) {
  if (daylight < 0.6) return null;
  const mul = (daylight - 0.6) / 0.4;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {CLOUDS.map((c, i) => (
        <svg
          key={i}
          viewBox="0 0 200 80"
          style={{
            position: 'absolute',
            top: `${c.y}%`,
            left: 0,
            width: `${220 * c.scale}px`,
            height: `${88 * c.scale}px`,
            opacity: c.opacity * mul,
            animation: `atmoCloudDrift ${c.duration}s linear ${-c.startOffset * c.duration}s infinite`,
            filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.4))',
          }}
        >
          <defs>
            <linearGradient id={`atmoCloudGrad${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e8efff" />
            </linearGradient>
          </defs>
          <g fill={`url(#atmoCloudGrad${i})`}>
            <ellipse cx="95" cy="50" rx="80" ry="20" />
            <circle cx="50" cy="48" r="22" />
            <circle cx="75" cy="36" r="26" />
            <circle cx="100" cy="30" r="30" />
            <circle cx="130" cy="36" r="24" />
            <circle cx="150" cy="46" r="20" />
          </g>
        </svg>
      ))}
    </div>
  );
}

function ShootingStars({ opacity }: { opacity: number }) {
  if (opacity <= 0.4) return null;
  const streaks = [
    { sx: 10, sy: 12, dx: 14, dy: 6, cycle: 22, delay: 4 },
    { sx: 55, sy: 8,  dx: 12, dy: 5, cycle: 31, delay: 14 },
    { sx: 30, sy: 28, dx: 16, dy: 7, cycle: 27, delay: 24 },
  ];
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity }}>
      <defs>
        <linearGradient id="atmoStreakGrad" x1="0%" y1="0%" x2="100%" y2="40%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="70%" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {streaks.map((s, i) => (
        <line
          key={i}
          x1={`${s.sx}%`}
          y1={`${s.sy}%`}
          x2={`${s.sx + s.dx}%`}
          y2={`${s.sy + s.dy}%`}
          stroke="url(#atmoStreakGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength={200}
          style={{
            animation: `atmoShootStar${i} ${s.cycle}s linear ${s.delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </svg>
  );
}

function HorizonGlow({ alt, isMorning }: { alt: number; isMorning: boolean }) {
  if (alt > 14 || alt < -10) return null;
  const intensity = Math.max(0, 1 - Math.abs(alt) / 12);
  const warm = isMorning ? '#FF8FA8' : '#FF9560';
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `radial-gradient(ellipse 80% 40% at 50% 100%, ${warm}55 0%, ${warm}22 30%, transparent 60%)`,
        opacity: intensity * 0.7,
        transition: 'opacity 30s linear',
      }}
    />
  );
}

function Vignette() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse 110% 85% at 50% 50%, transparent 50%, rgba(0,0,0,0.35) 100%)',
        mixBlendMode: 'multiply',
      }}
    />
  );
}

function FilmGrain() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.06, mixBlendMode: 'overlay' }}>
      <filter id="atmoGrainNoise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#atmoGrainNoise)" />
    </svg>
  );
}

function Birds({ alt, isMorning }: { alt: number; isMorning: boolean }) {
  if (!isMorning || alt < -2 || alt > 8) return null;
  const intensity = Math.max(0, 1 - Math.abs(alt - 3) / 5);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: intensity * 0.7 }}>
      <svg style={{ position: 'absolute', top: '32%', width: '20%', left: '5%', animation: 'atmoBirdsDrift 60s linear infinite' }} viewBox="0 0 200 40">
        {[
          [30, 18],
          [70, 14],
          [110, 22],
        ].map(([x, y], i) => (
          <path
            key={i}
            d={`M${x},${y} q4,-5 8,0 q4,-5 8,0`}
            stroke="#3a3a4a"
            strokeWidth={1.4}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </svg>
    </div>
  );
}

function Moon({ opacity, isPortrait }: { opacity: number; isPortrait: boolean }) {
  if (opacity <= 0.05) return null;
  const cx = '82%';
  const cy = isPortrait ? '13%' : '20%';
  const cxOff = '83.5%';
  const cyOff = isPortrait ? '11.8%' : '18.5%';
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity }}>
      <defs>
        <radialGradient id="atmoMoonGlow">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <mask id="atmoMoonMask">
          <rect width="100%" height="100%" fill="white" />
          <circle cx={cxOff} cy={cyOff} r={34} fill="black" />
        </mask>
      </defs>
      <circle cx={cx} cy={cy} r={120} fill="url(#atmoMoonGlow)" style={{ animation: 'atmoCelestial 8s ease-in-out infinite', transformOrigin: `${cx} ${cy}` }} />
      <circle cx={cx} cy={cy} r={36} fill="#FFFDF0" mask="url(#atmoMoonMask)" />
    </svg>
  );
}

function Sun({ alt, mins, geo, isPortrait }: { alt: number; mins: number; geo: SolarGeometry; isPortrait: boolean }) {
  if (alt < -2) return null;
  const dt = mins - geo.solarNoonMin;
  const HOUR_ANGLE_PER_MIN = 90 / geo.halfDayMin;
  const H = dt * HOUR_ANGLE_PER_MIN;
  const xPct = 50 + (H / 90) * 42;

  const HORIZON_Y = isPortrait ? 25 : 70;
  const TOP_Y = isPortrait ? 5 : 8;
  const altClamped = Math.max(-2, Math.min(geo.maxAltDeg, alt));
  const yPct = HORIZON_Y - (altClamped / geo.maxAltDeg) * (HORIZON_Y - TOP_Y);

  const lowSun = alt < 12;
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <defs>
        <radialGradient id="atmoSunGlow">
          <stop offset="0%" stopColor={lowSun ? '#FFE3A8' : '#FFF8DC'} stopOpacity="0.6" />
          <stop offset="100%" stopColor={lowSun ? '#FFB37A' : '#FFE9B0'} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle
        cx={`${xPct}%`}
        cy={`${yPct}%`}
        r={lowSun ? 220 : 160}
        fill="url(#atmoSunGlow)"
        style={{ animation: 'atmoCelestial 7s ease-in-out infinite', transformOrigin: `${xPct}% ${yPct}%` }}
      />
      <circle
        cx={`${xPct}%`}
        cy={`${yPct}%`}
        r={lowSun ? 48 : 42}
        fill={lowSun ? '#FFD8A0' : '#FFF6D8'}
        style={{ filter: `drop-shadow(0 0 28px ${lowSun ? '#FFB37A' : '#FFE9B0'})` }}
      />
    </svg>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function brightness(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

const ACCENT_OPTIONS = [
  { value: 'auto',    label: 'Auto (time of day)' },
  { value: '#FFD970', label: 'Yellow' },
  { value: '#FF8C42', label: 'Orange' },
  { value: '#E5484D', label: 'Red' },
  { value: '#FF6B9D', label: 'Pink' },
  { value: '#9D6BFF', label: 'Purple' },
  { value: '#3E8EF7', label: 'Blue' },
  { value: '#4ED6E5', label: 'Cyan' },
  { value: '#2DD4BF', label: 'Teal' },
  { value: '#4ADE80', label: 'Green' },
  { value: '#F5F5F0', label: 'White' },
];

// ─── Theme definition ────────────────────────────────────────────────

export const atmosphericDefinition: ThemeDefinition = {
  id: 'atmospheric',
  name: 'Atmospheric',
  description: 'Living sky that follows real solar geometry — dawn through dusk',
  preview: 'bg-linear-to-br from-[#0a0e2a] via-[#1f2350] to-[#3a4570]',
  component: AtmosphericTheme,
  fields: [
    {
      key: 'accent',
      label: 'Accent color',
      type: 'select',
      defaultValue: 'auto',
      description: 'Highlight color for the next prayer and progress fill',
      options: ACCENT_OPTIONS,
    },
    {
      key: 'showSeconds',
      label: 'Show seconds',
      type: 'switch',
      defaultValue: true,
      description: 'Tick the seconds beside the main clock',
    },
  ],
  defaultConfig: {
    accent: 'auto',
    showSeconds: true,
  },
};

// ─── Theme component ─────────────────────────────────────────────────

export function AtmosphericTheme({ mosqueName, mosqueLogoUrl, prayers, nextPrayer, config, isPortrait, locale }: ThemeProps) {
  const now = useNow();
  const mins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  const geo = useMemo(() => computeGeometry(prayers), [prayers]);
  const alt = solarAltitude(mins, geo);
  const palette = paletteForAltitude(alt, mins, geo.solarNoonMin);

  const accentSetting = (config?.accent as string) ?? 'auto';
  const accent = accentSetting && accentSetting !== 'auto' ? accentSetting : palette.accent;
  const showSeconds = config?.showSeconds !== false;

  const fgInk = brightness(palette.bg[1]) > 140 ? '#0A0A0A' : '#FFFFFF';
  const fgSub = brightness(palette.bg[1]) > 140 ? '#5a5448' : '#c4cce0';
  const accentInk = brightness(accent) > 160 ? '#0A0A0A' : '#FFFFFF';
  const inkSoft = fgInk === '#FFFFFF' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)';

  // ─── Clock formatting (respect locale) ─────────────────────────────
  let hours = now.getHours();
  const minutesNum = now.getMinutes();
  const secondsNum = now.getSeconds();
  let suffix = '';
  if (!locale.use24Hour) {
    suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
  }
  const hStr = locale.use24Hour ? pad(hours) : String(hours);
  const mStr = pad(minutesNum);
  const sStr = pad(secondsNum);

  const dateStr = formatDisplayDate(now, locale);

  // ─── Prayer schedule ───────────────────────────────────────────────
  const active = prayers.filter((p) => p.name !== 'sunrise');

  const isMorning = mins < geo.solarNoonMin;

  // Build timeline including sunrise as a muted marker
  const timelinePrayers = prayers;

  // Find next + current
  const next = nextPrayer ?? null;
  const nextMins = next ? toMins(next.time) : 0;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nextMinsUntil = next ? (nextMins > nowMins ? nextMins - nowMins : 24 * 60 - nowMins + nextMins) : 0;
  const nextSecsUntil = Math.max(0, nextMinsUntil * 60 - secondsNum);

  let currentKey: string | null = null;
  for (let i = 0; i < active.length; i++) {
    const start = toMins(active[i].time);
    const end = i + 1 < active.length ? toMins(active[i + 1].time) : 24 * 60 + 60;
    if (nowMins >= start && nowMins < end) {
      currentKey = active[i].name;
      break;
    }
  }

  // Iqamah state
  const PRAYER_APPROACH_WIN = 15;
  const IQAMAH_NOW_WIN = 2;
  type IqPhase = 'none' | 'approaching' | 'pending' | 'now';
  let iqamahPhase: IqPhase = 'none';
  let iqMinsUntil = 0;
  const currentPrayer = currentKey ? active.find((p) => p.name === currentKey) : null;
  if (currentPrayer?.iqamahTime) {
    const iqMins = toMins(currentPrayer.iqamahTime);
    if (nowMins < iqMins) {
      iqamahPhase = 'pending';
      iqMinsUntil = iqMins - nowMins;
    } else if (nowMins < iqMins + IQAMAH_NOW_WIN) {
      iqamahPhase = 'now';
    }
  }
  if (iqamahPhase === 'none' && next && nextMinsUntil <= PRAYER_APPROACH_WIN) {
    iqamahPhase = 'approaching';
  }

  const cdTotal = iqamahPhase === 'pending' ? iqMinsUntil * 60 - secondsNum : nextSecsUntil;
  const cdH = pad(Math.max(0, Math.floor(cdTotal / 3600)));
  const cdM = pad(Math.max(0, Math.floor((cdTotal % 3600) / 60)));
  const cdS = pad(Math.max(0, Math.floor(cdTotal % 60)));

  // Urgent/alert overlay banner copy (landscape uses a bottom-center banner;
  // portrait shows the same in the next prayer's row).
  let urgentLabel: string | null = null;
  let urgentAlert = false;
  if (iqamahPhase === 'now' && currentPrayer) {
    urgentLabel = `${locale.labels.iqamah} ${locale.labels.now} · ${currentPrayer.displayName}`;
    urgentAlert = true;
  } else if (iqamahPhase === 'pending' && currentPrayer) {
    urgentLabel = `${currentPrayer.displayName} ${locale.labels.iqamah}`;
  } else if (iqamahPhase === 'approaching' && next) {
    urgentLabel = `${next.displayName} Adhan`;
  }

  // Timeline domain
  const dayStart = active.length ? toMins(active[0].time) - 30 : 0;
  const dayEnd = active.length ? toMins(active[active.length - 1].time) + 90 : 24 * 60;

  // ─── Layout ────────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: `linear-gradient(180deg, ${palette.bg[0]} 0%, ${palette.bg[1]} 55%, ${palette.bg[2]} 100%)`,
    color: fgInk,
    fontFamily: '"Inter", -apple-system, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    transition: 'background 1.2s ease, color 1.2s ease',
    boxSizing: 'border-box',
  };

  const sky = (
    <>
      <Stars opacity={palette.stars} />
      <ShootingStars opacity={palette.stars} />
      <Clouds daylight={Math.max(0, 1 - palette.stars * 1.2)} />
      <HorizonGlow alt={alt} isMorning={isMorning} />
      <Birds alt={alt} isMorning={isMorning} />
      <Moon opacity={palette.stars * 0.9} isPortrait={isPortrait} />
      <Sun alt={alt} mins={mins} geo={geo} isPortrait={isPortrait} />
      <Vignette />
      <FilmGrain />
      {Math.abs(alt) < 18 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '40%',
            background: `linear-gradient(180deg, transparent 0%, ${palette.bg[1]}77 60%, ${palette.bg[2]} 100%)`,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );

  if (isPortrait) {
    return (
      <div style={containerStyle}>
        {sky}
        <svg
          viewBox="0 0 1080 220"
          preserveAspectRatio="none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '20cqmin', pointerEvents: 'none' }}
        >
          <path
            d={`M 0 220 L 0 195 L 200 195 L 220 191 L 260 195 L 540 195 L 560 191 L 600 195 L 880 195 L 900 191 L 940 195 L 1080 195 L 1080 220 Z`}
            fill={palette.bg[2]}
            opacity={0.45}
          />
        </svg>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '6.5cqmin 5.5cqmin 8.3cqmin',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Header — brand only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.7cqmin', flexShrink: 0 }}>
            <BrandMark logoUrl={mosqueLogoUrl} accent={accent} size="3.7cqmin" />
            <div style={{ fontSize: '3.7cqmin', fontWeight: 600, letterSpacing: -0.4 }}>{mosqueName}</div>
          </div>

          {/* Hero clock + date */}
          <div style={{ textAlign: 'center', width: '100%', flexShrink: 0 }}>
            <div
              style={{
                fontFamily: '"Inter Tight", Inter, sans-serif',
                fontSize: '29.6cqmin',
                lineHeight: 0.82,
                letterSpacing: '-0.9cqmin',
                fontWeight: 600,
                fontFeatureSettings: '"tnum" 1, "ss01" 1',
                display: 'inline-flex',
                alignItems: 'baseline',
                position: 'relative',
              }}
              suppressHydrationWarning
            >
              <span>{hStr}</span>
              <span style={{ color: accent }}>:</span>
              <span>{mStr}</span>
              {showSeconds && (
                <span
                  style={{
                    fontFamily: '"Inter Tight", Inter, sans-serif',
                    position: 'absolute',
                    left: '100%',
                    bottom: '1.5cqmin',
                    marginLeft: '1.1cqmin',
                    fontSize: '4.8cqmin',
                    fontWeight: 400,
                    fontFeatureSettings: '"tnum" 1',
                    color: fgSub,
                    letterSpacing: '-0.05cqmin',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                  }}
                >
                  :{sStr}
                  {!locale.use24Hour && (
                    <div style={{ marginTop: '0.55cqmin', fontSize: '2.4cqmin', letterSpacing: 2, textTransform: 'uppercase' }}>{suffix}</div>
                  )}
                </span>
              )}
            </div>
            <div style={{
              marginTop: '1.7cqmin',
              fontSize: '2.8cqmin', fontWeight: 500, color: fgSub,
              letterSpacing: 0.2, lineHeight: 1.2,
            }}>
              {dateStr}
            </div>
          </div>

          {/* Vertical prayer list */}
          <PortraitPrayerList
            prayers={timelinePrayers}
            currentKey={currentKey}
            nextKey={next?.name ?? null}
            nowMins={nowMins}
            accent={accent}
            accentInk={accentInk}
            fgInk={fgInk}
            inkSoft={inkSoft}
            locale={locale}
            iqamahPhase={iqamahPhase}
            cdH={cdH}
            cdM={cdM}
            cdS={cdS}
          />
        </div>

        <AtmoStyles />
      </div>
    );
  }

  // ─── Landscape ───
  return (
    <div style={containerStyle}>
      {sky}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '17cqmin',
          background: `linear-gradient(180deg, transparent 0%, ${palette.bg[2]}66 50%, ${palette.bg[2]} 100%)`,
          pointerEvents: 'none',
        }}
      />
      <svg
        viewBox="0 0 1920 240"
        preserveAspectRatio="none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '22cqmin', pointerEvents: 'none' }}
      >
        <path
          d={`M 0 240 L 0 215 L 320 215 L 340 209 L 380 215 L 720 215 L 740 211 L 780 215 L 1140 215 L 1160 211 L 1200 215 L 1540 215 L 1560 209 L 1600 215 L 1920 215 L 1920 240 Z`}
          fill={palette.bg[2]}
          opacity={0.45}
        />
      </svg>

      <div style={{ position: 'absolute', inset: 0, padding: '5.2cqmin 7.4cqmin', display: 'flex', flexDirection: 'column' }}>
        {/* Header — brand only */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.7cqmin' }}>
          <BrandMark logoUrl={mosqueLogoUrl} accent={accent} size="2.6cqmin" />
          <div style={{ fontSize: '2.6cqmin', fontWeight: 600, letterSpacing: -0.2 }}>{mosqueName}</div>
        </div>

        {/* Hero clock + date below */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <div
              style={{
                fontFamily: '"Inter Tight", Inter, sans-serif',
                fontSize: '33cqmin',
                lineHeight: 0.85,
                letterSpacing: '-1.1cqmin',
                fontWeight: 600,
                fontFeatureSettings: '"tnum" 1, "ss01" 1',
                display: 'flex',
                alignItems: 'baseline',
                position: 'relative',
              }}
              suppressHydrationWarning
            >
              <span>{hStr}</span>
              <span style={{ color: accent }}>:</span>
              <span>{mStr}</span>
              {showSeconds && (
                <span
                  style={{
                    position: 'absolute',
                    left: '100%',
                    bottom: 0,
                    marginLeft: '2.2cqmin',
                    fontSize: '5.9cqmin',
                    color: fgSub,
                    letterSpacing: '-0.18cqmin',
                    whiteSpace: 'nowrap',
                  }}
                >
                  :{sStr}
                  {!locale.use24Hour && <span style={{ marginLeft: '1.1cqmin' }}>{suffix}</span>}
                </span>
              )}
            </div>
          </div>
          <div style={{
            fontSize: '2.8cqmin', fontWeight: 500, color: fgSub, letterSpacing: 1.6,
            textTransform: 'uppercase', marginTop: '2.6cqmin',
          }}>
            {dateStr}
          </div>
        </div>

        {/* Timeline */}
        <LandscapeTimeline
          prayers={timelinePrayers}
          active={active}
          currentKey={currentKey}
          nextKey={next?.name ?? null}
          nowMins={nowMins}
          dayStart={dayStart}
          dayEnd={dayEnd}
          accent={accent}
          inkSoft={inkSoft}
          fgInk={fgInk}
          locale={locale}
          iqamahPhase={iqamahPhase}
          cdH={cdH}
          cdM={cdM}
          cdS={cdS}
        />
      </div>

      {/* Urgent / alert banner — bottom-center overlay */}
      {urgentLabel && (
        <UrgentBanner
          label={urgentLabel}
          isAlert={urgentAlert}
          accent={accent}
          accentInk={accentInk}
          cdH={cdH}
          cdM={cdM}
          cdS={cdS}
        />
      )}

      <AtmoStyles />
    </div>
  );
}

// ─── Brand mark (logo or accent fallback) ────────────────────────────

function BrandMark({ logoUrl, accent, size }: { logoUrl: string | null; accent: string; size: string }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        style={{
          height: size,
          width: 'auto',
          maxWidth: size,
          objectFit: 'contain',
          display: 'block',
        }}
      />
    );
  }
  return <div style={{ width: size, height: size, background: accent, borderRadius: 2 }} />;
}

// ─── Urgent / alert overlay banner ───────────────────────────────────

interface UrgentBannerProps {
  label: string;
  isAlert: boolean;
  accent: string;
  accentInk: string;
  cdH: string;
  cdM: string;
  cdS: string;
}

function UrgentBanner({ label, isAlert, accent, accentInk, cdH, cdM, cdS }: UrgentBannerProps) {
  const sepColor = `${accentInk}66`;
  return (
    <div style={{
      position: 'absolute', left: '50%', bottom: '2.2cqmin',
      transform: 'translateX(-50%)',
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      padding: '2cqmin 5.2cqmin',
      background: accent,
      animation: isAlert ? 'atmoPulse 1.6s ease-in-out infinite' : 'none',
      zIndex: 10,
    }}>
      <div style={{
        fontSize: '2cqmin', fontWeight: 700, letterSpacing: '0.3cqmin',
        textTransform: 'uppercase', color: accentInk,
        marginBottom: isAlert ? 0 : '0.9cqmin',
        whiteSpace: 'nowrap', textAlign: 'center',
      }}>
        {label}
      </div>
      {!isAlert && (
        <div
          style={{
            fontFamily: '"Inter Tight", Inter, sans-serif',
            fontSize: '8.1cqmin', fontWeight: 700, letterSpacing: -0.5,
            fontFeatureSettings: '"tnum" 1',
            color: accentInk, lineHeight: 1,
          }}
          suppressHydrationWarning
        >
          {cdH}<span style={{ color: sepColor, margin: '0 4px' }}>:</span>{cdM}<span style={{ color: sepColor, margin: '0 4px' }}>:</span>{cdS}
        </div>
      )}
    </div>
  );
}

// ─── Portrait prayer list ────────────────────────────────────────────

type IqPhaseStr = 'none' | 'approaching' | 'pending' | 'now';

interface PortraitPrayerListProps {
  prayers: PrayerTimeEntry[];
  currentKey: string | null;
  nextKey: string | null;
  nowMins: number;
  accent: string;
  accentInk: string;
  fgInk: string;
  inkSoft: string;
  locale: DisplayLocale;
  iqamahPhase: IqPhaseStr;
  cdH: string;
  cdM: string;
  cdS: string;
}

function PortraitPrayerList({
  prayers, currentKey, nextKey, nowMins, accent, accentInk, fgInk, inkSoft, locale,
  iqamahPhase, cdH, cdM, cdS,
}: PortraitPrayerListProps) {
  const active = prayers.filter((p) => p.name !== 'sunrise');
  const N = active.length;
  if (!N) return null;
  const positions = active.map((_, i) => (N === 1 ? 0.5 : i / (N - 1)));

  let evenProgress = 0;
  if (nowMins <= toMins(active[0].time)) evenProgress = 0;
  else if (nowMins >= toMins(active[N - 1].time)) evenProgress = 1;
  else {
    for (let i = 0; i < N - 1; i++) {
      const a = toMins(active[i].time);
      const b = toMins(active[i + 1].time);
      if (nowMins >= a && nowMins < b) {
        const segFrac = (nowMins - a) / (b - a);
        evenProgress = (i + segFrac) / (N - 1);
        break;
      }
    }
  }

  const TRACK_X = '3.3cqmin';
  const trackColor = fgInk === '#FFFFFF' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.38)';

  return (
    <div style={{ position: 'relative', height: '88cqmin', flexShrink: 0 }}>
      {/* Track */}
      <div style={{
        position: 'absolute', left: TRACK_X, top: '2.8cqmin', bottom: '2.8cqmin',
        width: '0.3cqmin', background: trackColor,
      }} />
      {/* Progress fill */}
      <div style={{
        position: 'absolute', left: `calc(${TRACK_X} - 0.1cqmin)`, top: '2.8cqmin',
        width: '0.5cqmin',
        height: `calc((100% - 5.6cqmin) * ${evenProgress})`,
        background: accent, boxShadow: `0 0 16px ${accent}aa`,
        transition: 'height 0.6s ease',
      }} />
      {active.map((p, i) => {
        const pct = positions[i];
        const passed = nowMins >= toMins(p.time);
        const current = p.name === currentKey;
        const isNext = p.name === nextKey && !current;
        const dotSize = current ? '3.3cqmin' : '1.7cqmin';
        const dotOffset = current ? `calc(${TRACK_X} + 0.1cqmin - 1.65cqmin)` : `calc(${TRACK_X} + 0.1cqmin - 0.85cqmin)`;
        return (
          <div key={p.name} style={{
            position: 'absolute',
            left: 0, right: 0,
            top: `calc(2.8cqmin + (100% - 5.6cqmin) * ${pct})`,
            transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center',
            opacity: passed && !current ? 0.5 : 1,
            transition: 'opacity 0.6s',
          }}>
            <div style={{
              width: dotSize, height: dotSize,
              marginLeft: dotOffset,
              background: current ? accent : passed ? inkSoft : fgInk,
              borderRadius: '50%',
              boxShadow: current ? `0 0 28px ${accent}` : 'none',
              flexShrink: 0,
            }} />
            <div style={{
              flex: 1,
              marginLeft: '3cqmin',
              display: 'flex', flexDirection: 'column', gap: '0.55cqmin',
            }}>
              {/* Top line: name ........ time */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2.2cqmin' }}>
                <div style={{
                  fontSize: '7cqmin', fontWeight: 600, letterSpacing: '-0.14cqmin',
                  color: current ? accent : fgInk,
                  display: 'flex', alignItems: 'center', gap: '2cqmin',
                  lineHeight: 1,
                }}>
                  {p.displayName}
                  {current && (
                    <span style={{
                      fontSize: '2.2cqmin', fontWeight: 800, letterSpacing: '0.24cqmin',
                      textTransform: 'uppercase', color: accentInk,
                      background: accent, padding: '0.7cqmin 1.3cqmin 0.55cqmin',
                      lineHeight: 1,
                    }}>
                      {locale.labels.now}
                    </span>
                  )}
                </div>
                <div style={{
                  flex: 1, height: 0,
                  borderBottom: `0.27cqmin dotted ${current ? accent : passed ? inkSoft : `${fgInk}55`}`,
                  opacity: current ? 0.9 : 0.5,
                }} />
                <div style={{
                  fontFamily: '"Inter Tight", Inter, sans-serif',
                  fontSize: '7cqmin', fontWeight: 600, letterSpacing: '-0.14cqmin',
                  fontFeatureSettings: '"tnum" 1',
                  color: current ? accent : fgInk,
                  lineHeight: 1,
                }}>
                  {formatPrayerTime(p.time, locale)}
                </div>
              </div>
              {/* Countdown row for the next prayer */}
              {isNext && (() => {
                const urgent = iqamahPhase === 'approaching' || iqamahPhase === 'pending';
                const alert = iqamahPhase === 'now';
                const labelText = iqamahPhase === 'pending'
                  ? `${locale.labels.iqamah}`
                  : iqamahPhase === 'approaching'
                    ? 'Adhan'
                    : null;
                if (urgent) {
                  return (
                    <div style={{
                      display: 'inline-flex', flexDirection: 'column',
                      alignSelf: 'flex-start',
                      padding: '0.9cqmin 1.7cqmin',
                      background: accent,
                      animation: alert ? 'atmoPulse 1.6s ease-in-out infinite' : 'none',
                      marginTop: '0.4cqmin',
                    }}>
                      <div style={{
                        fontSize: '1.5cqmin', fontWeight: 800, letterSpacing: '0.22cqmin',
                        textTransform: 'uppercase', color: accentInk,
                        marginBottom: '0.4cqmin',
                      }}>{labelText}</div>
                      <div
                        style={{
                          fontFamily: '"Inter Tight", Inter, sans-serif',
                          fontSize: '3.3cqmin', fontWeight: 700, letterSpacing: -0.4,
                          fontFeatureSettings: '"tnum" 1',
                          color: accentInk, lineHeight: 1,
                        }}
                        suppressHydrationWarning
                      >
                        {cdH}<span style={{ color: `${accentInk}66`, margin: '0 3px' }}>:</span>{cdM}<span style={{ color: `${accentInk}66`, margin: '0 3px' }}>:</span>{cdS}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    style={{
                      fontFamily: '"Inter Tight", Inter, sans-serif',
                      fontSize: '4cqmin', fontWeight: 700, letterSpacing: -0.5,
                      fontFeatureSettings: '"tnum" 1',
                      color: accent, lineHeight: 1,
                    }}
                    suppressHydrationWarning
                  >
                    {cdH}:{cdM}:{cdS}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Landscape timeline ──────────────────────────────────────────────

interface LandscapeTimelineProps {
  prayers: PrayerTimeEntry[];
  active: PrayerTimeEntry[];
  currentKey: string | null;
  nextKey: string | null;
  nowMins: number;
  dayStart: number;
  dayEnd: number;
  accent: string;
  inkSoft: string;
  fgInk: string;
  locale: DisplayLocale;
  iqamahPhase: IqPhaseStr;
  cdH: string;
  cdM: string;
  cdS: string;
}

interface LabelLayout {
  p: PrayerTimeEntry;
  pct: number;
  passed: boolean;
  current: boolean;
  halfPctW: number;
  row: 0 | 1;
}

function LandscapeTimeline({
  prayers, active, currentKey, nextKey, nowMins, dayStart, dayEnd,
  accent, inkSoft, fgInk, locale, iqamahPhase, cdH, cdM, cdS,
}: LandscapeTimelineProps) {
  const span = dayEnd - dayStart;
  const TIMELINE_PX = 1760;

  const labels: LabelLayout[] = prayers.map((p) => {
    const pct = (toMins(p.time) - dayStart) / span;
    const passed = nowMins >= toMins(p.time);
    const current = p.name === currentKey;
    // Time digits at 42–60px Inter Tight 600 measure ~110–150px; +30px breathing
    const widthPx = current ? 180 : 140;
    const halfPctW = widthPx / 2 / TIMELINE_PX;
    return { p, pct, passed, current, halfPctW, row: 0 };
  });
  for (let i = 1; i < labels.length; i++) {
    const cur = labels[i];
    const prev = labels[i - 1];
    const gap = cur.pct - cur.halfPctW - (prev.pct + prev.halfPctW);
    if (gap < 0) {
      cur.row = prev.row === 0 ? 1 : 0;
    }
  }

  // Progress fill on baseline
  const passedList = active.filter((p) => nowMins >= toMins(p.time));
  const cur = passedList[passedList.length - 1];
  let fillPct: number;
  if (!cur) {
    if (active.length) {
      const first = active[0];
      const firstPct = (toMins(first.time) - dayStart) / span;
      const elapsed = Math.max(0, Math.min(1, (nowMins - dayStart) / (toMins(first.time) - dayStart)));
      fillPct = firstPct * elapsed;
    } else {
      fillPct = 0;
    }
  } else {
    const nxtIdx = active.findIndex((p) => p.name === cur.name) + 1;
    const nxt = active[nxtIdx];
    const curPct = (toMins(cur.time) - dayStart) / span;
    if (!nxt) {
      fillPct = curPct;
    } else {
      const nxtPct = (toMins(nxt.time) - dayStart) / span;
      const elapsed = Math.max(0, Math.min(1, (nowMins - toMins(cur.time)) / (toMins(nxt.time) - toMins(cur.time))));
      fillPct = curPct + (nxtPct - curPct) * elapsed;
    }
  }

  // Calm "Next · in" countdown only renders when no urgent state is active.
  const showCalmCountdown = iqamahPhase === 'none';

  return (
    <div style={{ position: 'relative', paddingTop: '1.1cqmin', paddingBottom: '0.7cqmin' }}>
      <div style={{ position: 'relative', height: '30cqmin', paddingLeft: '7.4cqmin', paddingRight: '7.4cqmin' }}>
        <div style={{ position: 'absolute', left: '7.4cqmin', right: '7.4cqmin', top: 0, bottom: 0 }}>
          {labels.map(({ p, pct, passed, current, row }) => {
            const isNext = p.name === nextKey && !current;
            const muted = p.name === 'sunrise';
            const showBadge = showCalmCountdown && isNext;
            return (
              <div key={p.name}>
                <div
                  style={{
                    position: 'absolute',
                    left: `${pct * 100}%`,
                    transform: 'translateX(-50%)',
                    ...(row === 0 ? { bottom: '22.1cqmin' } : { top: '10cqmin' }),
                    textAlign: 'center',
                    opacity: muted ? 0.6 : passed && !current ? 0.5 : 1,
                    transition: 'opacity 0.6s',
                    width: '26cqmin',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: current ? '2.8cqmin' : isNext ? '2.4cqmin' : '2cqmin',
                      fontWeight: 600,
                      letterSpacing: '0.18cqmin',
                      textTransform: 'uppercase',
                      color: current ? accent : fgInk,
                      lineHeight: 1.1,
                      marginBottom: '0.55cqmin',
                    }}
                  >
                    {p.displayName}
                  </div>
                  <div
                    style={{
                      fontFamily: '"Inter Tight", Inter, sans-serif',
                      fontSize: current ? '5.5cqmin' : isNext ? '4.8cqmin' : '3.9cqmin',
                      fontWeight: 600,
                      fontFeatureSettings: '"tnum" 1',
                      letterSpacing: current ? '-0.13cqmin' : '-0.1cqmin',
                      color: current ? accent : fgInk,
                      lineHeight: 1,
                    }}
                  >
                    {formatPrayerTime(p.time, locale)}
                  </div>
                  {showBadge && row === 1 && (
                    <div
                      style={{
                        marginTop: '1.3cqmin',
                        fontFamily: '"Inter Tight", Inter, sans-serif',
                        fontFeatureSettings: '"tnum" 1',
                        fontSize: '4.4cqmin', fontWeight: 600, letterSpacing: -0.6,
                        color: accent,
                      }}
                      suppressHydrationWarning
                    >
                      {cdH}<span style={{ color: `${accent}55`, margin: '0 4px' }}>:</span>{cdM}<span style={{ color: `${accent}55`, margin: '0 4px' }}>:</span>{cdS}
                    </div>
                  )}
                </div>
                {showBadge && row === 0 && (
                  <div
                    style={{
                      position: 'absolute', left: `${pct * 100}%`,
                      transform: 'translateX(-50%)',
                      top: '10.7cqmin',
                      textAlign: 'center',
                      width: '33cqmin',
                      fontFamily: '"Inter Tight", Inter, sans-serif',
                      fontFeatureSettings: '"tnum" 1',
                      fontSize: '4.4cqmin', fontWeight: 600, letterSpacing: -0.6,
                      color: accent,
                    }}
                    suppressHydrationWarning
                  >
                    {cdH}<span style={{ color: `${accent}55`, margin: '0 4px' }}>:</span>{cdM}<span style={{ color: `${accent}55`, margin: '0 4px' }}>:</span>{cdS}
                  </div>
                )}
              </div>
            );
          })}

          {/* Baseline */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '8.5cqmin', height: 1, background: inkSoft }} />
          {/* Progress fill */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              width: `${fillPct * 100}%`,
              top: '8.4cqmin',
              height: '0.3cqmin',
              background: accent,
              boxShadow: `0 0 10px ${accent}80`,
            }}
          />

          {/* Vertical ticks at each prayer */}
          {prayers.map((p) => {
            const pct = (toMins(p.time) - dayStart) / span;
            const passed = nowMins >= toMins(p.time);
            const current = p.name === currentKey;
            const muted = p.name === 'sunrise';
            return (
              <div
                key={p.name + '-tick'}
                style={{
                  position: 'absolute',
                  left: `${pct * 100}%`,
                  transform: 'translateX(-50%)',
                  top: current ? '7.4cqmin' : '7.8cqmin',
                  width: current ? '0.3cqmin' : '0.1cqmin',
                  height: current ? '2.2cqmin' : '1.5cqmin',
                  background: current ? accent : passed ? inkSoft : fgInk,
                  opacity: muted ? 0.6 : passed && !current ? 0.55 : 1,
                  transition: 'opacity 0.6s',
                  boxShadow: current ? `0 0 12px ${accent}` : 'none',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Shared keyframes ────────────────────────────────────────────────

function AtmoStyles() {
  return (
    <style>{`
      @keyframes atmoTwinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
      @keyframes atmoCelestial { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.06); opacity: 0.85; } }
      @keyframes atmoCloudDrift {
        0%   { transform: translateX(-30vw); }
        100% { transform: translateX(130vw); }
      }
      @keyframes atmoShootStar0 {
        0%, 92%   { opacity: 0; stroke-dasharray: 0 200; }
        93%       { opacity: 0.9; stroke-dasharray: 0 200; }
        97%       { opacity: 0.9; stroke-dasharray: 200 0; }
        100%      { opacity: 0; stroke-dasharray: 200 0; }
      }
      @keyframes atmoShootStar1 {
        0%, 90%   { opacity: 0; stroke-dasharray: 0 200; }
        91%       { opacity: 0.9; stroke-dasharray: 0 200; }
        96%       { opacity: 0.9; stroke-dasharray: 200 0; }
        100%      { opacity: 0; stroke-dasharray: 200 0; }
      }
      @keyframes atmoShootStar2 {
        0%, 94%   { opacity: 0; stroke-dasharray: 0 200; }
        95%       { opacity: 0.9; stroke-dasharray: 0 200; }
        98%       { opacity: 0.9; stroke-dasharray: 200 0; }
        100%      { opacity: 0; stroke-dasharray: 200 0; }
      }
      @keyframes atmoBirdsDrift {
        0% { transform: translateX(0); }
        100% { transform: translateX(450%); }
      }
      @keyframes atmoPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%      { opacity: 0.85; transform: scale(1.03); }
      }
    `}</style>
  );
}
