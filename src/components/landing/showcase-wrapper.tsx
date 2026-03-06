'use client';

import dynamic from 'next/dynamic';

const ShowcaseDemo = dynamic(
  () => import('./showcase-demo').then(m => m.ShowcaseDemo),
  { ssr: false, loading: () => <div className="h-96 rounded-2xl bg-muted animate-pulse" /> },
);

export function ShowcaseWrapper() {
  return <ShowcaseDemo />;
}
