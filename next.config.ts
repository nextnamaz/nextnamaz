import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Announcement videos upload through a server action; the default 1 MB
      // body cap would reject them.
      bodySizeLimit: "45mb",
    },
  },
};

export default nextConfig;
