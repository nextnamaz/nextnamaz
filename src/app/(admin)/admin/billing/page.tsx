'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Check, CreditCard, Building2, Monitor, CalendarDays, ExternalLink } from 'lucide-react';
import { PLANS, formatPrice } from '@/lib/plans';
import type { PlanId, BillingInterval } from '@/lib/plans';

interface ProfileData {
  subscription_status: string | null;
  subscription_plan: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

interface UsageData {
  mosqueCount: number;
  screenCount: number;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-green-500/10 text-green-700 border-green-200' },
    trialing: { label: 'Trial', className: 'bg-blue-500/10 text-blue-700 border-blue-200' },
    past_due: { label: 'Past Due', className: 'bg-red-500/10 text-red-700 border-red-200' },
    canceled: { label: 'Canceled', className: 'bg-neutral-500/10 text-neutral-600 border-neutral-200' },
  };
  const s = map[status] ?? { label: status, className: '' };
  return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
}

export default function BillingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [usage, setUsage] = useState<UsageData>({ mosqueCount: 0, screenCount: 0 });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserEmail(user.email ?? null);

    // Load profile + usage in parallel
    const [profileRes, membershipsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('subscription_status, subscription_plan, trial_ends_at, subscription_ends_at, stripe_subscription_id, stripe_customer_id')
        .eq('id', user.id)
        .single(),
      supabase
        .from('mosque_members')
        .select('mosque_id, mosques(id, screens(count))')
        .eq('user_id', user.id),
    ]);

    setProfile(profileRes.data);

    if (membershipsRes.data) {
      let screens = 0;
      const mosques = membershipsRes.data.length;
      for (const m of membershipsRes.data) {
        const mosque = m.mosques as unknown as { id: string; screens: { count: number }[] };
        screens += mosque?.screens?.[0]?.count ?? 0;
      }
      setUsage({ mosqueCount: mosques, screenCount: screens });
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCheckout = async (plan: PlanId, interval: BillingInterval) => {
    setCheckoutLoading(`${plan}-${interval}`);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, interval }),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (data.url) window.location.href = data.url;
    setCheckoutLoading(null);
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json() as { url?: string; error?: string };
    if (data.url) window.location.href = data.url;
    setPortalLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const status = profile?.subscription_status ?? 'trialing';
  const currentPlan = profile?.subscription_plan as PlanId | null;
  const planInfo = currentPlan ? PLANS[currentPlan] : null;
  const hasStripe = !!profile?.stripe_subscription_id;
  const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const subEnd = profile?.subscription_ends_at ? new Date(profile.subscription_ends_at) : null;
  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const maxScreens = planInfo?.maxScreens ?? 1;
  const maxMosques = planInfo?.maxMosques ?? 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => router.push('/admin')}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
        </div>

        <div className="space-y-6">
          {/* Account overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Subscription</CardTitle>
                  <CardDescription>{userEmail}</CardDescription>
                </div>
                <StatusBadge status={status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan + billing info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Plan</p>
                  <p className="text-sm font-semibold mt-0.5">{planInfo?.name ?? 'Personal'}</p>
                </div>
                {status === 'trialing' && daysLeft !== null && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Trial ends</p>
                    <p className="text-sm font-semibold mt-0.5">{daysLeft} days</p>
                  </div>
                )}
                {status === 'active' && subEnd && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Next billing</p>
                    <p className="text-sm font-semibold mt-0.5">{subEnd.toLocaleDateString()}</p>
                  </div>
                )}
                {status === 'canceled' && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Access until</p>
                    <p className="text-sm font-semibold mt-0.5">{subEnd?.toLocaleDateString() ?? '—'}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Usage */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
                  <Building2 className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold">
                      {usage.mosqueCount}{maxMosques !== Infinity ? ` / ${maxMosques}` : ''} mosques
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {maxMosques === Infinity ? 'Unlimited' : `${Math.max(0, maxMosques - usage.mosqueCount)} remaining`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
                  <Monitor className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold">
                      {usage.screenCount}{maxScreens !== Infinity ? ` / ${maxScreens}` : ''} screens
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {maxScreens === Infinity ? 'Unlimited' : `${Math.max(0, maxScreens - usage.screenCount)} remaining`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {hasStripe && (
                <>
                  <Separator />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePortal}
                      disabled={portalLoading}
                    >
                      <CreditCard className="size-3.5 mr-1.5" />
                      {portalLoading ? 'Opening...' : 'Payment Method'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePortal}
                      disabled={portalLoading}
                    >
                      <CalendarDays className="size-3.5 mr-1.5" />
                      Invoices
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePortal}
                      disabled={portalLoading}
                      className="text-destructive hover:text-destructive"
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Plan cards */}
          <div>
            <h2 className="text-sm font-semibold mb-3">
              {hasStripe ? 'Change Plan' : 'Choose a Plan'}
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {(Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).map(([id, plan]) => {
                const isCurrentPlan = currentPlan === id && (status === 'active' || status === 'trialing');
                return (
                  <Card key={id} className={`relative ${id === 'mosque' ? 'border-primary shadow-md' : ''} ${isCurrentPlan ? 'bg-muted/30' : ''}`}>
                    {id === 'mosque' && (
                      <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px]">
                        Popular
                      </Badge>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{plan.name}</CardTitle>
                        {isCurrentPlan && <Badge variant="secondary" className="text-[10px]">Current</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-2xl font-bold">${plan.monthlyPrice / 100}</span>
                        <span className="text-sm text-muted-foreground">/mo</span>
                      </div>

                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li className="flex items-center gap-1.5">
                          <Check className="size-3 text-primary shrink-0" />
                          {plan.maxScreens === Infinity ? 'Unlimited screens' : `${plan.maxScreens} screen${plan.maxScreens > 1 ? 's' : ''}`}
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check className="size-3 text-primary shrink-0" />
                          {plan.maxMosques === Infinity ? 'Unlimited mosques' : `${plan.maxMosques} mosque${plan.maxMosques > 1 ? 's' : ''}`}
                        </li>
                        {id === 'pro' && (
                          <li className="flex items-center gap-1.5">
                            <Check className="size-3 text-primary shrink-0" />
                            Priority support
                          </li>
                        )}
                      </ul>

                      {!isCurrentPlan && (
                        <div className="grid gap-1.5 pt-1">
                          <Button
                            size="sm"
                            variant={id === 'mosque' ? 'default' : 'outline'}
                            className="w-full h-8 text-xs"
                            onClick={() => handleCheckout(id, 'month')}
                            disabled={checkoutLoading !== null}
                          >
                            {checkoutLoading === `${id}-month` ? 'Redirecting...' : formatPrice(plan.monthlyPrice, 'month')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full h-7 text-[11px]"
                            onClick={() => handleCheckout(id, 'year')}
                            disabled={checkoutLoading !== null}
                          >
                            {checkoutLoading === `${id}-year` ? 'Redirecting...' : `${formatPrice(plan.yearlyPrice, 'year')} (save ~18%)`}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
