import { redirect } from 'next/navigation';

interface SettingsPageProps {
  params: Promise<{ mosqueId: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { mosqueId } = await params;
  redirect(`/admin/${mosqueId}/prayer-times`);
}
