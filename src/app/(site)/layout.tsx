import type { ReactNode } from "react";
import { RootDocument, ROOT_METADATA, ROOT_VIEWPORT } from "../root-document";
import "../globals.css";

export const metadata = ROOT_METADATA;
export const viewport = ROOT_VIEWPORT;

/** The root layout for the site's own pages: the English homepage, setup, settings and the TV. */
export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
