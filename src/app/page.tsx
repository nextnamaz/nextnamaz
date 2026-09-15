import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShowcaseWrapper } from '@/components/landing/showcase-wrapper';
import { HowItWorksWrapper } from '@/components/landing/how-it-works-wrapper';
import { StartHere } from '@/components/landing/start-here';
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

export default function HomePage() {
  const t = LANDING_COPY;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Navbar getStartedLabel={t.nav.getStarted} />

      {/* Hero */}
      <main className="pt-32 pb-16 px-6 sm:pt-40 sm:pb-20">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading max-w-3xl text-[2.7rem] leading-[1.06] sm:text-[4.4rem] sm:leading-[1.03] tracking-[-0.01em] mb-7">
            {t.hero.title}<br className="hidden sm:block" /> {t.hero.titleBreak}
          </h1>

          <p className="max-w-xl text-lg text-muted-foreground mb-10 leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <Button asChild size="lg" className="px-8 h-13 text-base">
              <Link href="/s">
                {t.hero.cta} <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-7 h-13 text-base">
              <Link href="#demo">{t.hero.examples}</Link>
            </Button>
          </div>

          <div className="mb-16">
            <StartHere />
          </div>

          <div id="demo" className="scroll-mt-24">
            <ShowcaseWrapper />
          </div>
        </div>
      </main>

      {/* How it works — each step drawn with the real thing it describes */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl sm:text-[2.5rem] leading-tight mb-2">
            {t.howItWorks.title}
          </h2>
          <p className="text-muted-foreground mb-12">{t.howItWorks.subtitle}</p>

          <HowItWorksWrapper />
        </div>
      </section>

      {/* Features — plain text columns, no icons */}
      <section className="py-20 px-6 border-t border-border bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl sm:text-[2.5rem] leading-tight mb-12">
            {t.features.title}
          </h2>

          <div className="grid sm:grid-cols-3 gap-x-10 gap-y-9">
            {t.features.items.map(({ title, description }) => (
              <div key={title}>
                <h3 className="font-semibold mb-1.5">{title}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 px-6 border-t border-border overflow-hidden">
        {/* Sheikh Zayed Grand Mosque — Unsplash (vlxgphzJomk) */}
        <Image src="/landing/cta-light.jpg" alt="" fill aria-hidden className="object-cover" />
        <div className="absolute inset-0 bg-[#1A1205]/70" aria-hidden />
        <div className="relative max-w-2xl mx-auto text-center text-white">
          <h2 className="font-heading text-3xl sm:text-[2.5rem] leading-tight mb-4">
            {t.cta.title}
          </h2>
          <p className="text-white/75 mb-8 leading-relaxed">{t.cta.subtitle}</p>
          <Button asChild size="lg" className="px-7 h-12">
            <Link href="/s">
              {t.cta.button} <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer getStartedLabel={t.footer.getStarted} openSourceLabel={t.footer.openSource} />
    </div>
  );
}
