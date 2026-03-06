import Link from 'next/link';
import { headers } from 'next/headers';
import { ArrowRight, Smartphone, WifiOff, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShowcaseWrapper } from '@/components/landing/showcase-wrapper';
import { NetworkIllustration } from '@/components/landing/network-illustration';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { detectLocale, getTranslations } from '@/lib/landing-i18n';
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
  alternates: {
    languages: {
      en: '/',
      bs: '/?lang=bs',
      sv: '/?lang=sv',
    },
  },
};

export default async function HomePage() {
  const hdrs = await headers();
  const acceptLang = hdrs.get('accept-language');
  const locale = detectLocale(acceptLang);
  const t = getTranslations(locale);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar signInLabel={t.nav.signIn} getStartedLabel={t.nav.getStarted} />

      {/* Hero */}
      <main className="relative pt-32 pb-16 px-6 sm:pt-40 sm:pb-20 overflow-hidden">
        {/* Gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-150 h-150 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute top-60 -left-40 w-125 h-125 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-20 right-20 w-100 h-100 rounded-full bg-accent/40 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            {t.hero.badge}
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            {t.hero.title}<br className="hidden sm:block" /> {t.hero.titleBreak}
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground mb-10 leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-16">
            <Button asChild size="lg" className="rounded-full px-8 h-12">
              <Link href="/register">
                {t.hero.cta} <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-12">
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">{t.story.title}</h2>
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t.howItWorks.title}</h2>
          <p className="text-muted-foreground mb-12 max-w-xl">
            {t.howItWorks.subtitle}
          </p>

          <div className="grid sm:grid-cols-3 gap-10">
            {t.howItWorks.steps.map((step, i) => (
              <div key={i}>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-4">
                  {i + 1}
                </div>
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-12">{t.features.title}</h2>

          <div className="grid sm:grid-cols-3 gap-10">
            {t.features.items.map((item, i) => {
              const icons = [Smartphone, WifiOff, Monitor];
              const Icon = icons[i];
              return (
                <div key={i} className="flex gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
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
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t.network.title}</h2>
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
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-150 h-75 rounded-full bg-primary/6 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            {t.cta.title}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
            {t.cta.subtitle}
          </p>
          <Button asChild size="lg" className="rounded-full px-8 h-12">
            <Link href="/register">
              {t.cta.button} <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer signInLabel={t.footer.signIn} getStartedLabel={t.footer.getStarted} />
    </div>
  );
}
