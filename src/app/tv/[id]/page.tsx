import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getScreen } from '@/lib/screens';
import { resolveTodayTimes } from '@/lib/prayer-times';
import { TvDisplay } from '@/components/display/tv-display';

export const dynamic = 'force-dynamic';

interface TvPageProps {
  params: Promise<{ id: string }>;
}

export default async function TvPage({ params }: TvPageProps) {
  const { id } = await params;
  const screen = await getScreen(id);
  // Unknown id (e.g. deleted screen) → back to setup, which clears the
  // stale id from localStorage and offers a fresh start.
  if (!screen) redirect('/s?stale=1');

  const todayTimes = await resolveTodayTimes(screen);
  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return (
    <TvDisplay
      screen={screen}
      todayTimes={todayTimes}
      settingsUrl={`${proto}://${host}/s/${screen.id}`}
    />
  );
}
