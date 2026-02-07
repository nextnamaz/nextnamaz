import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/admin/sidebar';

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

  // Verify user has access to this mosque
  const { data: membership } = await supabase
    .from('mosque_members')
    .select('role, mosques(id, name)')
    .eq('user_id', user.id)
    .eq('mosque_id', mosqueId)
    .single();

  if (!membership) notFound();

  const mosque = membership.mosques;
  if (!mosque) notFound();

  return (
    <div className="flex min-h-screen">
      <Sidebar mosqueName={mosque.name} mosqueId={mosqueId} />
      <main className="flex-1 bg-secondary p-8">{children}</main>
    </div>
  );
}
