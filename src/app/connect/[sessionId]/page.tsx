import { ScreenSelector } from '@/components/pairing/screen-selector';

interface PairPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function PairPage({ params }: PairPageProps) {
  const { sessionId } = await params;

  return <ScreenSelector sessionId={sessionId} />;
}
