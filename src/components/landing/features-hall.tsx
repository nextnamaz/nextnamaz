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

/** The lamp sways and the window light drifts over the wall. Held still under reduced motion. */
const MOTION = `
@media (prefers-reduced-motion: no-preference) {
  .fh-lamp { animation: fh-sway 5.5s ease-in-out infinite alternate; }
  .fh-light { animation: fh-drift 16s ease-in-out infinite alternate; }
  .fh-glow { animation: fh-glow 5.5s ease-in-out infinite alternate; }
}
@keyframes fh-sway { from { transform: rotate(-2.5deg); } to { transform: rotate(2.5deg); } }
@keyframes fh-drift { from { transform: translateX(-12cqw) skewX(-14deg); } to { transform: translateX(22cqw) skewX(-14deg); } }
@keyframes fh-glow { from { opacity: 0.55; } to { opacity: 0.9; } }
`;

/**
 * A prayer hall's wall, drawn: the mihrab, a brass lamp above it, and beside
 * it a set hung on its side running the real display in the page's language.
 * Fills whatever tile holds it.
 */
export function FeaturesHall({ label, display }: { label: string; display: SupportedLocale }) {
  return (
    <div
      role="img"
      aria-label={label}
      dir="ltr"
      className="absolute inset-0 overflow-hidden"
      style={{ containerType: 'inline-size', background: 'radial-gradient(ellipse 80% 55% at 45% 25%, #FBFAF7, #ECE7DE 80%)' }}
    >
      <style>{MOTION}</style>

      {/* Window light, drifting slowly across the plaster. */}
      <div className="fh-light pointer-events-none absolute top-0 left-[10%] h-[75%] w-[30cqw] bg-linear-to-b from-white/70 to-transparent blur-[3cqw]" />

      {/* The mihrab: an arch in the wall, a deeper arch within. */}
      <div className="absolute bottom-[16%] left-[7%] h-[48%] w-[38cqw] rounded-t-full bg-[#E4DDD0] shadow-[inset_0_1.5cqw_3cqw_-1cqw_rgba(38,24,10,0.12)]">
        <div className="absolute inset-x-[12%] top-[9%] bottom-0 rounded-t-full bg-[#D9D0BF] shadow-[inset_0_2cqw_4cqw_-1cqw_rgba(38,24,10,0.18)]" />
      </div>

      {/* A brass lamp hanging above it, swaying a little. */}
      <div className="fh-lamp absolute top-0 left-[26cqw] origin-top" aria-hidden>
        <div className="mx-auto h-[26cqw] w-[0.4cqw] bg-[#9C8A6A]" />
        <div className="relative -ml-[4cqw] w-[8.4cqw]">
          <div className="h-[2cqw] rounded-t-full bg-[#B8913F]" />
          <div className="h-[6cqw] rounded-b-[3cqw] bg-linear-to-b from-[#D7AE52] to-[#9E7426]" />
          <div className="fh-glow absolute top-[3cqw] left-1/2 size-[16cqw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,214,120,0.55),transparent_65%)]" />
        </div>
      </div>

      {/* The set on the wall beside the mihrab, on its side, running the display. */}
      <div className="absolute top-[20%] left-[53%] w-[36%]">
        <TvFrame portrait>
          <DemoDisplay locale={resolveDisplayLocale(display)} portrait />
        </TvFrame>
      </div>

      {/* The floor, and the prayer carpet's rows. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[16%] border-t border-[#D2C9B7]"
        style={{
          background:
            'repeating-linear-gradient(90deg, #C9D1BF 0 9cqw, #BFC8B3 9cqw 9.6cqw), linear-gradient(#C9D1BF, #BCC5AF)',
          backgroundBlendMode: 'multiply',
        }}
      />
    </div>
  );
}
