'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Monitor, Settings, ArrowLeft, LogOut } from 'lucide-react';

interface SidebarProps {
  mosqueName: string;
  mosqueId: string;
}

export function Sidebar({ mosqueName, mosqueId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: `/admin/${mosqueId}`, label: 'Screens', icon: Monitor },
    { href: `/admin/${mosqueId}/settings`, label: 'Settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-56 bg-sidebar text-sidebar-foreground min-h-screen flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/admin" className="text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground/80 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3 h-3" />
          All Mosques
        </Link>
        <h1 className="font-bold text-sm truncate">{mosqueName}</h1>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
