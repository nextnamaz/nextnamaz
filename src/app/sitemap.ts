import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { LANDING_LOCALES, landingPath } from '@/lib/landing-locales';

/**
 * The public pages only. Individual screens are deliberately absent:
 * see PRIVATE_PATHS in src/lib/site.ts.
 */
/** The homepage in each language, each naming the others, and the setup page. */
export default function sitemap(): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const code of LANDING_LOCALES) languages[code] = `${SITE_URL}${landingPath(code) === '/' ? '' : landingPath(code)}`;

  return [
    ...LANDING_LOCALES.map((code) => ({
      url: languages[code] ?? SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: code === 'en' ? 1 : 0.9,
      alternates: { languages },
    })),
    {
      url: `${SITE_URL}/s`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];
}
