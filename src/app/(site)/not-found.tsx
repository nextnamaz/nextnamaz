import type { Metadata } from 'next';
import { NotFoundView } from '@/components/not-found-view';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } };

/** A route under the site that calls notFound(), such as a settings link for a screen that is gone. */
export default function NotFound() {
  return <NotFoundView />;
}
