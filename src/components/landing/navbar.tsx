import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import type { LandingCopy } from '@/lib/landing-copy';
import { landingPath } from '@/lib/landing-locales';
import type { LandingLocale } from '@/lib/landing-locales';
import { HeaderBar } from './header-bar';
import { LogoLink } from './header-logo-link';
import { LanguagePicker } from './language-picker';

interface NavbarProps {
  t: LandingCopy['nav'];
  locale: LandingLocale;
}

export function Navbar({ t, locale }: NavbarProps) {
  const links = [
    { href: '#how', label: t.howItWorks },
    { href: '#features', label: t.features },
    { href: '#faq', label: t.faq },
  ];

  return (
    <HeaderBar label="Main">
      {/* Same container as the sections and footer, so the logo lines up down the page. */}
      {/* Below 25rem the row tightens (a smaller wordmark, less space, a compact button) so nothing has to shrink. */}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 min-[25rem]:gap-6">
        <LogoLink
          href={landingPath(locale)}
          aria-label={t.home}
          className="inline-flex h-10 shrink-0 items-center rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          <Logo size="sm" className="h-5 w-auto max-[25rem]:h-[17px]" />
        </LogoLink>
        <div className="flex min-w-0 items-center gap-2 min-[25rem]:gap-3 md:gap-6">
          <ul className="hidden items-center gap-7 md:flex">
            {links.map(({ href, label }) => (
              <li key={href}>
                <a href={href} className="inline-flex h-10 items-center rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-foreground">
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <LanguagePicker current={locale} label={t.language} />
          <Button asChild size="sm" className="h-10 px-4 max-[25rem]:px-3 max-[25rem]:text-[13px]">
            <Link href="/s">{t.getStarted}</Link>
          </Button>
        </div>
      </div>
    </HeaderBar>
  );
}
