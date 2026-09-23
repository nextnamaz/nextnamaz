import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import { Github, Linkedin } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { LANDING_COPY } from '@/lib/landing-copy';

interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}

interface FooterColumn {
  id: string;
  heading: string;
  links: FooterLink[];
}

interface SocialLink {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const t = LANDING_COPY.footer;

const COLUMNS: FooterColumn[] = [
  {
    id: 'footer-product',
    heading: t.product.heading,
    links: [
      { href: '/s', label: t.product.links.getStarted },
      { href: '#how', label: t.product.links.howItWorks },
      { href: '#features', label: t.product.links.features },
      { href: '#faq', label: t.product.links.faq },
    ],
  },
  {
    id: 'footer-project',
    heading: t.project.heading,
    links: [
      { href: 'https://github.com/nextnamaz/nextnamaz', label: t.project.links.source, external: true },
      {
        href: 'https://github.com/nextnamaz/nextnamaz/blob/main/LICENSE',
        label: t.project.links.license,
        external: true,
      },
    ],
  },
];

/** The icon-only links. The maker's website is the credit line, so it gets no icon. */
const SOCIAL: SocialLink[] = [
  { href: 'https://github.com/nextnamaz', label: t.social.github, Icon: Github },
  { href: 'https://se.linkedin.com/in/ismail-sacic', label: t.social.linkedin, Icon: Linkedin },
];

const EXTERNAL = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** Ink outline: 3:1 and more against the page, where a gold ring is not. */
const focusRing = 'outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-foreground';

const linkClass = `rounded-sm text-[15px] text-muted-foreground transition-colors hover:text-foreground ${focusRing}`;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-background px-6 pt-16 pb-10 sm:pt-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-12">
          <div className="col-span-2 md:col-span-6 lg:col-span-7">
            {/* Named by the logo's alt text. */}
            <Link href="/" className={`inline-block rounded-md ${focusRing}`}>
              <Logo size="sm" className="h-5 w-auto" />
            </Link>
            <p className="mt-4 max-w-[14.5rem] text-[15px] leading-relaxed text-muted-foreground">{t.tagline}</p>
            {/* The credit sits with the maker's own links, away from the copyright line that also names him. */}
            <div className="mt-6 flex items-center gap-5">
              <a
                href={t.madeBy.href}
                {...EXTERNAL}
                className={`rounded-sm text-[13px] font-medium text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-primary ${focusRing}`}
              >
                {t.madeBy.label}
              </a>
              <ul className="flex items-center gap-3">
                {SOCIAL.map(({ href, label, Icon }) => (
                  <li key={href} className="flex">
                    <a
                      href={href}
                      {...EXTERNAL}
                      aria-label={label}
                      className={`-m-1.5 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground ${focusRing}`}
                    >
                      <Icon aria-hidden className="size-[17px]" strokeWidth={1.75} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.id} aria-labelledby={col.id} className="md:col-span-3 lg:col-span-2 lg:first-of-type:col-start-9">
              <h2 id={col.id} className="text-sm font-semibold text-foreground">
                {col.heading}
              </h2>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a href={link.href} {...EXTERNAL} className={linkClass}>
                        {link.label}
                      </a>
                    ) : link.href.startsWith('/') ? (
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className={linkClass}>
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 space-y-2 border-t border-border pt-8 text-[12.5px] leading-relaxed text-muted-foreground">
          <p className="text-[13px] text-foreground/80">
            &copy; {year} {t.copyright}
          </p>
          <p className="max-w-[68ch]">{t.license}</p>
          <p className="max-w-[68ch]">{t.timesNote}</p>
        </div>
      </div>
    </footer>
  );
}
