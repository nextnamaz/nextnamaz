export const PLANS = {
  personal: {
    name: 'Personal',
    monthlyPrice: 300,
    yearlyPrice: 2900,
    trialDays: 14,
    maxScreens: 1,
    maxMosques: 1,
    description: 'For home prayer displays',
  },
  mosque: {
    name: 'Mosque',
    monthlyPrice: 900,
    yearlyPrice: 8900,
    trialDays: 14,
    maxScreens: 3,
    maxMosques: 1,
    description: 'For small-medium mosques',
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 1900,
    yearlyPrice: 18900,
    trialDays: 14,
    maxScreens: Infinity,
    maxMosques: Infinity,
    description: 'For large mosques & organizations',
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type BillingInterval = 'month' | 'year';

export function getPlanPrice(plan: PlanId, interval: BillingInterval): number {
  return interval === 'year' ? PLANS[plan].yearlyPrice : PLANS[plan].monthlyPrice;
}

export function formatPrice(cents: number, interval: BillingInterval): string {
  return `$${cents / 100}/${interval === 'year' ? 'yr' : 'mo'}`;
}
