import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { LANDING_COPY } from '@/lib/landing-copy';

const LINKS = [
  { href: '#how', label: LANDING_COPY.nav.howItWorks },
  { href: '#features', label: LANDING_COPY.nav.features },
  { href: '#faq', label: LANDING_COPY.nav.faq },
];

export function Navbar() {
  const t = LANDING_COPY.nav;

  return (
    <nav aria-label="Main" className="fixed top-0 z-50 w-full border-b border-black/5 bg-background px-6">
      {/* Same container as the sections and footer, so the logo lines up down the page. */}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6">
        <Link href="/" aria-label={t.home} className="rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-foreground">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-8">
          <ul className="hidden items-center gap-7 md:flex">
            {LINKS.map(({ href, label }) => (
              <li key={href}>
                <a href={href} className="inline-flex h-10 items-center rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-foreground">
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <Button asChild size="sm" className="h-10 px-4">
            <Link href="/s">{t.getStarted}</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
