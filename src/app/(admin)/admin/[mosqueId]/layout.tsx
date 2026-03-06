import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/admin/sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

interface MosqueLayoutProps {
  children: React.ReactNode;
  params: Promise<{ mosqueId: string }>;
}

export default async function MosqueLayout({ children, params }: MosqueLayoutProps) {
  const { mosqueId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: membership } = await supabase
    .from('mosque_members')
    .select('role, mosques(id, name)')
    .eq('user_id', user.id)
    .eq('mosque_id', mosqueId)
    .single();

  if (!membership) notFound();

  const mosque = membership.mosques as unknown as { id: string; name: string };
  if (!mosque) notFound();

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar mosqueName={mosque.name} mosqueId={mosqueId} userEmail={user.email ?? ''} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 py-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
