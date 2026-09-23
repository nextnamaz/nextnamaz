import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { SITE_URL, SITE_NAME } from "@/lib/site";

/**
 * What every page's document shares, whichever root layout renders it: the
 * site's own pages under app/(site), and the translated homepages under
 * app/[lang], which need their own <html lang> and dir.
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Turn a TV, tablet or old laptop into a prayer times display for your mosque. Set it up by scanning a QR code with your phone. No app, no account, no special hardware.";

export const ROOT_METADATA: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NextNamaz | Prayer Times Display for Mosques",
    template: "%s | NextNamaz",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  // No canonical here: a root-layout canonical is inherited by every page, so
  // "/" would have every screen page nominating the homepage as its canonical.
  // Each indexable page declares its own.
  // Icons come from the file conventions in this directory (favicon.ico,
  // icon.svg, apple-icon.png), which Next links automatically. Listing them
  // here as well produced duplicate <link>s with contradictory sizes.
  manifest: "/manifest.json",
  openGraph: {
    title: "NextNamaz | Prayer Times Display for Mosques",
    description: DESCRIPTION,
    siteName: SITE_NAME,
    url: SITE_URL,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NextNamaz | Prayer Times Display for Mosques",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const ROOT_VIEWPORT: Viewport = {
  themeColor: "#E8A817",
};

interface RootDocumentProps {
  lang: string;
  dir?: "ltr" | "rtl";
  children: ReactNode;
}

export function RootDocument({ lang, dir = "ltr", children }: RootDocumentProps) {
  return (
    <html lang={lang} dir={dir} className="motion-safe:scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
