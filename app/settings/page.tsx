'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthGuard } from '@/components/AuthGuard';
import { PricingCards } from '@/components/PricingCards';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils/helpers';
import type { Profile, UsageStatus } from '@/types';
import type { User } from '@supabase/supabase-js';
import { CheckCircle, CreditCard, User as UserIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AuthGuard>
        {(user: User) => <SettingsContent userId={user.id} email={user.email ?? ''} />}
      </AuthGuard>
      <Footer />
    </div>
  );
}

function SettingsContent({ userId, email }: { userId: string; email: string }) {
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get('checkout');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'account' | 'billing'>('account');

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      fetch('/api/usage').then((r) => r.json() as Promise<UsageStatus>),
    ]).then(([{ data }, usageData]) => {
      setProfile(data as Profile | null);
      setUsage(usageData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </main>
    );
  }

  const tabs = [
    { key: 'account' as const, label: 'Account', icon: UserIcon },
    { key: 'billing' as const, label: 'Billing', icon: CreditCard },
  ];

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-[#f5f5dc] mb-8">Settings</h1>

      {checkoutStatus === 'success' && (
        <div className="flex items-start gap-3 px-4 py-3 mb-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Subscription activated!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Your Pro plan is now active.</p>
          </div>
        </div>
      )}

      <div className="flex gap-4 border-b border-gray-100 dark:border-[#1a1a1e] mb-8">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 pb-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="card card-shadow p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-[#f5f5dc] mb-4">Account information</h2>
            <div className="space-y-3">
              {[
                { label: 'Email', value: email },
                { label: 'Plan', value: profile?.plan ?? 'Free' },
                { label: 'Member since', value: profile?.created_at ? formatDate(profile.created_at) : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {usage && (
            <div className="card card-shadow p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-[#f5f5dc] mb-4">Current usage</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Queries used</span>
                  <span className="font-medium text-gray-900 dark:text-[#f5f5dc]">{usage.queriesUsed} / {usage.queriesLimit}</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-[#1f1f23] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min((usage.queriesUsed / usage.queriesLimit) * 100, 100)}%` }}
                  />
                </div>
                {usage.windowResetsAt && (
                  <p className="text-xs text-gray-400 dark:text-gray-600">
                    Resets at {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(usage.windowResetsAt))}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="card card-shadow p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-[#f5f5dc] mb-2">Current subscription</h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-[#f5f5dc] capitalize">
                {profile?.plan ?? 'Free'}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                profile?.subscription_status === 'active'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1a1a1e]'
              }`}>
                {profile?.subscription_status ?? 'inactive'}
              </span>
            </div>
          </div>

          {profile?.plan === 'free' && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-[#f5f5dc] mb-4">Upgrade your plan</h2>
              <PricingCards currentPlan={profile?.plan ?? 'free'} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
