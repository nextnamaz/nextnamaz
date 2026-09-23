import { LANDING_COPY } from '@/lib/landing-copy';
import { Reveal } from './reveal';
import { AnatomyStage } from './screen-anatomy-stage';

/**
 * What the room sees: the demo display hung on the hero's wall, its five
 * parts numbered, and a language switch that re-renders it. A server
 * component; only the stage (switch, set and legend) runs on the client.
 */
export function ScreenAnatomy() {
  const t = LANDING_COPY.display;

  return (
    <section id="display" aria-labelledby="display-title" className="border-t border-border px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 id="display-title" className="font-heading text-[2rem] font-semibold leading-[1.08] tracking-[-0.035em] text-balance sm:text-[2.5rem]">
            {t.title}
          </h2>
          <p className="mx-auto mt-5 max-w-[62ch] text-[17px] leading-relaxed text-pretty text-muted-foreground">
            {t.subtitle}
          </p>
        </Reveal>

        <AnatomyStage callouts={t.callouts} languagesLabel={t.languagesLabel} languagesNote={t.languagesNote} />

        <p className="mx-auto mt-8 max-w-[62ch] text-center text-sm leading-relaxed text-pretty text-muted-foreground md:mt-10">
          {t.themesNote}
        </p>
      </div>
    </section>
  );
}
