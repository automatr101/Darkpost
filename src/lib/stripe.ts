import Stripe from 'stripe';

// Lazy initialization — only throws at runtime when the key is used,
// NOT at build time when Next.js statically analyzes the routes.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set. Add it to your environment variables.');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2025-01-27.acacia',
      typescript: true,
    });
  }
  return _stripe;
}

// Convenience alias used throughout the codebase
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID ?? '',
  black: process.env.STRIPE_BLACK_PRICE_ID ?? '',
};

export type StripeTier = 'pro' | 'black';

export function priceIdToTier(priceId: string): 'pro' | 'black' | null {
  if (priceId && priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  if (priceId && priceId === process.env.STRIPE_BLACK_PRICE_ID) return 'black';
  return null;
}
