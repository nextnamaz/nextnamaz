'use client';

import { useEffect, useRef } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { LANDING_LOCALES, LANDING_LOCALE_INFO, pickLanguageHref } from '@/lib/landing-locales';
import type { LandingLocale } from '@/lib/landing-locales';

interface LanguagePickerProps {
  current: LandingLocale;
  /** Accessible name, in the page's own language. */
  label: string;
}

/**
 * The homepage in another language. A native disclosure, so it opens and
 * works without JavaScript. Each link carries ?hl=, which the proxy turns
 * into a remembered choice, so / stops sending this visitor elsewhere.
 * With JavaScript it also closes on a click outside it and on Escape.
 */
export function LanguagePicker({ current, label }: LanguagePickerProps) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;
    const onPointerDown = (e: PointerEvent) => {
      if (details.open && e.target instanceof Node && !details.contains(e.target)) details.open = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !details.open) return;
      details.open = false;
      details.querySelector('summary')?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <details ref={ref} className="group relative">
      <summary
        aria-label={`${label}: ${LANDING_LOCALE_INFO[current].nativeName}`}
        className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-foreground [&::-webkit-details-marker]:hidden"
      >
        <Globe aria-hidden className="size-4 max-[25rem]:hidden" strokeWidth={1.75} />
        <span className="uppercase">{current}</span>
        <ChevronDown aria-hidden className="size-3.5 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <ul className="absolute end-0 z-50 mt-2 w-44 rounded-2xl border border-border bg-card p-1.5 shadow-[0_12px_32px_-12px_rgba(38,24,10,0.22)]">
        {LANDING_LOCALES.map((code) => (
          <li key={code}>
            <a
              href={pickLanguageHref(code)}
              hrefLang={code}
              lang={code}
              aria-current={code === current ? 'true' : undefined}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-secondary focus-visible:bg-secondary"
            >
              <span dir={LANDING_LOCALE_INFO[code].dir}>{LANDING_LOCALE_INFO[code].nativeName}</span>
              {code === current && <Check aria-hidden className="size-4 text-primary" strokeWidth={2.5} />}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
