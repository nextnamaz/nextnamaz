import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * Only the two public pages. Individual screens are deliberately absent —
 * see PRIVATE_PATHS in src/lib/site.ts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/s`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];
}
