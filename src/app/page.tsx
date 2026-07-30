import Link from 'next/link';
import { ArrowRight, Smartphone, WifiOff, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShowcaseWrapper } from '@/components/landing/showcase-wrapper';
import { NetworkIllustration } from '@/components/landing/network-illustration';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { LANDING_COPY } from '@/lib/landing-copy';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NextNamaz | Digital Prayer Times Display for Mosques',
  description: 'Turn any TV or tablet into a beautiful prayer times display for your mosque. Free, no special hardware, updated from your phone.',
  keywords: [
    'prayer times', 'mosque display', 'namaz', 'salah', 'digital signage',
    'islamic', 'mosque tv', 'prayer times screen', 'bönetider', 'namaz vakti',
    'namaska vremena', 'mosque management',
  ],
  openGraph: {
    title: 'NextNamaz | Your Mosque Deserves a Better Prayer Display',
    description: 'Turn any TV or tablet into a beautiful prayer times display. Free, no special hardware needed.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NextNamaz | Your Mosque Deserves a Better Prayer Display',
    description: 'Turn any TV or tablet into a beautiful prayer times display. Free, no special hardware needed.',
  },
};

export default function HomePage() {
  const t = LANDING_COPY;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar getStartedLabel={t.nav.getStarted} />

      {/* Hero */}
      <main className="relative pt-32 pb-16 px-6 sm:pt-40 sm:pb-20 overflow-hidden">
        <div className="relative max-w-5xl mx-auto">
          <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-7">
            {t.hero.badge}
            <span aria-hidden className="h-px w-16 bg-border" />
          </p>

          <h1 className="max-w-3xl text-[2.6rem] leading-[1.05] sm:text-[4.2rem] sm:leading-[1.02] font-bold tracking-[-0.02em] mb-7">
            {t.hero.title}<br className="hidden sm:block" /> {t.hero.titleBreak}
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground mb-10 leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-16">
            <Button asChild size="lg" className="px-7 h-12">
              <Link href="/s">
                {t.hero.cta} <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-7 h-12">
              <Link href="#showcase">
                {t.hero.examples}
              </Link>
            </Button>
          </div>

          {/* Demo */}
          <div id="showcase">
            <ShowcaseWrapper />
          </div>
        </div>
      </main>

      {/* Story */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-[2.4rem] leading-tight font-bold tracking-[-0.015em] mb-8">{t.story.title}</h2>
          <div className="space-y-5 text-muted-foreground leading-relaxed text-[17px]">
            {t.story.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-border bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-[2.4rem] leading-tight font-bold tracking-[-0.015em] mb-4">{t.howItWorks.title}</h2>
          <p className="text-muted-foreground mb-12 max-w-xl">
            {t.howItWorks.subtitle}
          </p>

          <div className="grid sm:grid-cols-3 gap-10">
            {t.howItWorks.steps.map((step, i) => (
              <div key={i} className="border-t border-foreground/15 pt-5">
                <span className="block font-heading text-3xl text-primary mb-3 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase / Themes section removed, demo is now in hero */}

      {/* Features */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-[2.4rem] leading-tight font-bold tracking-[-0.015em] mb-12">{t.features.title}</h2>

          <div className="grid sm:grid-cols-3 gap-10">
            {t.features.items.map((item, i) => {
              const icons = [Smartphone, WifiOff, Monitor];
              const Icon = icons[i];
              return (
                <div key={i} className="border-t border-foreground/15 pt-5">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Icon className="w-4 h-4 text-primary shrink-0" strokeWidth={1.75} />
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Network / Connected */}
      <section className="py-20 px-6 border-t border-border bg-secondary/30 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-[2.4rem] leading-tight font-bold tracking-[-0.015em] mb-4">{t.network.title}</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                {t.network.subtitle}
              </p>
              <div className="space-y-5">
                {t.network.points.map((point, i) => (
                  <div key={i}>
                    <h3 className="font-semibold mb-1">{point.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{point.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <NetworkIllustration />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-6 border-t border-border overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-[2.4rem] leading-tight font-bold tracking-[-0.015em] mb-4">
            {t.cta.title}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
            {t.cta.subtitle}
          </p>
          <Button asChild size="lg" className="px-7 h-12">
            <Link href="/s">
              {t.cta.button} <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer getStartedLabel={t.footer.getStarted} />
    </div>
  );
}
