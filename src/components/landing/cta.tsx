import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LandingCopy } from '@/lib/landing-copy';
import { Reveal } from './reveal';

/**
 * The closing invitation, over brick arches that recede to one lit arch at
 * the far end. The crop keeps that light below the button, so the words sit
 * on the dark vaults and the way on glows beneath them. A warm ink wash and a
 * soft shadow on the type keep it above AA; the edges fall off into shadow.
 */

/**
 * As the section scrolls up the photograph slowly pushes in, a step further
 * down the hall (scroll-driven, where the browser has it; the section is its
 * timeline, since it clips). The words rise in once, one after another, the
 * headline furthest. Reduced motion holds both still.
 */
const MOTION = `
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .cta-stage { view-timeline: --cta block; }
    .cta-push {
      animation: cta-push linear both;
      animation-timeline: --cta;
      animation-range: entry 0% cover 75%;
    }
  }
  .cta-words[data-reveal] { opacity: 1; translate: none; }
  .cta-words[data-reveal='pending'] > * { opacity: 0; translate: 0 28px; }
  .cta-words[data-reveal='pending'] > h2 { translate: 0 44px; }
  .cta-words[data-reveal='in'] > * {
    transition: opacity 900ms cubic-bezier(0.16, 1, 0.3, 1), translate 1100ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .cta-words[data-reveal='in'] > :nth-child(2) { transition-delay: 120ms; }
  .cta-words[data-reveal='in'] > :nth-child(3) { transition-delay: 220ms; }
  .cta-words[data-reveal='in'] > :nth-child(4) { transition-delay: 300ms; }
}
@keyframes cta-push { from { transform: scale(1); } to { transform: scale(1.1); } }
`;

export function Cta({ t }: { t: LandingCopy['cta'] }) {

  return (
    <section
      id="start"
      aria-labelledby="cta-title"
      className="cta-stage relative isolate flex items-center overflow-hidden bg-[#1A1205] px-6 pt-28 pb-36 sm:pt-32 sm:pb-44 lg:min-h-[min(78vh,720px)] lg:pb-48"
    >
      <style>{MOTION}</style>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* Brick arches of a hypostyle prayer hall. Unsplash, Hasan Almasi (PmOq35_3KMQ), Unsplash License. */}
        <div className="cta-push absolute inset-0 origin-[50%_42%]">
          <Image
            src="/landing/cta-arches.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[50%_30%] lg:object-[50%_12%]"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(26,18,5,0.6),rgba(26,18,5,0.5)_55%,rgba(26,18,5,0.3))]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_42%_34%_at_50%_38%,rgba(26,18,5,0.32),transparent_100%),radial-gradient(ellipse_80%_90%_at_50%_50%,transparent_40%,rgba(26,18,5,0.6)_100%)]" />
      </div>

      <Reveal className="cta-words mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <h2
          id="cta-title"
          className="font-heading text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.035em] text-balance text-white [text-shadow:0_1px_24px_rgba(26,18,5,0.55)] sm:text-[3rem]"
        >
          {t.title}
        </h2>
        <p className="mt-5 max-w-[44ch] text-[17px] leading-relaxed text-pretty text-white/95 [text-shadow:0_1px_18px_rgba(26,18,5,0.6)] sm:text-lg">
          {t.subtitle}
        </p>
        <Button
          asChild
          size="lg"
          className="mt-10 h-12 px-7 text-[15px] has-[>svg]:px-7 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-[3px] focus-visible:outline-white"
        >
          <Link href="/s">
            {t.button} <ArrowRight className="ms-1 size-4 rtl:rotate-180" />
          </Link>
        </Button>
        <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14px] font-medium text-white/90 [text-shadow:0_1px_12px_rgba(26,18,5,0.7)]">
          {t.points.map((point) => (
            <li key={point} className="flex items-center gap-1.5">
              <Check aria-hidden className="size-4 text-primary" strokeWidth={2.75} />
              {point}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
