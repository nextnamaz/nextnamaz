import { LANDING_COPY } from '@/lib/landing-copy';
import { Reveal } from './reveal';
import { HowItWorksStepper } from './how-it-works-stepper';

/**
 * How it works: the three steps, each drawn as the action it asks for,
 * pinned under the navbar while scrolling moves them on.
 */
export function HowItWorksSection() {
  const t = LANDING_COPY.howItWorks;

  return (
    <section id="how" aria-labelledby="how-title" className="border-t border-border px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <h2 id="how-title" className="font-heading text-[2rem] font-semibold leading-[1.08] tracking-[-0.035em] text-balance sm:text-[2.5rem]">
            {t.title}
          </h2>
          <p className="mt-4 max-w-[62ch] text-[17px] leading-relaxed text-muted-foreground">{t.subtitle}</p>
        </Reveal>

        <HowItWorksStepper />
      </div>
    </section>
  );
}
