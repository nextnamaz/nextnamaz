'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Monitor, Clock, Globe, LogOut, Building2, ChevronsUpDown, User2, Settings2, CreditCard } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
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
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    { href: `${base}/settings`, label: 'General', icon: Settings2, match: 'prefix' },
    { href: `${base}/billing`, label: 'Billing', icon: CreditCard, match: 'prefix' },
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Logo variant="round" size="sm" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{mosqueName}</span>
                <span className="truncate text-xs">Free Plan</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <User2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">My Account</span>
                    <span className="truncate text-xs">Manage account</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Building2 className="mr-2 size-4" />
                    <span>My Mosques</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
