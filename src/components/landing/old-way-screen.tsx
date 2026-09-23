'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import { resolveDisplayLocale } from '@/lib/display-locale';
import { ScreenPlaceholder } from './screen-placeholder';
import { TvFrame } from './tv-frame';

/* Client-only: the display reads the visitor's clock. */
const DemoDisplay = dynamic(() => import('./demo-display').then((m) => m.DemoDisplay), {
  ssr: false,
  loading: () => <ScreenPlaceholder />,
});

/**
 * The set the printed timetable gives way to, running the real display in
 * the page's own language, read from the page root's `lang` (the landing
 * languages are display languages too). Decorative: the photograph beside it
 * carries the section's text alternative.
 */
export function OldWayScreen() {
  const [lang, setLang] = useState('en');
  const readLang = useCallback((el: HTMLDivElement | null) => {
    const found = el?.closest('[lang]')?.getAttribute('lang');
    if (found) setLang(found);
  }, []);
  const locale = useMemo(() => resolveDisplayLocale(lang), [lang]);

  return (
    <div ref={readLang} aria-hidden className="w-full">
      <TvFrame>
        <DemoDisplay locale={locale} />
      </TvFrame>
    </div>
  );
}
