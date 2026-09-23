import type { LandingCopy } from '@/lib/landing-copy';
import type { SupportedLocale } from '@/types/locale';
import { Reveal } from './reveal';
import { OrientationArt } from './orientation-art';

interface OrientationShowcaseProps {
  t: LandingCopy['orientation'];
  /** The language the two displays speak: the page's own. */
  display: SupportedLocale;
}

/**
 * Landscape or portrait, shown rather than listed: the display in the hall
 * the usual way, and one turned on its side by the entrance.
 */
export function OrientationShowcase({ t, display }: OrientationShowcaseProps) {
  return (
    <section aria-labelledby="orientation-title" className="border-t border-border px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2
            id="orientation-title"
            className="font-heading text-[2rem] font-semibold leading-[1.08] tracking-[-0.035em] text-balance sm:text-[2.5rem]"
          >
            {t.title}
          </h2>
          <p className="mx-auto mt-5 max-w-[56ch] text-[17px] leading-relaxed text-pretty text-muted-foreground">{t.body}</p>
        </Reveal>

        <div
          className="mt-12 rounded-3xl px-5 py-10 sm:mt-14 sm:px-12 sm:py-14 lg:px-20 lg:py-16"
          style={{
            backgroundImage: 'linear-gradient(165deg, #F6F4F0 0%, #EDEAE4 100%)',
            boxShadow: 'inset 0 1px 2px rgba(38,24,10,0.06), inset 0 0 0 1px rgba(38,24,10,0.05)',
          }}
        >
          <OrientationArt landscape={t.landscape} portrait={t.portrait} display={display} />
        </div>
      </div>
    </section>
  );
}
