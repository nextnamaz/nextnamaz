import { notFound } from 'next/navigation';
import { getScreen } from '@/lib/screens';
import { SettingsForm } from '@/components/settings/settings-form';

export const dynamic = 'force-dynamic';

interface SettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScreenSettingsPage({ params }: SettingsPageProps) {
  const { id } = await params;
  const screen = await getScreen(id);
  if (!screen) notFound();
  return <SettingsForm screen={screen} />;
}
