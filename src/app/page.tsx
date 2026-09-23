import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { OldWay } from '@/components/landing/old-way';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { ScreenAnatomy } from '@/components/landing/screen-anatomy';
import { Features } from '@/components/landing/features';
import { Devices } from '@/components/landing/devices';
import { Faq } from '@/components/landing/faq';
import { Cta } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';
import { LANDING_COPY } from '@/lib/landing-copy';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: 'NextNamaz | Prayer Times Display for Mosques' },
  alternates: { canonical: '/' },
};

/** Schema.org entries so search results can show what this is, and its questions. */
const JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'NextNamaz',
    url: SITE_URL,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'A modern web browser',
    description:
      'Turn a TV, tablet or old laptop into a prayer times display for your mosque. Set it up by scanning a QR code with your phone.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    inLanguage: 'en',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: LANDING_COPY.faq.items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background font-sans text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Navbar />
      <main>
        <Hero />
        <OldWay />
        <HowItWorksSection />
        <ScreenAnatomy />
        <Features />
        <Devices />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
