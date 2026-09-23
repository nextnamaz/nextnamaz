import type { LandingCopy } from '@/lib/landing-copy';
import type { SupportedLocale } from '@/types/locale';
import { resolveDisplayLocale } from '@/lib/display-locale';
import { Reveal } from './reveal';
import { DayLoop } from './day-loop';

interface DaySectionProps {
  t: LandingCopy['day'];
  /** The language the display on the set speaks: the page's own. */
  display: SupportedLocale;
}

/** A whole day on the screen, played through: the product keeping time by itself. */
export function DaySection({ t, display }: DaySectionProps) {
  return (
    <section aria-labelledby="day-title" className="px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2
            id="day-title"
            className="font-heading text-[2rem] font-semibold leading-[1.08] tracking-[-0.035em] text-balance sm:text-[2.5rem]"
          >
            {t.title}
          </h2>
          <p className="mx-auto mt-5 max-w-[56ch] text-[17px] leading-relaxed text-pretty text-muted-foreground">{t.body}</p>
        </Reveal>
        <div className="mt-12 sm:mt-14">
          <DayLoop locale={resolveDisplayLocale(display)} t={{ play: t.play, pause: t.pause, scrub: t.scrub }} />
        </div>
      </div>
    </section>
  );
}
