'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Monitor, Clock, Timer, Globe, ArrowLeft, LogOut } from 'lucide-react';

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
    { href: `${base}/iqamah`, label: 'Iqamah', icon: Timer, match: 'prefix' as const },
    { href: `${base}/localization`, label: 'Localization', icon: Globe, match: 'prefix' as const },
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-60 bg-sidebar text-sidebar-foreground min-h-screen flex flex-col border-r border-sidebar-border">
      {/* Brand + mosque */}
      <div className="p-4 pb-3">
        <Link
          href="/admin"
          className="group flex items-center gap-1.5 text-xs text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors mb-4"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          All Mosques
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground font-bold text-sm flex items-center justify-center shrink-0">
            {mosqueName.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-sm truncate">{mosqueName}</span>
        </div>
      </div>

      <div className="h-px bg-sidebar-border/60 mx-4" />

      {/* Navigation */}
      <nav className="flex-1 p-3 pt-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.match === 'exact'
            ? pathname === item.href || pathname.startsWith(`${base}/screen`)
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/80'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 pt-0">
        <div className="h-px bg-sidebar-border/60 mb-3" />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent text-xs h-9"
          onClick={handleSignOut}
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
