import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LandingPage, landingMetadata } from '@/components/landing/landing-page';
import { DEFAULT_LANDING_LOCALE, LANDING_LOCALES, isLandingLocale } from '@/lib/landing-locales';

/**
 * The homepage in every language but English, which lives at /. Only these
 * codes exist: anything else under / is a 404, as it was before.
 */
export const dynamicParams = false;

export function generateStaticParams(): { lang: string }[] {
  return LANDING_LOCALES.filter((code) => code !== DEFAULT_LANDING_LOCALE).map((lang) => ({ lang }));
}

interface LangPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LangPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLandingLocale(lang) || lang === DEFAULT_LANDING_LOCALE) notFound();
  return landingMetadata(lang);
}

export default async function LocalizedHomePage({ params }: LangPageProps) {
  const { lang } = await params;
  if (!isLandingLocale(lang) || lang === DEFAULT_LANDING_LOCALE) notFound();
  return <LandingPage locale={lang} />;
}
