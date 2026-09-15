import type { NextConfig } from "next";
import { PRIVATE_PATHS } from "./src/lib/site";

/** The two routes whose URL is the screen's only secret. */
const SECRET_ROUTES = ["/s/:id", "/tv/:id"];

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
          // A screen id in a Referer header is a leaked password. Same-origin
          // keeps internal navigation working (settings -> its own display)
          // while sending nothing at all to another site — including the
          // Supabase storage host that serves uploaded announcement media.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/(s|tv)/:id",
        headers: [
          // Belt and braces with the page metadata: this reaches a crawler
          // that fetched the URL anyway, and robots.txt is only advisory.
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet, noimageindex",
          },
          // Nothing leaves with the secret URL attached.
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

// Keeps the header rules and robots.txt describing the same set of paths.
if (!SECRET_ROUTES.every((route) => PRIVATE_PATHS.some((p) => route.startsWith(p)))) {
  throw new Error("SECRET_ROUTES and PRIVATE_PATHS have drifted apart");
}

export default nextConfig;
