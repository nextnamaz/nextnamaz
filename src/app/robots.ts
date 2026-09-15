import type { MetadataRoute } from 'next';
import { SITE_URL, PRIVATE_PATHS } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // A screen's id is its secret. Indexing these hands out the controls.
      disallow: PRIVATE_PATHS,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
