import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import { LANDING_COPY } from '@/lib/landing-copy';
import { Reveal } from './reveal';

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
 * never cropped or covered. The "before" label sits bottom right, under the
 * printed timetable it names.
 */
export function OldWay() {
  const t = LANDING_COPY.oldWay;

  return (
    <section id="old-way" aria-labelledby="old-way-title" className="px-6 py-20 sm:py-24">
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
          <figure className="relative overflow-hidden rounded-2xl bg-[#EEE7DB] ring-1 ring-[rgba(38,24,10,0.08)]">
            {/* Unsplash, Omar Ramadan (OEg4vcLrzcQ), Unsplash License. */}
            <Image
              src="/landing/old-way.jpg"
              alt={t.imageAlt}
              width={1600}
              height={1258}
              sizes="(min-width: 1280px) 640px, (min-width: 1024px) 56vw, calc(100vw - 48px)"
              className="block h-auto w-full"
            />
            <figcaption className="absolute right-3 bottom-3 flex h-8 items-center gap-2 rounded-full bg-white px-3.5 text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgba(38,24,10,0.12),0_6px_16px_-6px_rgba(38,24,10,0.3)] sm:right-4 sm:bottom-4">
              <span aria-hidden className="size-1.5 rounded-full bg-muted-foreground/60" />
              {t.before}
            </figcaption>
          </figure>
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
              {LANDING_COPY.hero.secondary}
            </span>
            <ArrowDown
              aria-hidden
              className="ml-1.5 inline size-4 align-[-3px] text-primary motion-safe:transition-transform motion-safe:group-hover:translate-y-0.5"
            />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
