import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import type { Plan, SubscriptionStatus } from '@/types';

export const runtime = 'nodejs';

// Raw body is needed for Stripe signature verification
export const dynamic = 'force-dynamic';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set.');
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Partial<Record<Stripe.Subscription.Status, SubscriptionStatus>> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    incomplete: 'inactive',
    incomplete_expired: 'inactive',
    paused: 'inactive',
  };
  return map[status] ?? 'inactive';
}

function determinePlan(priceId: string | undefined): Plan {
  if (priceId === process.env.STRIPE_PRO_MAX_PRICE_ID) return 'pro_max';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  return 'free';
}

async function updateUserSubscription(
  supabaseUserId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const adminSupabase = createAdminSupabaseClient();

  const priceId = subscription.items.data[0]?.price.id;
  const plan = determinePlan(priceId);
  const subscriptionStatus = mapSubscriptionStatus(subscription.status);

  // If subscription is active/trialing, set plan. Otherwise downgrade to free.
  const effectivePlan: Plan =
    subscription.status === 'active' || subscription.status === 'trialing'
      ? plan
      : 'free';

  const { error } = await adminSupabase
    .from('profiles')
    .update({
      plan: effectivePlan,
      subscription_id: subscription.id,
      subscription_status: subscriptionStatus,
      stripe_customer_id: subscription.customer as string,
    })
    .eq('id', supabaseUserId);

  if (error) {
    throw new Error(`Failed to update profile for ${supabaseUserId}: ${error.message}`);
  }
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set.');
    return new Response('Webhook secret not configured.', { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header.', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe webhook] Signature verification failed:', message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  console.log('[Stripe webhook] Received event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId || !session.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await updateUserSubscription(userId, subscription);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) {
          // Try to find user by stripe customer ID
          const adminSupabase = createAdminSupabaseClient();
          const { data: profile } = await adminSupabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', subscription.customer as string)
            .single();
          if (profile?.id) {
            await updateUserSubscription(profile.id, subscription);
          }
          break;
        }
        await updateUserSubscription(userId, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const adminSupabase = createAdminSupabaseClient();
        const { data: profile } = await adminSupabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (profile?.id) {
          await adminSupabase
            .from('profiles')
            .update({
              plan: 'free',
              subscription_id: null,
              subscription_status: 'canceled',
            })
            .eq('id', profile.id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const adminSupabase = createAdminSupabaseClient();
        const { data: profile } = await adminSupabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single();

        if (profile?.id) {
          await adminSupabase
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('id', profile.id);
        }
        break;
      }

      default:
        // Unhandled event types — safe to ignore
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Handler error';
    console.error(`[Stripe webhook] Handler error for ${event.type}:`, message);
    // Return 200 to prevent Stripe retries for non-critical errors
    // Return 500 only for critical failures that need retry
    return new Response(`Handler error: ${message}`, { status: 500 });
  }

  return new Response('OK', { status: 200 });
}
