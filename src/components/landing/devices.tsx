import type { CSSProperties, ReactNode } from 'react';
import type { LandingCopy } from '@/lib/landing-copy';
import { Reveal } from './reveal';
import { MotionStage } from './motion-stage';

type DeviceId = LandingCopy['devices']['items'][number]['id'];

/**
 * Line drawings on a shared 96 by 64 grid, keyed by the id of the device they
 * illustrate. The ids are literal types, so if the copy adds or drops a
 * device this stops compiling instead of showing the wrong drawing; the
 * words can change in any language. Each drawing fills about the
 * same band, centred on the grid, so the row reads evenly.
 *
 * Every line has a pathLength of 1, so DRAW can trace any of them the same
 * way. The Pi's header pins are dashed already; they fade in instead.
 */
const DRAWINGS: Record<DeviceId, ReactNode> = {
  // A flat panel on the wall: the set, and the picture inside a thin bezel.
  tv: (
    <>
      <rect className="dv-line" pathLength={1} x="6" y="9" width="84" height="46" rx="3" />
      <rect className="dv-line" pathLength={1} x="9" y="12" width="78" height="40" rx="1" />
    </>
  ),
  // A streaming stick, its HDMI plug pushed into the side of a TV.
  stick: (
    <>
      <rect className="dv-line" pathLength={1} x="74" y="8" width="12" height="48" rx="3" />
      <rect className="dv-line" pathLength={1} x="12" y="21" width="46" height="22" rx="7" />
      <path className="dv-line" pathLength={1} d="M58 27h16M58 37h16" />
      <circle className="dv-line" pathLength={1} cx="21" cy="32" r="2" />
    </>
  ),
  // A single-board computer: header pins, the chip, ports along one edge.
  pi: (
    <>
      <rect className="dv-line" pathLength={1} x="10" y="10" width="68" height="44" rx="4" />
      <path className="dv-fade" d="M22 18h36" strokeDasharray="2.4 3.2" />
      <rect className="dv-line" pathLength={1} x="28" y="28" width="16" height="16" rx="2" />
      <path className="dv-line" pathLength={1} d="M78 20h8v10h-8M78 36h8v10h-8" />
      <circle className="dv-line" pathLength={1} cx="17" cy="47" r="2" />
      <circle className="dv-line" pathLength={1} cx="71" cy="47" r="2" />
    </>
  ),
  // An open laptop.
  laptop: (
    <>
      <rect className="dv-line" pathLength={1} x="20" y="10" width="56" height="38" rx="3" />
      <path className="dv-line" pathLength={1} d="M10 53h76l-4 4h-68z" />
    </>
  ),
  // A tablet standing upright on an easel: thin even bezels, the easel's
  // ledge and legs under it. Portrait, so it never reads as the laptop.
  tablet: (
    <>
      <rect className="dv-line" pathLength={1} x="33" y="5" width="30" height="40" rx="3.5" />
      <rect className="dv-line" pathLength={1} x="36" y="8" width="24" height="34" rx="1" />
      <path className="dv-line" pathLength={1} d="M29 48h38M36 48l-5 11M60 48l5 11" />
    </>
  ),
};

/**
 * As the row comes into view the devices draw themselves, one after another
 * in reading order, each name arriving as its drawing completes. Keyed on
 * MotionStage; the still is the finished row.
 */
const DRAW = `
@media (prefers-reduced-motion: no-preference) {
  [data-enter] .dv-line { stroke-dasharray: 1 1.1; }
  [data-enter='wait'] .dv-line { stroke-dashoffset: 1; }
  [data-enter='wait'] :is(.dv-fade, .dv-label) { opacity: 0; }
  [data-enter='play'] .dv-line { animation: dv-draw 1100ms cubic-bezier(0.65, 0, 0.35, 1) both; }
  [data-enter='play'] .dv-fade { animation: dv-in 500ms ease-out both; }
  [data-enter='play'] .dv-label { animation: dv-in 600ms ease-out both; }
  [data-enter='play'] li { --at: calc(var(--i) * 240ms); }
  [data-enter='play'] :is(.dv-line, .dv-fade) { animation-delay: var(--at); }
  [data-enter='play'] :is(.dv-line, .dv-fade):nth-child(n + 2) { animation-delay: calc(var(--at) + 160ms); }
  [data-enter='play'] :is(.dv-line, .dv-fade):nth-child(n + 3) { animation-delay: calc(var(--at) + 320ms); }
  [data-enter='play'] .dv-label { animation-delay: calc(var(--at) + 700ms); }
}
@keyframes dv-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes dv-in { from { opacity: 0; } }
`;

/**
 * What the screen can run on. A quiet band between the features and the
 * questions, shaped unlike either: the claim centred, then the devices drawn
 * side by side, each named under its drawing. The FAQ's own top border
 * closes the band.
 */
export function Devices({ t }: { t: LandingCopy['devices'] }) {
  return (
    <section aria-labelledby="devices-title" className="border-t border-border bg-secondary/60 px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-[40rem] text-center">
          <h2
            id="devices-title"
            className="font-heading text-[2rem] font-semibold leading-[1.08] tracking-[-0.035em] text-balance sm:text-[2.5rem]"
          >
            {t.title}
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-[16px] leading-relaxed text-balance text-muted-foreground sm:text-[17px]">
            {t.body}
          </p>
        </Reveal>

        <MotionStage className="mt-14 sm:mt-16">
          <style>{DRAW}</style>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-12">
            {t.items.map((item, i) => (
              <li
                key={item.id}
                className="flex w-[calc(50%-0.75rem)] flex-col items-center text-center sm:w-[calc(33.333%-1rem)] lg:w-auto lg:flex-1"
                style={{ '--i': i } as CSSProperties}
              >
                <svg
                  aria-hidden
                  viewBox="0 0 96 64"
                  className="h-16 w-24 text-muted-foreground sm:h-20 sm:w-30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {DRAWINGS[item.id]}
                </svg>
                <span className="dv-label mt-5 max-w-[22ch] text-[14.5px] leading-snug text-balance text-foreground sm:text-[15px]">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </MotionStage>
      </div>
    </section>
  );
}
