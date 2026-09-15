/**
 * Canonical origin. The apex domain 307s to www, so www is the real home —
 * pointing canonicals or the sitemap at the apex just sends crawlers through
 * a redirect.
 */
export const SITE_URL = 'https://www.nextnamaz.com';

export const SITE_NAME = 'NextNamaz';

/**
 * Screen URLs (/s/<id>, /tv/<id>) must never be crawled: the id in the path is
 * the only thing protecting that screen's settings, so an indexed URL is a
 * leaked password. Kept here so robots.ts and sitemap.ts can't drift apart.
 */
export const PRIVATE_PATHS = ['/s/', '/tv/', '/api/'];

/**
 * Metadata for a page whose URL is itself the secret.
 *
 * robots.txt stops a well-behaved crawler fetching these at all, but it does
 * not stop one that learned the URL elsewhere from listing it, and it is
 * advisory — a crawler that ignores it still fetches the page. This says
 * noindex in the document too, and `canonical: null` stops the root layout's
 * canonical (which points at "/") being inherited and quietly nominating the
 * homepage as this page's canonical.
 */
export const NOINDEX_METADATA = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  alternates: { canonical: null },
} as const;
