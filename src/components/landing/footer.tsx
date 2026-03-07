import Link from 'next/link';
import { Github, Linkedin, Globe } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { createClient } from '@/lib/supabase/server';

interface FooterProps {
  signInLabel?: string;
  getStartedLabel?: string;
}

export async function Footer({ signInLabel = 'Sign In', getStartedLabel = 'Get Started' }: FooterProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <footer className="border-t border-border py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo variant="round" size="sm" />
            <span className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} NextNamaz</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {isLoggedIn ? (
              <Link href="/admin" className="hover:text-foreground transition-colors">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="hover:text-foreground transition-colors">{signInLabel}</Link>
                <Link href="/register" className="hover:text-foreground transition-colors">{getStartedLabel}</Link>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-5">
          <a href="https://github.com/nextnamaz" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Github className="w-5 h-5" />
          </a>
          <a href="https://se.linkedin.com/in/ismail-sacic" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Linkedin className="w-5 h-5" />
          </a>
          <a href="https://ismail.sacic.dev/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Globe className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
