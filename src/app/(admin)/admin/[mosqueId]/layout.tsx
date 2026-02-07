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
      <main className="flex-1 overflow-auto bg-background">
        <div className="max-w-5xl mx-auto px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
