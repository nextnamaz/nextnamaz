import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Re-export plans for server-side convenience
export { PLANS, type PlanId, type BillingInterval } from './plans';
