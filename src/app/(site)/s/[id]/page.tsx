import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getScreen } from '@/lib/screens';
import { isUnlocked } from '@/lib/pin';
import { SettingsForm } from '@/components/settings/settings-form';
import { PinGate } from '@/components/settings/pin-gate';
import { NOINDEX_METADATA } from '@/lib/site';

export const dynamic = 'force-dynamic';

// This URL is the screen's password; never let it into an index.
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

  const store = await cookies();
  if (!isUnlocked(id, screen.pin, (name) => store.get(name)?.value)) {
    return <PinGate id={id} />;
  }

  // The hash stays on the server; the form only needs to know one exists.
  return <SettingsForm screen={{ ...screen, pin: null }} hasPin={screen.pin !== null} />;
}
