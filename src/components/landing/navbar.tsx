import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

interface NavbarProps {
  getStartedLabel?: string;
}

export function Navbar({ getStartedLabel = 'Get Started' }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        <Button asChild size="sm" className="rounded-full">
          <Link href="/s">
            {getStartedLabel}
          </Link>
        </Button>
      </div>
    </nav>
  );
}
