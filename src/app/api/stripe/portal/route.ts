import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as { mosqueId: string };
  const { mosqueId } = body;

  // Verify user owns/admins this mosque
  const { data: member } = await supabase
    .from('mosque_members')
    .select('role')
    .eq('mosque_id', mosqueId)
    .eq('user_id', user.id)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: mosque } = await supabase
    .from('mosques')
    .select('stripe_customer_id')
    .eq('id', mosqueId)
    .single();

  if (!mosque?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: mosque.stripe_customer_id,
    return_url: `${request.headers.get('origin')}/admin/${mosqueId}`,
  });

  return NextResponse.json({ url: session.url });
}
