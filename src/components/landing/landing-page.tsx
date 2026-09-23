import type { Metadata } from 'next';
import { Navbar } from './navbar';
import { Hero } from './hero-v3';
import { OldWay } from './old-way';
import { HowItWorksSection } from './how-it-works-section';
import { ScreenAnatomy } from './screen-anatomy';
import { OrientationShowcase } from './orientation-showcase';
import { Features } from './features';
import { Devices } from './devices';
import { Faq } from './faq';
import { Cta } from './cta';
import { Footer } from './footer';
import { getLandingCopy } from '@/lib/landing-i18n';
import { LANDING_LOCALES, LANDING_LOCALE_INFO, landingPath } from '@/lib/landing-locales';
import type { LandingLocale } from '@/lib/landing-locales';
import { SITE_NAME, SITE_URL } from '@/lib/site';

/** Every language's address, for hreflang: search engines serve each reader their own. */
function languageAlternates(): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const code of LANDING_LOCALES) alternates[code] = landingPath(code);
  alternates['x-default'] = landingPath('en');
  return alternates;
}

/**
 * The share card, app/opengraph-image.tsx. Next links it on / by itself; the
 * other languages set their own openGraph, which replaces the inherited one,
 * so they name it here. On / the file wins over this, so it is not listed twice.
 */
const SHARE_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: 'NextNamaz: put prayer times on your mosque TV' };

/** The homepage's metadata in a language: its own title, description, canonical and alternates. */
export function landingMetadata(locale: LandingLocale): Metadata {
  const t = getLandingCopy(locale).meta;
  const info = LANDING_LOCALE_INFO[locale];
  const path = landingPath(locale);
  return {
    // Absolute: the homepage shares its segment with the root layout, so the layout's "%s | NextNamaz" template does not reach it.
    title: { absolute: `${t.title} | ${SITE_NAME}` },
    description: t.description,
    alternates: { canonical: path, languages: languageAlternates() },
    openGraph: {
      title: `${t.title} | ${SITE_NAME}`,
      description: t.description,
      url: path,
      siteName: SITE_NAME,
      type: 'website',
      locale: info.ogLocale,
      alternateLocale: LANDING_LOCALES.filter((code) => code !== locale).map((code) => LANDING_LOCALE_INFO[code].ogLocale),
      images: [SHARE_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: `${t.title} | ${SITE_NAME}`, description: t.description, images: [SHARE_IMAGE] },
  };
}

/**
 * The homepage, in one of its languages. Every section takes its words as
 * props; the demo TVs speak the same language as the page around them.
 */
export function LandingPage({ locale }: { locale: LandingLocale }) {
  const t = getLandingCopy(locale);
  const info = LANDING_LOCALE_INFO[locale];

  /** Schema.org entries so search results can show what this is, and its questions. */
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: SITE_NAME,
      url: `${SITE_URL}${landingPath(locale) === '/' ? '' : landingPath(locale)}`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any web browser',
      description: t.meta.description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      inLanguage: locale,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: locale,
      mainEntity: t.faq.items.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ];

  return (
    <div lang={locale} dir={info.dir} className="min-h-dvh bg-background font-sans text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar t={t.nav} locale={locale} />
      <main>
        <Hero t={t.hero} display={info.display} />
        <OldWay t={t.oldWay} toSteps={t.hero.secondary} />
        <HowItWorksSection t={t.howItWorks} display={info.display} />
        <ScreenAnatomy t={t.display} display={info.display} />
        <OrientationShowcase t={t.orientation} display={info.display} />
        <Features t={t.features} display={info.display} />
        <Devices t={t.devices} />
        <Faq t={t.faq} oss={t.openSource} />
        <Cta t={t.cta} />
      </main>
      <Footer t={t.footer} locale={locale} languageLabel={t.nav.language} />
    </div>
  );
}
