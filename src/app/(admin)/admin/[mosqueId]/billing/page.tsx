'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PLANS } from '@/lib/plans';
import type { PlanId } from '@/lib/plans';

interface MosqueSubscription {
  subscription_status: string | null;
  subscription_plan: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  stripe_subscription_id: string | null;
}

export default function BillingPage() {
  const { mosqueId } = useParams<{ mosqueId: string }>();
  const [subscription, setSubscription] = useState<MosqueSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('mosques')
        .select('subscription_status, subscription_plan, trial_ends_at, subscription_ends_at, stripe_subscription_id')
        .eq('id', mosqueId)
        .single();
      setSubscription(data);
      setLoading(false);
    }
    load();
  }, [mosqueId]);

  const handleCheckout = async (plan: PlanId) => {
    setCheckoutLoading(plan);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mosqueId, plan }),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (data.url) {
      window.location.href = data.url;
    }
    setCheckoutLoading(null);
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mosqueId }),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (data.url) {
      window.location.href = data.url;
    }
    setPortalLoading(false);
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  const status = subscription?.subscription_status ?? 'trialing';
  const hasActiveSubscription = status === 'active' || status === 'trialing';
  const trialEnd = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at)
    : null;
  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription</p>
      </div>

      {/* Current status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            {status === 'trialing' && daysLeft !== null && (
              <>Free trial &mdash; {daysLeft} days remaining</>
            )}
            {status === 'active' && 'Active subscription'}
            {status === 'past_due' && 'Payment past due — please update your payment method'}
            {status === 'canceled' && 'Subscription canceled'}
          </CardDescription>
        </CardHeader>
        {subscription?.stripe_subscription_id && (
          <CardContent>
            <Button variant="outline" onClick={handlePortal} disabled={portalLoading}>
              {portalLoading ? 'Opening...' : 'Manage Subscription'}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Plan selection */}
      {(!hasActiveSubscription || status === 'trialing') && (
        <div className="grid sm:grid-cols-2 gap-4">
          {(Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).map(([id, plan]) => (
            <Card key={id} className={id === 'yearly' ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {id === 'monthly' ? 'Monthly' : 'Yearly'}
                  {id === 'yearly' && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Save 18%
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {plan.label}
                  {status === 'trialing' && ' — starts after trial ends'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  ${plan.price / 100}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{plan.interval}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.trialDays}-day free trial included
                </p>
                <Button
                  className="w-full"
                  variant={id === 'yearly' ? 'default' : 'outline'}
                  onClick={() => handleCheckout(id)}
                  disabled={checkoutLoading !== null}
                >
                  {checkoutLoading === id ? 'Redirecting...' : `Choose ${id === 'yearly' ? 'Yearly' : 'Monthly'}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
