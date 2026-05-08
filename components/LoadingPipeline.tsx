'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/helpers';
import type { LoadingStage } from '@/types';

const STAGES: Array<{ key: LoadingStage; label: string; duration: number }> = [
  { key: 'querying_models', label: 'Querying AI models...', duration: 3000 },
  { key: 'comparing_answers', label: 'Comparing answers...', duration: 2000 },
  { key: 'verifying_sources', label: 'Verifying sources...', duration: 2000 },
  { key: 'generating_answer', label: 'Generating best verified answer...', duration: 1500 },
];

const PROVIDERS = ['OpenAI', 'Gemini', 'Claude', 'Perplexity', 'Llama'];

interface Props {
  stage: LoadingStage;
}

export function LoadingPipeline({ stage }: Props) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const stageIndex = STAGES.findIndex((s) => s.key === stage);
    if (stageIndex >= 0) setActiveStageIndex(stageIndex);
  }, [stage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card card-shadow p-6 sm:p-8 animate-fade-in space-y-6">
      {/* Provider pills */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Querying
        </p>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((name, i) => (
            <div
              key={name}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-500',
                activeStageIndex === 0
                  ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                  : activeStageIndex > 0
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                  : 'border-gray-200 dark:border-[#2a2a2e] text-gray-500 dark:text-gray-400'
              )}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {name}
              {activeStageIndex > 0 && ' ✓'}
            </div>
          ))}
        </div>
      </div>

      {/* Stage progress */}
      <div className="space-y-3">
        {STAGES.map((s, i) => {
          const isPast = i < activeStageIndex;
          const isActive = i === activeStageIndex;
          const isFuture = i > activeStageIndex;

          return (
            <div
              key={s.key}
              className={cn(
                'flex items-center gap-3 transition-all duration-300',
                isFuture && 'opacity-30'
              )}
            >
              {/* Indicator */}
              <div
                className={cn(
                  'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                  isPast && 'border-emerald-500 bg-emerald-500',
                  isActive && 'border-blue-500 bg-blue-500',
                  isFuture && 'border-gray-300 dark:border-gray-700'
                )}
              >
                {isPast && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-sm transition-colors',
                  isPast && 'text-emerald-600 dark:text-emerald-400',
                  isActive && 'text-blue-600 dark:text-blue-400 font-medium',
                  isFuture && 'text-gray-400 dark:text-gray-600'
                )}
              >
                {s.label}
                {isActive && <span className="ml-0.5">{dots}</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pulsing bar */}
      <div className="h-0.5 bg-gray-100 dark:bg-[#1f1f23] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${((activeStageIndex + 1) / STAGES.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Skeleton cards ─────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="card card-shadow p-6 space-y-4 animate-pulse">
      <div className="skeleton h-4 w-1/3 rounded" />
      <div className="space-y-2">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-5/6 rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
      </div>
    </div>
  );
}
