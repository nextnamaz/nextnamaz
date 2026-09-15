import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * Metadata for /s. The page itself is a client component, which cannot export
 * metadata, so it lives here.
 *
 * This layout also wraps /s/[id]; that page overrides every field below with
 * NOINDEX_METADATA, so the canonical and the indexable robots rule stop at
 * /s and do not reach a screen's settings URL.
 */
export const metadata: Metadata = {
  title: 'Set up a screen',
  description:
    'Open this on the TV, tablet or old laptop that should show prayer times, press Start, and finish the setup from your phone.',
  alternates: { canonical: '/s' },
  openGraph: {
    title: 'Set up a screen | NextNamaz',
    description:
      'Open this on the screen that should show prayer times, then finish from your phone.',
    url: '/s',
    type: 'website',
  },
};

export default function SetupLayout({ children }: { children: ReactNode }) {
  return children;
}
