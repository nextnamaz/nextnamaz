'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Monitor, Clock, Globe, ArrowLeft, LogOut, Building2 } from 'lucide-react';
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
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="h-16 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2 px-2 w-full h-full">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <span className="font-bold">{mosqueName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold capitalize">{mosqueName}</span>
            <span className="text-xs text-muted-foreground">Free Plan</span>
          </div>
        </div>
      </SidebarHeader>

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
            <SidebarMenuButton asChild tooltip="My Mosques">
              <Link href="/admin">
                <Building2 />
                <span>My Mosques</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
