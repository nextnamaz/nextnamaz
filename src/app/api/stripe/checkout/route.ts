import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, PLANS } from '@/lib/stripe';
import type { PlanId, BillingInterval } from '@/lib/stripe';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as { plan: PlanId; interval: BillingInterval };
  const { plan, interval } = body;

  if (!PLANS[plan] || !['month', 'year'].includes(interval)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Get profile for existing stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Create or reuse Stripe customer
  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const selectedPlan = PLANS[plan];
  const price = interval === 'year' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: price,
          recurring: { interval },
          product_data: {
            name: `NextNamaz ${selectedPlan.name}`,
            description: selectedPlan.description,
          },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: selectedPlan.trialDays,
      metadata: { user_id: user.id, plan },
    },
    metadata: { user_id: user.id, plan },
    success_url: `${request.headers.get('origin')}/admin/billing?status=success`,
    cancel_url: `${request.headers.get('origin')}/admin/billing?status=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
