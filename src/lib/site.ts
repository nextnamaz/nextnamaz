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
