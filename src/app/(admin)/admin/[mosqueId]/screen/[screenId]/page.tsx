import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ScreenEditor } from '@/components/admin/screen-editor';

interface PageProps {
  params: Promise<{ mosqueId: string; screenId: string }>;
}

export default async function ScreenPage({ params }: PageProps) {
  const { mosqueId, screenId } = await params;
  const supabase = await createClient();

  const { data: screen } = await supabase
    .from('screens')
    .select('*')
    .eq('id', screenId)
    .eq('mosque_id', mosqueId)
    .single();

  if (!screen) notFound();

  return <ScreenEditor screen={screen} mosqueId={mosqueId} />;
}
