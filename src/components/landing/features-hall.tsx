'use client';

import dynamic from 'next/dynamic';
import { resolveDisplayLocale } from '@/lib/display-locale';
import type { SupportedLocale } from '@/types/locale';
import { TvFrame } from './tv-frame';
import { ScreenPlaceholder } from './screen-placeholder';

const DemoDisplay = dynamic(() => import('./demo-display').then((m) => m.DemoDisplay), {
  ssr: false,
  loading: () => <ScreenPlaceholder />,
});

/** The lantern sways, the window light drifts, and dust turns slowly in it. Held still under reduced motion. */
const MOTION = `
.fh-lamp { transform-box: view-box; transform-origin: 60px 0; }
@media (prefers-reduced-motion: no-preference) {
  .fh-lamp { animation: fh-sway 6s ease-in-out infinite alternate; }
  .fh-beam { animation: fh-drift 14s ease-in-out infinite alternate; }
  .fh-glow { animation: fh-glow 3.2s ease-in-out infinite alternate; }
  .fh-mote { animation: fh-mote linear infinite; }
}
@keyframes fh-sway { from { transform: rotate(-2deg); } to { transform: rotate(2deg); } }
@keyframes fh-drift { from { transform: translateX(-8px); opacity: 0.55; } to { transform: translateX(10px); opacity: 0.85; } }
@keyframes fh-glow { from { opacity: 0.6; } to { opacity: 0.95; } }
@keyframes fh-mote { from { transform: translate(0, 0); opacity: 0; } 20%, 80% { opacity: 0.8; } to { transform: translate(14px, -46px); opacity: 0; } }
`;

/** Dust in the light: where each mote starts, in the drawing's units, and its pace. */
const MOTES = [
  [52, 150, 9],
  [70, 180, 12],
  [88, 140, 10],
  [132, 120, 11],
  [150, 165, 13],
  [44, 200, 14],
  [110, 205, 9.5],
  [165, 95, 12.5],
] as const;

/** A pointed arch standing on the floor line at `base`, `w` wide and rising to `top`. */
function arch(x: number, w: number, top: number, base: number): string {
  const r = x + w;
  const shoulder = top + w * 0.72;
  return `M${x} ${base} V${shoulder} Q${x} ${top + w * 0.2} ${x + w / 2} ${top} Q${r} ${top + w * 0.2} ${r} ${shoulder} V${base} Z`;
}

/**
 * A prayer hall's wall, drawn: latticed windows letting the light in, a
 * pointed mihrab with its patterned frame and carved hood, a brass lantern
 * above it, a band of geometric tiles, and the carpet's rows. On the plain
 * wall beside the mihrab hangs a set on its side, running the real display in
 * the page's language.
 *
 * The drawing is a 2:3 box that covers its tile, like a photograph would, and
 * the set is placed in the same box so the two stay together at any size.
 */
