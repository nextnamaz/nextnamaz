import Link from 'next/link';
import { Github, Linkedin, Globe } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface FooterProps {
  getStartedLabel?: string;
}

const links = [
  { href: 'https://github.com/nextnamaz', label: 'GitHub', Icon: Github },
  { href: 'https://se.linkedin.com/in/ismail-sacic', label: 'LinkedIn', Icon: Linkedin },
  { href: 'https://ismail.sacic.dev/', label: 'Website', Icon: Globe },
];

export function Footer({ getStartedLabel = 'Get Started' }: FooterProps) {
  return (
    <footer className="px-6 py-12">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <Logo variant="round" size="sm" />
          <span className="eyebrow text-muted-foreground">
            &copy; {new Date().getFullYear()} NextNamaz
          </span>
        </div>

        <div className="flex items-center gap-7">
          <Link
            href="/s"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {getStartedLabel}
          </Link>
          <div className="flex items-center gap-4">
            {links.map(({ href, label, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
