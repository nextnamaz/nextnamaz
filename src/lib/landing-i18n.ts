import { LANDING_COPY } from '@/lib/landing-copy';
import type { LandingCopy } from '@/lib/landing-copy';
import type { LandingLocale } from '@/lib/landing-locales';
import { SV } from '@/lib/landing-translations/sv';
import { BS } from '@/lib/landing-translations/bs';
import { DE } from '@/lib/landing-translations/de';
import { AR } from '@/lib/landing-translations/ar';
import { TR } from '@/lib/landing-translations/tr';

const COPY: Record<LandingLocale, LandingCopy> = {
  en: LANDING_COPY,
  sv: SV,
  bs: BS,
  de: DE,
  ar: AR,
  tr: TR,
};

/** The homepage's words in a language. Server-side: pages pass slices down as props. */
export function getLandingCopy(locale: LandingLocale): LandingCopy {
  return COPY[locale];
}
