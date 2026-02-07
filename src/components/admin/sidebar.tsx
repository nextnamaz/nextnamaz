'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Monitor, Clock, Globe, ArrowLeft, LogOut } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  mosqueName: string;
  mosqueId: string;
}

export function Sidebar({ mosqueName, mosqueId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/admin/${mosqueId}`;

  const navItems = [
    { href: base, label: 'Screens', icon: Monitor, match: 'exact' as const },
    { href: `${base}/prayer-times`, label: 'Prayer Times', icon: Clock, match: 'prefix' as const },
    { href: `${base}/localization`, label: 'Localization', icon: Globe, match: 'prefix' as const },
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-56 shrink-0 bg-sidebar text-sidebar-foreground min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <Link
          href="/admin"
          className="group flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-sidebar-foreground/30 hover:text-sidebar-foreground/60 transition-colors mb-5 font-medium"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          All Mosques
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm flex items-center justify-center shrink-0">
            {mosqueName.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-sm truncate text-sidebar-foreground/90">{mosqueName}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-2 space-y-0.5">
        <p className="px-3 pb-2 text-[11px] uppercase tracking-wider text-sidebar-foreground/25 font-medium">Manage</p>
        {navItems.map((item) => {
          const isActive = item.match === 'exact'
            ? pathname === item.href || pathname.startsWith(`${base}/screen`)
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-all duration-150',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/45 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/80'
              )}
            >
              <item.icon className={cn('w-4 h-4 shrink-0', isActive && 'text-sidebar-primary')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <Separator className="mx-3 w-auto bg-sidebar-border/40" />
      <div className="px-3 pb-4 pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/30 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/50 text-xs h-8"
          onClick={handleSignOut}
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
