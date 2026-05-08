import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { jsonResponse, errorResponse } from '@/lib/utils/helpers';

export const runtime = 'nodejs';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set.');
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

export async function POST(req: NextRequest) {
  // Auth
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse('Unauthorized.', 401);
  }

  let body: { priceId?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body.');
  }

  const priceId = body.priceId;
  const validPrices = [
    process.env.STRIPE_PRO_PRICE_ID,
    process.env.STRIPE_PRO_MAX_PRICE_ID,
  ].filter(Boolean);

  if (!priceId || !validPrices.includes(priceId)) {
    return errorResponse('Invalid price ID.');
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Get or create Stripe customer
  const adminSupabase = createAdminSupabaseClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await adminSupabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=canceled`,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
    allow_promotion_codes: true,
  });

  return jsonResponse({ url: session.url });
}
