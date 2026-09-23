import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LANDING_COPY } from '@/lib/landing-copy';
import { ShowcaseWrapper } from './showcase-wrapper';
import { Wall } from './wall';

/** Entrance stagger for the hero, in ms. Read by .hero-in in globals.css. */
const enterAt = (ms: number) => ({ '--in-delay': `${ms}ms` }) as CSSProperties;

/**
 * The first screen: a wall, and on it the television, mounted flat and
 * running the real display. The pitch sits on the same wall to its left,
 * so the page opens on the product where it will actually hang.
 */
export function Hero() {
  const t = LANDING_COPY.hero;

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden px-6">
      <Wall />

      {/* The same container as the navbar and every section, so the page keeps one left edge. */}
      <div className="relative mx-auto flex min-h-[max(40rem,100dvh)] max-w-6xl items-center pt-28 pb-16 lg:pt-24 lg:pb-20">
        <div className="grid w-full grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-10 xl:gap-14">
          <div className="lg:col-span-6 xl:col-span-5">
            <h1 id="hero-title" className="hero-in font-heading text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.035em] text-balance sm:text-[3.25rem] lg:text-[3.2rem] xl:text-[3.25rem]">
              {t.titleLine1} <span className="sm:block">{t.titleLine2}</span>
            </h1>

            <p
              className="hero-in mt-6 max-w-[42ch] text-[17px] leading-relaxed text-pretty text-[#4A4538] sm:text-lg"
              style={enterAt(90)}
            >
              {t.subtitle}
            </p>

            <div className="hero-in mt-9 flex flex-col flex-wrap gap-3 sm:flex-row" style={enterAt(180)}>
              <Button asChild size="lg" className="h-12 px-7 text-[15px] has-[>svg]:px-7">
                <Link href="/s">
                  {t.cta} <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 border-[#D3C9B7] bg-[#FBF8F2] px-7 text-[15px] hover:bg-white"
              >
                <Link href="#how">{t.secondary}</Link>
              </Button>
            </div>

          </div>

          <div className="hero-in lg:col-span-6 xl:col-span-7" style={enterAt(260)}>
            <ShowcaseWrapper />
          </div>
        </div>
      </div>
    </section>
  );
}
