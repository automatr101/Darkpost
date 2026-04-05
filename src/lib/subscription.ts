import { createClient } from '@/utils/supabase/server';

export type Tier = 'free' | 'pro' | 'black';

// Tier order for comparison
const TIER_LEVEL: Record<Tier, number> = {
  free: 0,
  pro: 1,
  black: 2,
};

/**
 * Returns the active subscription tier for a user.
 * Defaults to 'free' if no active subscription found.
 */
export async function getUserTier(userId: string): Promise<Tier> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .single();

    if (!data || data.status !== 'active') return 'free';
    return (data.tier as Tier) || 'free';
  } catch {
    return 'free';
  }
}

/**
 * Returns true if the user's tier meets or exceeds the feature's min_tier.
 */
export async function hasFeature(userId: string, feature: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const [tier, { data: gate }] = await Promise.all([
      getUserTier(userId),
      supabase.from('feature_gates').select('min_tier').eq('feature', feature).single(),
    ]);

    if (!gate) return false; // feature not found → deny
    const userLevel = TIER_LEVEL[tier] ?? 0;
    const requiredLevel = TIER_LEVEL[gate.min_tier as Tier] ?? 99;
    return userLevel >= requiredLevel;
  } catch {
    return false;
  }
}

/**
 * Throws 'UPGRADE_REQUIRED' if the user doesn't have the feature.
 * Catch this in API routes and return HTTP 403.
 */
export async function requireFeature(userId: string, feature: string): Promise<void> {
  const allowed = await hasFeature(userId, feature);
  if (!allowed) throw new Error('UPGRADE_REQUIRED');
}

/**
 * Helper: get both tier and subscription details for settings page.
 */
export async function getSubscriptionDetails(userId: string) {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('subscriptions')
      .select('tier, status, current_period_end, cancel_at_period_end, stripe_customer_id')
      .eq('user_id', userId)
      .single();
    return data;
  } catch {
    return null;
  }
}
