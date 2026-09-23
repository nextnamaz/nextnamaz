import type { LandingCopy } from '@/lib/landing-copy';
import type { SupportedLocale } from '@/types/locale';
import { PlaygroundStage } from './playground-stage';
import { Reveal } from './reveal';

interface ScreenAnatomyProps {
  t: LandingCopy['display'];
  /** The language the screen starts in: the page's own. */
  display: SupportedLocale;
}

/** "Try the display yourself": the real display on a set, and the settings that drive it. */
export function ScreenAnatomy({ t, display }: ScreenAnatomyProps) {
  return (
    <section id="display" aria-labelledby="display-title" className="border-t border-border px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 id="display-title" className="font-heading text-[2rem] font-semibold leading-[1.08] tracking-[-0.035em] text-balance sm:text-[2.5rem]">
            {t.title}
          </h2>
          <p className="mx-auto mt-5 max-w-[62ch] text-[17px] leading-relaxed text-pretty text-muted-foreground">{t.subtitle}</p>
        </Reveal>

        <Reveal delay={80} className="mt-12 sm:mt-14">
          <PlaygroundStage t={t} display={display} />
        </Reveal>

        <p className="mx-auto mt-6 max-w-[60ch] text-center text-sm leading-relaxed text-pretty text-muted-foreground">
          {t.note}
        </p>
      </div>
    </section>
  );
}
