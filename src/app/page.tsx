import Link from 'next/link';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShowcaseWrapper } from '@/components/landing/showcase-wrapper';
import { HowItWorksWrapper } from '@/components/landing/how-it-works-wrapper';
import { HeroMotif } from '@/components/landing/hero-motif';
import { Reveal } from '@/components/landing/reveal';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { LANDING_COPY } from '@/lib/landing-copy';
import { SITE_URL } from '@/lib/site';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prayer Times Display for Mosques',
  alternates: { canonical: '/' },
};

/** Schema.org entry so search results can show what this actually is. */
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextNamaz',
  url: SITE_URL,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any web browser',
  description:
    'Turn any TV, tablet or old laptop into a prayer times display for your mosque. Set it up by scanning a QR code with your phone.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  inLanguage: ['en', 'sv', 'bs', 'ar', 'tr'],
};

/** Entrance stagger for the hero, in ms. Read by .hero-in in globals.css. */
const enterAt = (ms: number) => ({ '--in-delay': `${ms}ms` }) as CSSProperties;

export default function HomePage() {
  const t = LANDING_COPY;

  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Navbar getStartedLabel={t.nav.getStarted} />

      {/* Hero: fills the first screen below the 64px nav. The pitch on the
          left, the product on the right, one faint star behind both. */}
      <main className="relative overflow-hidden px-6">
        <HeroMotif />
        <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl items-center pt-24 pb-14 sm:pb-16">
          <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              {/* Two lines, no more. Sized to the column, not the viewport:
                  about 400px at lg, 500px from xl. */}
              <h1 className="hero-in mb-6 font-heading text-balance text-[2.6rem] leading-[1.06] tracking-[-0.01em] sm:text-[3.4rem] sm:leading-[1.04] lg:text-[2.5rem] lg:leading-[1.08] xl:text-[3rem]">
                {t.hero.title} {t.hero.titleBreak}
              </h1>

              <p
                className="hero-in mb-8 max-w-[44ch] text-lg leading-relaxed text-muted-foreground"
                style={enterAt(90)}
              >
                {t.hero.subtitle}
              </p>

              <div className="hero-in flex flex-col gap-3 sm:flex-row" style={enterAt(180)}>
                <Button asChild size="lg" className="h-13 px-8 text-base">
                  <Link href="/s">
                    {t.hero.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-13 px-7 text-base">
                  <Link href="#how">{t.hero.examples}</Link>
                </Button>
              </div>
            </div>

            <div className="hero-in lg:col-span-7" style={enterAt(260)}>
              <ShowcaseWrapper />
            </div>
          </div>
        </div>
      </main>

      {/* How it works: each step drawn with the real thing it describes. */}
      <section id="how" className="scroll-mt-24 border-t border-border px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="mb-2 font-heading text-3xl leading-tight sm:text-[2.5rem]">
              {t.howItWorks.title}
            </h2>
            <p className="mb-12 text-muted-foreground">{t.howItWorks.subtitle}</p>
          </Reveal>

          <HowItWorksWrapper />
        </div>
      </section>

      {/* Features. Rows beside a photograph, not a second row of three
          columns: the steps above already use that family, and the same
          layout twice in a row is the templated rhythm this page avoids. */}
      <section className="border-t border-border bg-secondary/30 px-6 py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-5">
            {/* Süleymaniye Mosque, Istanbul. Unsplash, Esra Afşar (QXSSrsI_2nQ) */}
            <Image
              src="/landing/network-mosques.jpg"
              alt="Domes and minarets of a mosque against an evening sky"
              width={1200}
              height={1500}
              sizes="(max-width: 1024px) 100vw, 440px"
              className="aspect-4/5 w-full rounded-2xl object-cover"
            />
          </Reveal>

          <div className="lg:col-span-7">
            <Reveal>
              <h2 className="mb-8 font-heading text-3xl leading-tight sm:text-[2.5rem]">
                {t.features.title}
              </h2>
            </Reveal>
            <dl className="divide-y divide-border">
              {t.features.items.map(({ title, description }, i) => (
                <Reveal
                  key={title}
                  delay={i * 80}
                  className="grid gap-y-1.5 py-6 sm:grid-cols-12 sm:gap-x-6"
                >
                  <dt className="font-semibold sm:col-span-4">{title}</dt>
                  <dd className="text-[15px] leading-relaxed text-muted-foreground sm:col-span-8">
                    {description}
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-border px-6 py-28">
        {/* Sheikh Zayed Grand Mosque. Unsplash (vlxgphzJomk) */}
        <Image src="/landing/cta-light.jpg" alt="" fill aria-hidden className="object-cover" />
        <div className="absolute inset-0 bg-[#1A1205]/70" aria-hidden />
        <Reveal className="relative mx-auto max-w-2xl text-center text-white">
          <h2 className="mb-4 font-heading text-3xl leading-tight sm:text-[2.5rem]">
            {t.cta.title}
          </h2>
          <p className="mb-8 leading-relaxed text-white/75">{t.cta.subtitle}</p>
          <Button asChild size="lg" className="h-12 px-7">
            <Link href="/s">
              {t.cta.button} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </section>

      <Footer getStartedLabel={t.footer.getStarted} openSourceLabel={t.footer.openSource} />
    </div>
  );
}
