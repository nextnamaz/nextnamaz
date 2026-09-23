import type { SupportedLocale } from '@/types/locale';

/**
 * The languages the homepage is written in. Only the homepage: the setup,
 * settings and TV pages stay as they are. English lives at /, the others
 * under their code (/sv, /bs ...), so each can be indexed on its own.
 *
 * No imports of the copy here: the proxy reads this file, and should not
 * carry every translation with it.
 */
export const LANDING_LOCALES = ['en', 'sv', 'bs', 'de', 'ar', 'tr'] as const;

export type LandingLocale = (typeof LANDING_LOCALES)[number];

export const DEFAULT_LANDING_LOCALE: LandingLocale = 'en';

export interface LandingLocaleInfo {
  /** The language's own name, for the picker. */
  nativeName: string;
  dir: 'ltr' | 'rtl';
  /** Open Graph locale. */
  ogLocale: string;
  /** The display language the demo TVs speak on this page. */
  display: SupportedLocale;
}

export const LANDING_LOCALE_INFO: Record<LandingLocale, LandingLocaleInfo> = {
  en: { nativeName: 'English', dir: 'ltr', ogLocale: 'en_US', display: 'en' },
  sv: { nativeName: 'Svenska', dir: 'ltr', ogLocale: 'sv_SE', display: 'sv' },
  bs: { nativeName: 'Bosanski', dir: 'ltr', ogLocale: 'bs_BA', display: 'bs' },
  de: { nativeName: 'Deutsch', dir: 'ltr', ogLocale: 'de_DE', display: 'de' },
  ar: { nativeName: 'العربية', dir: 'rtl', ogLocale: 'ar_AR', display: 'ar' },
  tr: { nativeName: 'Türkçe', dir: 'ltr', ogLocale: 'tr_TR', display: 'tr' },
};

export function isLandingLocale(value: string): value is LandingLocale {
  return (LANDING_LOCALES as readonly string[]).includes(value);
}

/** The homepage's address in a language: / for English, /sv for Swedish. */
export function landingPath(locale: LandingLocale): string {
  return locale === DEFAULT_LANDING_LOCALE ? '/' : `/${locale}`;
}

/** Links that pick a language by hand carry it as ?hl=, which the proxy remembers. */
export function pickLanguageHref(locale: LandingLocale): string {
  return `${landingPath(locale)}?hl=${locale}`;
}

/** The cookie that remembers a language picked by hand, so / stops redirecting. */
export const LANDING_LOCALE_COOKIE = 'nn-lang';

/** Browser language subtags we serve, and where. The Bosnian page reads fine in Croatian and Serbian. */
const FROM_LANGUAGE: Record<string, LandingLocale> = {
  en: 'en',
  sv: 'sv',
  bs: 'bs',
  hr: 'bs',
  sr: 'bs',
  sh: 'bs',
  cnr: 'bs',
  de: 'de',
  ar: 'ar',
  tr: 'tr',
};

const ARAB_COUNTRIES = ['SA', 'AE', 'EG', 'JO', 'MA', 'DZ', 'TN', 'IQ', 'KW', 'QA', 'BH', 'OM', 'LB', 'SY', 'YE', 'LY', 'SD', 'PS', 'MR'];

const FROM_COUNTRY: Record<string, LandingLocale> = {
  SE: 'sv',
  BA: 'bs',
  DE: 'de',
  AT: 'de',
  CH: 'de',
  TR: 'tr',
  ...Object.fromEntries(ARAB_COUNTRIES.map((code) => [code, 'ar' as const])),
};

/** The first supported language in an Accept-Language header, by q-value. */
function fromAcceptLanguage(header: string | null): LandingLocale | null {
  if (!header) return null;
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .filter(({ tag }) => tag && tag !== '*')
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const locale = FROM_LANGUAGE[tag.split('-')[0] ?? ''];
    if (locale) return locale;
  }
  return null;
}

/**
 * The homepage language for a first visit: the browser's first supported
 * language unless that is English, then the country, then English. A browser
 * set to English in Sweden still gets Swedish: English is the default there,
 * not a choice.
 */
export function detectLandingLocale(acceptLanguage: string | null, country: string | null): LandingLocale {
  const byLanguage = fromAcceptLanguage(acceptLanguage);
  if (byLanguage && byLanguage !== DEFAULT_LANDING_LOCALE) return byLanguage;
  return FROM_COUNTRY[country ?? ''] ?? byLanguage ?? DEFAULT_LANDING_LOCALE;
}
