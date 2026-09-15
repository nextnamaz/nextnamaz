import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScreen } from '@/lib/screens';
import { SettingsForm } from '@/components/settings/settings-form';
import { NOINDEX_METADATA } from '@/lib/site';

export const dynamic = 'force-dynamic';

// This URL is the screen's password — never let it into an index.
export const metadata: Metadata = {
  title: 'Screen settings',
  ...NOINDEX_METADATA,
};

interface SettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScreenSettingsPage({ params }: SettingsPageProps) {
  const { id } = await params;
  const screen = await getScreen(id);
  if (!screen) notFound();
  return <SettingsForm screen={screen} />;
}
