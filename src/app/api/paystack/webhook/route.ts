import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createHmac } from 'crypto';

// Paystack webhook signature verification
function verifyPaystackSignature(body: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;
  const hash = createHmac('sha512', secret).update(body).digest('hex');
  return hash === signature;
}

type PaystackEvent = {
  event: string;
  data: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  // CRITICAL: raw text body for signature verification
  const body = await request.text();
  const signature = request.headers.get('x-paystack-signature') || '';

  if (!verifyPaystackSignature(body, signature)) {
    console.error('[Paystack Webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    switch (event.event) {
      // Subscription successfully created (first payment)
      case 'subscription.create': {
        const data = event.data;
        const customer = data.customer as Record<string, string>;
        const plan = data.plan as Record<string, string>;
        const userId = (data.metadata as Record<string, string>)?.user_id
          || await getUserIdByEmail(supabase, customer.email);

        if (!userId) {
          console.error('[Paystack Webhook] Could not resolve user_id for email', customer.email);
          break;
        }

        const planCode = plan.plan_code as string;
        const tier = planCode === process.env.PAYSTACK_PRO_PLAN_CODE ? 'pro' : 'black';

        const nextCharge = data.next_payment_date as string;

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          tier,
          status: 'active',
          payment_provider: 'paystack',
          paystack_customer_code: customer.customer_code,
          paystack_subscription_code: data.subscription_code as string,
          current_period_start: new Date().toISOString(),
          current_period_end: nextCharge ? new Date(nextCharge).toISOString() : null,
        }, { onConflict: 'user_id' });
        break;
      }

      // Recurring charge succeeded
      case 'invoice.payment': {
        const data = event.data;
        const subscription = data.subscription as Record<string, unknown>;
        const subscriptionCode = subscription?.subscription_code as string;
        if (!subscriptionCode) break;

        const nextCharge = data.paid_at as string;
        await supabase.from('subscriptions')
          .update({
            status: 'active',
            current_period_end: nextCharge ? new Date(nextCharge).toISOString() : null,
          })
          .eq('paystack_subscription_code', subscriptionCode);
        break;
      }

      // Subscription disabled/cancelled
      case 'subscription.not_renew':
      case 'subscription.disable': {
        const data = event.data;
        const subscriptionCode = data.subscription_code as string;
        if (!subscriptionCode) break;

        await supabase.from('subscriptions')
          .update({ status: 'cancelled', tier: 'free' })
          .eq('paystack_subscription_code', subscriptionCode);
        break;
      }

      // Payment failed
      case 'charge.failed': {
        const data = event.data;
        const customer = data.customer as Record<string, string>;
        await supabase.from('subscriptions')
          .update({ status: 'past_due' })
          .eq('paystack_customer_code', customer.customer_code);
        break;
      }

      default:
        console.log(`[Paystack Webhook] Unhandled event: ${event.event}`);
    }
  } catch (err) {
    console.error('[Paystack Webhook] Handler error:', err);
    // Always 200 to Paystack
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

// Fallback: look up user_id by email if metadata is missing
async function getUserIdByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string
): Promise<string | null> {
  if (!email) return null;
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  return data?.id ?? null;
}
