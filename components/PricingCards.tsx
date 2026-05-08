'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { trackUpgradeClick } from '@/lib/utils/analytics';
import { Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying MULTI Ai',
    priceId: null,
    features: [
      '2 questions per 2 hours',
      'Best verified answer',
      'Basic confidence score',
      'Limited history (7 days)',
    ],
    limitations: ['No source trail', 'No raw model answers', 'No export'],
    cta: 'Get started free',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'For researchers and knowledge workers',
    priceId: process.env["NEXT_PUBLIC_STRIPE_PRO_PRICE_ID"],
    features: [
      '200 questions per day',
      'Best verified answer',
      'Full confidence score & reason',
      'Full source trail',
      'Raw answers from all 5 models',
      'Contradiction detection',
      'Query history (90 days)',
      'Export results',
      'Priority processing',
    ],
    limitations: [],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    id: 'pro_max',
    name: 'Pro Max',
    price: '$49',
    period: 'per month',
    description: 'For power users and teams',
    priceId: process.env["NEXT_PUBLIC_STRIPE_PRO_MAX_PRICE_ID"],
    features: [
      '1,000 questions per day',
      'Everything in Pro',
      'Longer questions (up to 8,000 chars)',
      'Advanced source trail',
      'Team workspace (coming soon)',
      'API access (coming soon)',
      'Unlimited history',
    ],
    limitations: [],
    cta: 'Upgrade to Pro Max',
    highlight: false,
  },
];

export function PricingCards({ currentPlan = 'free' }: { currentPlan?: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleUpgrade = async (plan: typeof PLANS[0]) => {
    if (!plan.priceId) {
      router.push('/login?mode=signup');
      return;
    }

    trackUpgradeClick(`pricing_page_${plan.id}`);
    setLoading(plan.id);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to start checkout. Please try again.');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {PLANS.map((plan) => {
        const isCurrent = currentPlan === plan.id;

        return (
          <div
            key={plan.id}
            className={cn(
              'relative card card-shadow p-6 flex flex-col',
              plan.highlight && 'ring-2 ring-blue-500 dark:ring-blue-600'
            )}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 text-xs font-semibold text-white rounded-full brand-gradient">
                  Most popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-[#f5f5dc]">{plan.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900 dark:text-[#f5f5dc]">{plan.price}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-2.5 flex-1 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan)}
              disabled={isCurrent || !!loading}
              className={cn(
                'w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200',
                isCurrent
                  ? 'bg-gray-100 dark:bg-[#1a1a1e] text-gray-500 dark:text-gray-500 cursor-default'
                  : plan.highlight
                  ? 'btn-primary justify-center'
                  : 'btn-secondary justify-center'
              )}
            >
              {loading === plan.id ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Redirecting...
                </div>
              ) : isCurrent ? (
                'Current plan'
              ) : (
                plan.cta
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
