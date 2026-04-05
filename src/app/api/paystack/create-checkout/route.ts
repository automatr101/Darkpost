import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const PAYSTACK_API = 'https://api.paystack.co';

// GHS pricing in kobo (pesewas) — 1 GHS = 100 pesewas
const PAYSTACK_AMOUNTS = {
  pro: 4500,    // GHS 45
  black: 10500, // GHS 105
};

// Plan codes from Paystack dashboard
const PAYSTACK_PLAN_CODES = {
  pro: process.env.PAYSTACK_PRO_PLAN_CODE!,
  black: process.env.PAYSTACK_BLACK_PLAN_CODE!,
};

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

  const planCode = PAYSTACK_PLAN_CODES[tier];
  if (!planCode) {
    return NextResponse.json({ error: 'Paystack plan not configured.' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://darkpost.vercel.app';

  // Initialize Paystack transaction
  const paystackRes = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: PAYSTACK_AMOUNTS[tier],
      plan: planCode,
      currency: 'GHS',
      callback_url: `${appUrl}/settings?upgraded=true`,
      metadata: {
        user_id: user.id,
        tier,
        cancel_action: `${appUrl}/pricing`,
      },
    }),
  });

  if (!paystackRes.ok) {
    const errorData = await paystackRes.json();
    console.error('[Paystack] Initialize failed:', errorData);
    return NextResponse.json({ error: 'Failed to initialize Paystack payment.' }, { status: 500 });
  }

  const { data } = await paystackRes.json();

  // Store paystack customer association early
  await supabase.from('subscriptions').upsert({
    user_id: user.id,
    tier: 'free',
    status: 'active',
    payment_provider: 'paystack',
  }, { onConflict: 'user_id', ignoreDuplicates: true });

  return NextResponse.json({ url: data.authorization_url });
}
