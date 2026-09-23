import type { NextConfig } from "next";

/**
 * Kept free of imports from src/: this file is loaded outside the app's module
 * graph and before its path aliases exist, so a dependency here is a build
 * risk for no benefit. The paths below are mirrored by PRIVATE_PATHS in
 * src/lib/site.ts, which drives robots.txt; tests/e2e/seo.spec.ts asserts the
 * document, the headers and robots.txt all agree, so a drift is caught there.
 */
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Announcement videos upload through a server action; the default 1 MB
      // body cap would reject them.
      bodySizeLimit: "45mb",
    },
    // Off on purpose. Next 16.3 turned Turbopack's on-disk build cache on by
    // default, and Vercel restores it between deploys. On 2026-09-15 that
    // shipped a build whose Tailwind utilities were fresh but whose
    // globals.css body was stale: no new custom rules, an old token value,
    // and "Deployment succeeded". A slower build is cheaper than a silent
    // one. Re-enable only with a check that the served CSS matches source.
    turbopackFileSystemCacheForBuild: false,
    // app/global-not-found.tsx: the site has two root layouts, so an unmatched
    // address needs a 404 that brings its own document.
    globalNotFound: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        // A screen's id is its only password. Keep it out of indexes and out
        // of any Referer header sent to another origin.
        source: "/:section(s|tv)/:id",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet, noimageindex",
          },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
