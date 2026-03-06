import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NextNamaz | Digital Prayer Times Display",
    template: "%s | NextNamaz",
  },
  description:
    "Turn any TV or tablet into a beautiful prayer times display for your mosque. Free, no special hardware, updated from your phone.",
  keywords: [
    "prayer times", "mosque display", "namaz", "salah", "digital signage",
    "islamic", "mosque tv", "prayer times screen", "bönetider",
    "namaz vakti", "namaska vremena", "mosque management",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "NextNamaz | Your Mosque Deserves a Better Prayer Display",
    description:
      "Turn any TV or tablet into a beautiful prayer times display. Free, no special hardware needed.",
    siteName: "NextNamaz",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NextNamaz | Your Mosque Deserves a Better Prayer Display",
    description:
      "Turn any TV or tablet into a beautiful prayer times display. Free, no special hardware needed.",
  },
  metadataBase: new URL("https://nextnamaz.com"),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
