export const PLANS = {
  monthly: {
    price: 500, // $5.00
    interval: 'month' as const,
    trialDays: 90,
    label: '$5/month',
  },
  yearly: {
    price: 4900, // $49.00
    interval: 'year' as const,
    trialDays: 90,
    label: '$49/year',
  },
} as const;

export type PlanId = keyof typeof PLANS;
