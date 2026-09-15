import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Turn any TV, tablet or old laptop into a prayer times display for your mosque. Set it up by scanning a QR code with your phone — no app, no account, no special hardware.";

export const metadata: Metadata = {
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

export const viewport: Viewport = {
  themeColor: "#E8A817",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="motion-safe:scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
