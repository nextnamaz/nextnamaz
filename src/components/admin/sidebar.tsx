'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Monitor, Clock, Globe, ArrowLeft, LogOut } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  mosqueName: string;
  mosqueId: string;
}

const NAV_MATCH = {
  exact: 'exact',
  prefix: 'prefix',
} as const;

type NavMatch = (typeof NAV_MATCH)[keyof typeof NAV_MATCH];

interface NavItem {
  href: string;
  label: string;
  icon: typeof Monitor;
  match: NavMatch;
}

export function AppSidebar({ mosqueName, mosqueId }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/admin/${mosqueId}`;

  const navItems: NavItem[] = [
    { href: base, label: 'Screens', icon: Monitor, match: 'exact' },
    { href: `${base}/prayer-times`, label: 'Prayer Times', icon: Clock, match: 'prefix' },
    { href: `${base}/localization`, label: 'Localization', icon: Globe, match: 'prefix' },
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 pt-4 pb-2">
        <Link
          href="/admin"
          className="group flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors mb-3 font-medium group-data-[collapsible=icon]:hidden"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          All Mosques
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm flex items-center justify-center shrink-0">
            {mosqueName.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-sm truncate group-data-[collapsible=icon]:hidden">{mosqueName}</span>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = item.match === 'exact'
                ? pathname === item.href || pathname.startsWith(`${base}/screen`)
                : pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
