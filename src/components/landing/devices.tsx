import type { ReactNode } from 'react';
import { LANDING_COPY } from '@/lib/landing-copy';
import { Reveal } from './reveal';

const t = LANDING_COPY.devices;

type Device = (typeof t.items)[number];

/**
 * Line drawings on a shared 96 by 64 grid, keyed by the copy line they
 * illustrate. The lines are literal types, so if the copy adds, drops or
 * renames a device this stops compiling instead of showing the wrong
 * drawing; reordering the copy changes nothing. Each drawing fills about the
 * same band, centred on the grid, so the row reads evenly.
 */
const DRAWINGS: Record<Device, ReactNode> = {
  // A flat panel on the wall: the set, and the picture inside a thin bezel.
  'A smart TV with a web browser': (
    <>
      <rect x="6" y="9" width="84" height="46" rx="3" />
      <rect x="9" y="12" width="78" height="40" rx="1" />
    </>
  ),
  // A streaming stick, its HDMI plug pushed into the side of a TV.
  'A Fire TV Stick or another streaming stick with a browser': (
    <>
      <rect x="74" y="8" width="12" height="48" rx="3" />
      <rect x="12" y="21" width="46" height="22" rx="7" />
      <path d="M58 27h16M58 37h16" />
      <circle cx="21" cy="32" r="2" />
    </>
  ),
  // A single-board computer: header pins, the chip, ports along one edge.
  "A Raspberry Pi or mini PC on the TV's HDMI port": (
    <>
      <rect x="10" y="10" width="68" height="44" rx="4" />
      <path d="M22 18h36" strokeDasharray="2.4 3.2" />
      <rect x="28" y="28" width="16" height="16" rx="2" />
      <path d="M78 20h8v10h-8M78 36h8v10h-8" />
      <circle cx="17" cy="47" r="2" />
      <circle cx="71" cy="47" r="2" />
    </>
  ),
  // An open laptop.
  'An old laptop plugged into the TV': (
    <>
      <rect x="20" y="10" width="56" height="38" rx="3" />
      <path d="M10 53h76l-4 4h-68z" />
    </>
  ),
  // A tablet standing upright on an easel: thin even bezels, the easel's
  // ledge and legs under it. Portrait, so it never reads as the laptop.
  'A tablet on a stand, in portrait or landscape': (
    <>
      <rect x="33" y="5" width="30" height="40" rx="3.5" />
      <rect x="36" y="8" width="24" height="34" rx="1" />
      <path d="M29 48h38M36 48l-5 11M60 48l5 11" />
    </>
  ),
};

/**
 * What the screen can run on. A quiet band between the features and the
 * questions, shaped unlike either: the claim centred, then the devices drawn
 * side by side, each named under its drawing. The FAQ's own top border
 * closes the band.
 */
export function Devices() {
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

        <Reveal className="mt-14 sm:mt-16" delay={80}>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-12">
            {t.items.map((item) => (
              <li
                key={item}
                className="flex w-[calc(50%-0.75rem)] flex-col items-center text-center sm:w-[calc(33.333%-1rem)] lg:w-auto lg:flex-1"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 96 64"
                  className="h-16 w-24 text-[#8F8674] sm:h-20 sm:w-30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {DRAWINGS[item]}
                </svg>
                <span className="mt-5 max-w-[22ch] text-[14.5px] leading-snug text-balance text-foreground sm:text-[15px]">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