export function FeaturesHall({ label, display }: { label: string; display: SupportedLocale }) {
  return (
    <div role="img" aria-label={label} dir="ltr" className="absolute inset-0 overflow-hidden" style={{ containerType: 'size' }}>
      <style>{MOTION}</style>
      <div
        className="absolute top-1/2 left-1/2 aspect-2/3 -translate-1/2"
        style={{ width: 'max(100cqw, 66.667cqh)', containerType: 'inline-size' }}
      >
        <svg viewBox="0 0 200 300" className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <linearGradient id="fh-wall" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#F7F4EE" />
              <stop offset="1" stopColor="#EAE3D6" />
            </linearGradient>
            <linearGradient id="fh-niche" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#CFC3AC" />
              <stop offset="0.5" stopColor="#DCD2BF" />
              <stop offset="1" stopColor="#D4C8B2" />
            </linearGradient>
            <linearGradient id="fh-brass" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#8E6A26" />
              <stop offset="0.45" stopColor="#E0B85C" />
              <stop offset="1" stopColor="#8E6A26" />
            </linearGradient>
            <linearGradient id="fh-beam" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="1" stopColor="#FFF6E2" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="fh-lampglow">
              <stop offset="0" stopColor="#FFD983" stopOpacity="0.8" />
              <stop offset="1" stopColor="#FFD983" stopOpacity="0" />
            </radialGradient>
            {/* Eight-pointed stars, the tiles' and the frame's pattern. */}
            <pattern id="fh-stars" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="#DCE3D6" />
              <rect x="2.2" y="2.2" width="5.6" height="5.6" fill="#7F9A86" />
              <rect x="2.2" y="2.2" width="5.6" height="5.6" fill="#7F9A86" transform="rotate(45 5 5)" />
              <circle cx="5" cy="5" r="1.4" fill="#E8C25F" />
              <path d="M0 0 L1.6 0 L0 1.6 Z M10 0 L8.4 0 L10 1.6 Z M0 10 L1.6 10 L0 8.4 Z M10 10 L8.4 10 L10 8.4 Z" fill="#B99A55" />
            </pattern>
            <pattern id="fh-frame" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#E9E1D1" />
              <rect x="1.6" y="1.6" width="2.8" height="2.8" fill="none" stroke="#BFA873" strokeWidth="0.5" transform="rotate(45 3 3)" />
              <circle cx="3" cy="3" r="0.6" fill="#BFA873" />
            </pattern>
            {/* The lattice of the windows. */}
            <pattern id="fh-lattice" width="5" height="5" patternUnits="userSpaceOnUse">
              <rect width="5" height="5" fill="#FDFBF6" />
              <path d="M0 2.5 H5 M2.5 0 V5 M0 0 L5 5 M5 0 L0 5" stroke="#CDBF9F" strokeWidth="0.55" />
            </pattern>
            {/* The carpet's rows: a small arch for each worshipper. */}
            <pattern id="fh-carpet" width="18" height="16" patternUnits="userSpaceOnUse">
              <rect width="18" height="16" fill="#8FA58F" />
              <path d="M2 16 V8 Q2 3 9 1.5 Q16 3 16 8 V16" fill="#9DB39C" stroke="#D9BE6E" strokeWidth="0.7" />
              <path d="M5 16 V9 Q5 5.5 9 4.4 Q13 5.5 13 9 V16" fill="none" stroke="#7C917C" strokeWidth="0.5" />
              <rect y="15.2" width="18" height="0.8" fill="#6F8570" />
            </pattern>
          </defs>

          {/* The wall. */}
          <rect width="200" height="300" fill="url(#fh-wall)" />

          {/* Two tall latticed windows, and the light they let in. */}
          {(
            [
              [44, 22],
              [132, 22],
            ] as const
          ).map(([x, y]) => (
            <g key={x}>
              <path d={arch(x - 2, 36, y - 3, y + 62)} fill="#E4DACA" />
              <path d={arch(x, 32, y, y + 60)} fill="url(#fh-lattice)" />
              <path d={arch(x, 32, y, y + 60)} fill="none" stroke="#C9B894" strokeWidth="0.8" />
            </g>
          ))}
          <g className="fh-beam">
            <path d="M46 82 L78 82 L112 250 L56 250 Z" fill="url(#fh-beam)" opacity="0.5" />
            <path d="M134 82 L166 82 L196 230 L146 230 Z" fill="url(#fh-beam)" opacity="0.35" />
          </g>

          {/* The tile band along the foot of the wall. */}
          <rect x="0" y="226" width="200" height="24" fill="url(#fh-stars)" />
          <rect x="0" y="225" width="200" height="1.4" fill="#B99A55" />
          <rect x="0" y="249" width="200" height="1.4" fill="#B99A55" />

          {/* The mihrab: its patterned frame, the niche, the carved hood, a step. */}
          <path d={arch(18, 84, 96, 250)} fill="#DCCFB8" />
          <path d={arch(21, 78, 101, 250)} fill="url(#fh-frame)" />
          <path d={arch(29, 62, 113, 250)} fill="url(#fh-niche)" />
          {/* Muqarnas: tiers of small arches carved into the hood. */}
          {[0, 1, 2].map((tier) =>
            Array.from({ length: 5 - tier }, (_, i) => {
              const w = 9;
              const x = 60 - ((5 - tier) * w) / 2 + i * w;
              const y = 150 - tier * 10;
              return <path key={`${tier}-${i}`} d={`M${x} ${y} Q${x} ${y - 7} ${x + w / 2} ${y - 9} Q${x + w} ${y - 7} ${x + w} ${y}`} fill="#E6DCCB" stroke="#BCAE93" strokeWidth="0.5" />;
            })
          )}
          <path d={arch(29, 62, 113, 250)} fill="none" stroke="#B9A57C" strokeWidth="0.8" />
          <rect x="24" y="244" width="72" height="6" rx="1" fill="#CDBFA5" />

          {/* The Quran on its stand, before the mihrab. */}
          <g transform="translate(60 238)">
            <path d="M-8 6 L0 -1 L8 6" fill="none" stroke="#7A5530" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M-8 -6 L0 0 L8 -6" fill="none" stroke="#7A5530" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M-8 -6 L0 -2 L8 -6 L8 -8 L0 -4 L-8 -8 Z" fill="#2F5A48" />
          </g>

          {/* The carpet, in rows towards the qibla. */}
          <rect x="0" y="250" width="200" height="50" fill="url(#fh-carpet)" />
          <rect x="0" y="250" width="200" height="1.2" fill="#D9BE6E" />

          {/* A plant in a brass pot, in the corner. */}
          <g transform="translate(186 250)">
            <path d="M-7 0 L-5.5 -12 H5.5 L7 0 Z" fill="url(#fh-brass)" />
            {[-40, -20, 0, 18, 36].map((a, i) => (
              <ellipse key={a} cx="0" cy="-22" rx="3" ry="11" fill={i % 2 ? '#6E8F68' : '#7FA077'} transform={`rotate(${a} 0 -12)`} />
            ))}
          </g>

          {/* The lantern on its chain, swaying above the mihrab. */}
          <g className="fh-lamp">
            <line x1="60" y1="0" x2="60" y2="86" stroke="#8E7A55" strokeWidth="0.7" strokeDasharray="1.6 0.8" />
            <circle className="fh-glow" cx="60" cy="100" r="26" fill="url(#fh-lampglow)" />
            <path d="M55 86 H65 L63 89 H57 Z" fill="url(#fh-brass)" />
            <path d="M54 89 Q49 100 56 110 H64 Q71 100 66 89 Z" fill="url(#fh-brass)" />
            {/* Pierced brass: the light shows through. */}
            {(
              [
              [57, 95],
              [60, 93],
              [63, 95],
              [56.5, 100],
              [60, 99],
              [63.5, 100],
              [58, 105],
              [62, 105],
              ] as const
            ).map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.9" fill="#FFE7A8" />
            ))}
            <path d="M56 110 H64 L60 116 Z" fill="#8E6A26" />
          </g>

          {/* Dust turning in the light. */}
          {MOTES.map(([x, y, s], i) => (
            <circle key={i} className="fh-mote" cx={x} cy={y} r="0.7" fill="#FFFFFF" style={{ animationDuration: `${s}s`, animationDelay: `${-i * 1.7}s` }} />
          ))}
        </svg>

        {/* The set on the plain wall beside the mihrab, on its side, running the display. */}
        <div className="absolute" style={{ left: '54%', top: '31%', width: '28%' }}>
          <TvFrame portrait>
            <DemoDisplay locale={resolveDisplayLocale(display)} portrait />
          </TvFrame>
        </div>
      </div>
    </div>
  );
}
