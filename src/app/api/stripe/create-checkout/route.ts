import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { tier } = body as { tier: 'pro' | 'black' };

  if (!tier || !['pro', 'black'].includes(tier)) {
    return NextResponse.json({ error: 'Invalid tier.' }, { status: 400 });
  }

  const priceId = STRIPE_PRICE_IDS[tier];
  if (!priceId) {
    return NextResponse.json({ error: 'Price not configured.' }, { status: 500 });
  }

  // Get or create Stripe customer
  let stripeCustomerId: string | undefined;
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (sub?.stripe_customer_id) {
    stripeCustomerId = sub.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    stripeCustomerId = customer.id;

    // Store it immediately so we don't create duplicates
    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: stripeCustomerId,
      tier: 'free',
      status: 'active',
    }, { onConflict: 'user_id' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://darkpost.vercel.app';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?upgraded=true`,
    cancel_url: `${appUrl}/pricing`,
    metadata: { user_id: user.id },
    subscription_data: {
      metadata: { user_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
