import { NextRequest, NextResponse } from 'next/server';
import { stripe, priceIdToTier } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

// CRITICAL: Must use raw text body for Stripe signature verification
export async function POST(request: NextRequest) {
  const body = await request.text(); // ← raw text, NOT request.json()
  const sig = request.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe Webhook] Signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (!userId || !session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0]?.price.id;
        const tier = priceIdToTier(priceId) || 'pro';

        // Check OG badge eligibility (first 1,000 Black subscribers)
        let isOg = false;
        if (tier === 'black') {
          const { count } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('tier', 'black')
            .eq('status', 'active');
          isOg = (count || 0) < 1000;
        }

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          tier,
          status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          current_period_start: new Date(((subscription as unknown as Record<string, number>).current_period_start) * 1000).toISOString(),
          current_period_end: new Date(((subscription as unknown as Record<string, number>).current_period_end) * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          is_og: isOg,
        }, { onConflict: 'user_id' });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        const priceId = subscription.items.data[0]?.price.id;
        const tier = priceIdToTier(priceId) || 'pro';

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          tier,
          status: subscription.status === 'active' ? 'active' : subscription.status as string,
          stripe_subscription_id: subscription.id,
          current_period_start: new Date(((subscription as unknown as Record<string, number>).current_period_start) * 1000).toISOString(),
          current_period_end: new Date(((subscription as unknown as Record<string, number>).current_period_end) * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }, { onConflict: 'user_id' });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        await supabase.from('subscriptions')
          .update({ status: 'cancelled', tier: 'free' })
          .eq('user_id', userId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase.from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_customer_id', customerId);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err);
    // Always return 200 to Stripe even on internal errors
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
