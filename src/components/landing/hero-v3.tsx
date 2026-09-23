import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LandingCopy } from '@/lib/landing-copy';
import type { SupportedLocale } from '@/types/locale';
import { cn } from '@/lib/utils';
import { ShowcaseWrapper } from './showcase-wrapper';
import { HeroStage } from './hero-v3-stage';

/** Entrance stagger for the hero, in ms. Read by .hero-in in globals.css. */
const enterAt = (ms: number) => ({ '--in-delay': `${ms}ms` }) as CSSProperties;

interface HeroProps {
  t: LandingCopy['hero'];
  /** The language the demo TV speaks. */
  display: SupportedLocale;
}

/**
 * The first screen: white, bright, and the product in full view. The plain
 * headline beside the TV (above it on phones), the TV lit from behind by its
 * own warm glow. The scroll choreography lives with HeroStage.
 */
export function Hero({ t, display }: HeroProps) {
  // Some languages need longer headline lines; they step the type down a size so the lines still fit their column.
  // On phones the size also follows the width, so the longest line fits a 360px screen whole.
  const long = Math.max(t.titleLine1.length, t.titleLine2.length) > 20;

  return (
    <HeroStage
      labelledBy="hero-title"
      className="relative isolate overflow-x-clip bg-white px-6"
      stageClassName="relative mx-auto grid min-h-[min(100svh,64rem)] max-w-6xl grid-cols-1 content-center items-center gap-10 pt-24 pb-14 sm:gap-12 sm:pt-28 lg:grid-cols-12 lg:gap-10 lg:pt-20 lg:pb-16 xl:gap-14"
    >
      <div className="hero3-copy relative z-10 text-center lg:col-span-5 lg:text-start">
        <h1
          id="hero-title"
          className={cn(
            'hero-in font-heading font-semibold tracking-[-0.04em] text-balance text-[#111111]',
            long
              ? 'text-[length:min(2.2rem,calc((100vw_-_3rem)/9.6))] sm:text-[3rem] lg:text-[2.3rem] xl:text-[2.6rem]'
              : 'text-[length:min(2.5rem,calc((100vw_-_3rem)/8.4))] sm:text-[3.25rem] lg:text-[2.9rem] xl:text-[3.4rem]',
            // Last, so tailwind-merge keeps it: it reads a later font size as overriding the line height.
            'leading-[1.03]'
          )}
        >
          <span className="block">{t.titleLine1}</span>{' '}
          <span className="block">{t.titleLine2}</span>
        </h1>
        <p
          className="hero-in mx-auto mt-5 max-w-[44ch] text-[16px] leading-relaxed text-pretty text-[#52524E] sm:mt-6 sm:text-lg lg:mx-0"
          style={enterAt(90)}
        >
          {t.subtitle}
        </p>
        <div className="hero-in mt-7 flex flex-col justify-center gap-3 sm:mt-9 sm:flex-row sm:flex-wrap lg:justify-start" style={enterAt(180)}>
          <Button asChild size="lg" className="h-12 px-7 text-[15px] has-[>svg]:px-7 lg:px-5 lg:has-[>svg]:px-5 xl:px-7 xl:has-[>svg]:px-7">
            <Link href="/s">
              {t.cta} <ArrowRight className="ms-1 size-4 rtl:rotate-180" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 border-[#E2E1DC] bg-white px-7 text-[15px] hover:bg-[#F6F6F3] lg:px-5 xl:px-7">
            <Link href="#how">{t.secondary}</Link>
          </Button>
        </div>
      </div>

      <div className="hero3-arrive relative z-20 mx-auto w-full max-w-2xl lg:col-span-7 lg:max-w-none">
        <div data-hero-tv className="hero3-tv relative">
          {/* The screen's own light: warm gold at its edges, fading into the white page. */}
          <div aria-hidden className="hero3-bloom pointer-events-none absolute -inset-x-[25%] -inset-y-[45%] -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(240,176,40,0.34)_0%,rgba(240,176,40,0.34)_55%,rgba(240,176,40,0.13)_75%,transparent_100%)]" />
          </div>
          <div dir="ltr">
            <ShowcaseWrapper alt={t.demoAlt} display={display} />
          </div>
          {/* Where the set's shadow falls on the wall below it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 left-[12%] -z-10 h-12 w-[76%] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(38,24,10,0.2),transparent_100%)]"
          />
        </div>
      </div>
    </HeroStage>
  );
}
