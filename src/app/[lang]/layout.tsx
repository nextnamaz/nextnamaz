import type { ReactNode } from "react";
import { RootDocument, ROOT_METADATA, ROOT_VIEWPORT } from "../root-document";
import { LANDING_LOCALE_INFO, isLandingLocale } from "@/lib/landing-locales";
import "../globals.css";

export const metadata = ROOT_METADATA;
export const viewport = ROOT_VIEWPORT;

interface LangLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

/**
 * The root layout for the translated homepages, so the document itself says
 * which language it is in (and that Arabic reads right to left). An unknown
 * code is a 404, rendered in English.
 */
export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;
  const known = isLandingLocale(lang);
  return (
    <RootDocument lang={known ? lang : "en"} dir={known ? LANDING_LOCALE_INFO[lang].dir : "ltr"}>
      {children}
    </RootDocument>
  );
}
