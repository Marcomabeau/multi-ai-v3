'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { QueryInput } from '@/components/QueryInput';
import { ResultCard } from '@/components/ResultCard';
import { LoadingPipeline } from '@/components/LoadingPipeline';
import { UsageLimitModal } from '@/components/UsageLimitModal';
import { AuthGuard } from '@/components/AuthGuard';
import { trackAskQuestion, trackQuerySuccess, trackQueryError } from '@/lib/utils/analytics';
import type { QueryResponse, LoadingStage, UsageStatus } from '@/types';
import type { User } from '@supabase/supabase-js';

export default function AppPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AuthGuard>
        {(user: User) => <AppContent userId={user.id} userPlan="free" />}
      </AuthGuard>
      <Footer />
    </div>
  );
}

function AppContent({ userId, userPlan }: { userId: string; userPlan: string }) {
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [resetTime, setResetTime] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/usage')
      .then((r) => r.json())
      .then((data: UsageStatus) => setUsageStatus(data))
      .catch(() => {});
  }, []);

  const handleQuery = async (question: string) => {
    setError(null);
    setResult(null);
    setLoadingStage('querying_models');
    trackAskQuestion(usageStatus?.plan ?? 'free');

    const stageTimer1 = setTimeout(() => setLoadingStage('comparing_answers'), 4000);
    const stageTimer2 = setTimeout(() => setLoadingStage('verifying_sources'), 7000);
    const stageTimer3 = setTimeout(() => setLoadingStage('generating_answer'), 10000);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);

      if (res.status === 429) {
        const data = await res.json() as { usageStatus?: UsageStatus };
        setResetTime(data.usageStatus?.windowResetsAt ?? null);
        setLoadingStage('idle');
        setShowLimitModal(true);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      const data = await res.json() as QueryResponse;
      setResult(data);
      setLoadingStage('complete');
      trackQuerySuccess(data.latencyMs, data.judgeResult.confidence_score);

      fetch('/api/usage')
        .then((r) => r.json())
        .then((u: UsageStatus) => setUsageStatus(u))
        .catch(() => {});
    } catch (err) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      setLoadingStage('idle');
      trackQueryError(message);
    }
  };

  const handleFeedback = async (rating: number) => {
    if (!result?.queryId) return;
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId: result.queryId, rating }),
      });
    } catch { /* non-critical */ }
  };

  const isLoading = loadingStage !== 'idle' && loadingStage !== 'complete' && loadingStage !== 'error';

  return (
    <>
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {usageStatus && (
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-600">
            <span>
              {usageStatus.queriesUsed} / {usageStatus.queriesLimit} queries used
              {usageStatus.plan === 'free' ? ' (2-hour window)' : ' today'}
            </span>
            <span className="capitalize">{usageStatus.plan} plan</span>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#f5f5dc] mb-6">Ask a question</h1>
          <QueryInput
            onSubmit={handleQuery}
            isLoading={isLoading}
            disabled={usageStatus?.canQuery === false}
          />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {isLoading && <LoadingPipeline stage={loadingStage} />}

        {result && !isLoading && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Question:{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">{result.question}</span>
            </p>
            <ResultCard result={result} onFeedback={handleFeedback} />
          </div>
        )}
      </main>

      <UsageLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        resetsAt={resetTime}
      />
    </>
  );
}
