import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

interface NavbarProps {
  signInLabel?: string;
  getStartedLabel?: string;
}

export function Navbar({ signInLabel = 'Sign In', getStartedLabel = 'Get Started' }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {signInLabel}
          </Link>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/register">
              {getStartedLabel}
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
