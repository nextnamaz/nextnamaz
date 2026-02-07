import { redirect } from 'next/navigation';

interface IqamahPageProps {
  params: Promise<{ mosqueId: string }>;
}

export default async function IqamahPage({ params }: IqamahPageProps) {
  const { mosqueId } = await params;
  redirect(`/admin/${mosqueId}/prayer-times`);
}
