import { ArrowDown } from 'lucide-react';
import type { LandingCopy } from '@/lib/landing-copy';
import { Reveal } from './reveal';
import { OldWayFilm } from './old-way-film';
import type { SupportedLocale } from '@/types/locale';

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
 * never cropped. On a loop, it gives way to the same
 * frame with a television on the wall, running the real display: a line
 * sweeps across from the timetable's side, and behind it is the screen (see
 * WIPE). The "before" label sits bottom left, the last of the photograph to
 * go.
 */
interface OldWayProps {
  t: LandingCopy['oldWay'];
  /** The words of the hero's link to #how, reused for this one. */
  toSteps: string;
  /** The language the film's screen and calendar speak: the page's own. */
  display: SupportedLocale;
}

export function OldWay({ t, toSteps, display }: OldWayProps) {

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
          <OldWayFilm label={t.imageAlt} before={t.before} after={t.after} display={display} />
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
