import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import type { LandingCopy } from '@/lib/landing-copy';
import { Reveal } from './reveal';
import { MotionStage } from './motion-stage';
import { OldWayScreen } from './old-way-screen';

/**
 * The beat between the hero and the steps: how the times are kept today, in a
 * real mosque, and a pointer on to the steps that change it.
 *
 * Read in order it is headline, photograph, then the words and the way on. On
 * phones that is also the visual order, so the pointer lands just above the
 * steps. From lg the photograph moves left and spans the grid's rows, and the
 * two outer `1fr` rows centre the text block beside it. Tablets stay stacked:
 * at md the text column is too narrow for the headline and the text block
 * outgrows the photograph.
 *
 * The photograph is shown whole: the calligraphy medallion at its centre is
 * never cropped. As the reader scrolls through, it gives way to the same
 * frame with a television on the wall, running the real display: a line
 * sweeps across from the timetable's side, and behind it is the screen (see
 * WIPE). The "before" label sits bottom left, the last of the photograph to
 * go.
 */
interface OldWayProps {
  t: LandingCopy['oldWay'];
  /** The words of the hero's link to #how, reused for this one. */
  toSteps: string;
}

/**
 * Before and after. Where the browser has scroll-driven animations the wipe
 * follows the scroll: it waits until the reader has had the photograph for a
 * while, starting two fifths of the way through its passage, and is done as
 * the frame starts to leave the top, and runs back when scrolling up.
 * Elsewhere it plays once, as the frame comes into view (MotionStage). The
 * still, without JavaScript (whose screen would be blank), is the photograph;
 * with reduced motion it is the two halves, split at the line.
 * Not mirrored for right-to-left pages: the photograph is not, so the line
 * still starts at the timetable, which is also where Arabic starts reading.
 */
const WIPE = `
.ow-after { clip-path: inset(0 0 0 100%); }
.ow-edge { opacity: 0; }
@media (prefers-reduced-motion: no-preference) {
  .ow-after { animation-name: ow-wipe; }
  .ow-edge { animation-name: ow-edge; }
  @supports (animation-timeline: view()) {
    /* The frame's own passage through the viewport. Named on the figure, not
       view() on the layers: the figure clips, which makes it their scroller. */
    .ow-frame { view-timeline: --ow-frame block; }
    [data-live] :is(.ow-after, .ow-edge) {
      animation-duration: auto;
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-timeline: --ow-frame;
      animation-range: contain 40% exit 15%;
    }
  }
  @supports not (animation-timeline: view()) {
    .ow-after, .ow-edge { animation-duration: 0s; }
    [data-enter='play'] :is(.ow-after, .ow-edge) {
      animation-duration: 1.8s;
      animation-delay: 1400ms;
      animation-timing-function: cubic-bezier(0.65, 0, 0.35, 1);
      animation-fill-mode: both;
    }
  }
}
/* Reduced motion, once the screen can run: before and after side by side, held still at the line. */
@media (prefers-reduced-motion: reduce) {
  [data-live] .ow-after { clip-path: inset(0 0 0 50%); }
  [data-live] .ow-edge { opacity: 1; transform: translateX(50%); }
}
@keyframes ow-wipe { from { clip-path: inset(0 0 0 100%); } to { clip-path: inset(0 0 0 0); } }
@keyframes ow-edge {
  0% { opacity: 0; transform: translateX(100%); }
  6%, 92% { opacity: 1; }
  100% { opacity: 0; transform: translateX(0); }
}
`;

export function OldWay({ t, toSteps }: OldWayProps) {

  return (
    <section id="old-way" aria-labelledby="old-way-title" className="relative px-6 py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:grid-rows-[1fr_auto_auto_1fr] lg:gap-x-14 xl:gap-x-20">
        <Reveal className="lg:col-start-2 lg:row-start-2">
          <h2
            id="old-way-title"
            className="font-heading text-[2rem] font-semibold leading-[1.08] tracking-[-0.035em] text-balance sm:text-[2.5rem] lg:text-[2.25rem] xl:text-[2.5rem]"
          >
            {t.title}
          </h2>
        </Reveal>

        <Reveal className="mt-8 lg:col-start-1 lg:row-span-4 lg:row-start-1 lg:mt-0 lg:self-center">
          <style>{WIPE}</style>
          <MotionStage>
            <figure dir="ltr" className="ow-frame relative overflow-hidden rounded-2xl bg-[#EDEAE4] ring-1 ring-[rgba(38,24,10,0.08)]">
              {/* Unsplash, Omar Ramadan (OEg4vcLrzcQ), Unsplash License. */}
              <Image
                src="/landing/old-way.jpg"
                alt={t.imageAlt}
                width={1600}
                height={1258}
                sizes="(min-width: 1280px) 640px, (min-width: 1024px) 56vw, calc(100vw - 48px)"
                className="block h-auto w-full"
              />
              <figcaption dir="auto" className="absolute left-3 bottom-3 flex h-8 items-center gap-2 rounded-full bg-white px-3.5 text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgba(38,24,10,0.12),0_6px_16px_-6px_rgba(38,24,10,0.3)] sm:left-4 sm:bottom-4">
                <span aria-hidden className="size-1.5 rounded-full bg-muted-foreground/60" />
                {t.before}
              </figcaption>

              {/* After: the same wall, out of focus and freshly limewashed, and the set on it. */}
              <div aria-hidden className="ow-after absolute inset-0 flex items-center justify-center px-[11%] pb-[2%]">
                <Image
                  src="/landing/old-way.jpg"
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 640px, (min-width: 1024px) 56vw, calc(100vw - 48px)"
                  className="scale-110 object-cover blur-[6px] will-change-transform"
                />
                <div className="absolute inset-0 bg-[linear-gradient(165deg,rgba(246,244,240,0.86)_0%,rgba(237,234,228,0.8)_100%)]" />
                <div className="relative w-full">
                  <OldWayScreen />
                </div>
              </div>
              <div aria-hidden className="ow-edge pointer-events-none absolute inset-0">
                <span className="absolute inset-y-0 left-0 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(38,24,10,0.06),0_0_18px_rgba(38,24,10,0.25)]" />
              </div>
            </figure>
          </MotionStage>
        </Reveal>

        <Reveal delay={80} className="mt-8 lg:col-start-2 lg:row-start-3 lg:mt-6">
          <p className="max-w-[46ch] text-[17px] leading-relaxed text-pretty text-muted-foreground">
            {t.body}
          </p>
          <a
            href="#how"
            className="group mt-7 inline-block rounded-sm text-[15px] leading-snug whitespace-nowrap outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-foreground"
          >
            {/* The same words as the hero's link to #how. Naming the next section's
                heading here read it twice in a row. */}
            <span className="font-semibold text-foreground underline decoration-border decoration-1 underline-offset-[6px] transition-colors group-hover:decoration-primary">
              {toSteps}
            </span>
            <ArrowDown
              aria-hidden
              className="ms-1.5 inline size-4 align-[-3px] text-primary motion-safe:transition-transform motion-safe:group-hover:translate-y-0.5"
            />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
