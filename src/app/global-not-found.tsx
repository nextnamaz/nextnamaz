import type { Metadata } from 'next';
import { RootDocument } from './root-document';
import { NotFoundView } from '@/components/not-found-view';
import './globals.css';

export const metadata: Metadata = { title: 'Page not found | NextNamaz', robots: { index: false } };

/**
 * An address that matches no route at all. The app has two root layouts
 * ((site) and [lang]), so there is no single layout to build this from; it
 * brings its own document.
 */
export default function GlobalNotFound() {
  return (
    <RootDocument lang="en">
      <NotFoundView />
    </RootDocument>
  );
}
