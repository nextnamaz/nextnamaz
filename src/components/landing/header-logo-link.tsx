'use client';

import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';

interface LogoLinkProps {
  /** The homepage in the page's language. A real href, so it works without JavaScript and from other pages. */
  href: string;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

/**
 * The logo as a link home. Already on that page, it scrolls back to the very
 * top instead of reloading: smoothly, or at once for reduced motion.
 */
export function LogoLink({ href, children, className, 'aria-label': ariaLabel }: LogoLinkProps) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // A new tab, a new window or a download stays the browser's business.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (new URL(href, window.location.href).pathname !== window.location.pathname) return;
    e.preventDefault();
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: still ? 'instant' : 'smooth' });
    // Drop a #section left by the nav, so a reload lands at the top too.
    if (window.location.hash || window.location.search) window.history.replaceState(window.history.state, '', href);
  };

  return (
    <Link href={href} onClick={onClick} aria-label={ariaLabel} className={className}>
      {children}
    </Link>
  );
}
