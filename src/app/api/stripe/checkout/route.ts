import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, PLANS } from '@/lib/stripe';
import type { PlanId } from '@/lib/stripe';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as { mosqueId: string; plan: PlanId };
  const { mosqueId, plan } = body;

  if (!mosqueId || !PLANS[plan]) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

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

  // Get mosque for existing stripe customer
  const { data: mosque } = await supabase
    .from('mosques')
    .select('id, name, stripe_customer_id')
    .eq('id', mosqueId)
    .single();

  if (!mosque) {
    return NextResponse.json({ error: 'Mosque not found' }, { status: 404 });
  }

  // Create or reuse Stripe customer
  let customerId = mosque.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { mosque_id: mosqueId, user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from('mosques')
      .update({ stripe_customer_id: customerId })
      .eq('id', mosqueId);
  }

  const selectedPlan = PLANS[plan];

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: selectedPlan.price,
          recurring: { interval: selectedPlan.interval },
          product_data: {
            name: `NextNamaz ${plan === 'yearly' ? 'Yearly' : 'Monthly'}`,
            description: `Prayer display subscription for ${mosque.name}`,
          },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: selectedPlan.trialDays,
      metadata: { mosque_id: mosqueId },
    },
    metadata: { mosque_id: mosqueId },
    success_url: `${request.headers.get('origin')}/admin/${mosqueId}?billing=success`,
    cancel_url: `${request.headers.get('origin')}/admin/${mosqueId}?billing=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
