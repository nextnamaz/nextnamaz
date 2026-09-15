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
