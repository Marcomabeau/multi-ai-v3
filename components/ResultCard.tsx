'use client';

import { useState } from 'react';
import { ConfidenceBadge, ConfidenceBar } from './ConfidenceBadge';
import { SourceTrail } from './SourceTrail';
import { ContradictionList } from './ContradictionList';
import { UnsupportedClaimsList } from './UnsupportedClaimsList';
import { RawAnswerGrid } from './RawAnswerGrid';
import { cn } from '@/lib/utils/helpers';
import type { QueryResponse } from '@/types';
import {
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface Props {
  result: QueryResponse;
  onFeedback?: (rating: number) => void;
}

export function ResultCard({ result, onFeedback }: Props) {
  const [showDetails, setShowDetails] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<number | null>(null);

  const { judgeResult, providerResponses } = result;
  const { final_answer, confidence_score, confidence_reason, key_facts,
    contradictions, unsupported_claims, source_trail, model_agreement, final_warning } = judgeResult;

  const handleFeedback = (rating: number) => {
    setFeedbackGiven(rating);
    onFeedback?.(rating);
  };

  const agreementValues = Object.values(model_agreement);
  const agreedCount = agreementValues.filter((v) => v === 'agree').length;
  const successCount = providerResponses.filter((r) => !r.error).length;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Final Warning Banner */}
      {final_warning && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">{final_warning}</p>
        </div>
      )}

      {/* Main Answer Card */}
      <div className="card card-shadow overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-[#1f1f23]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full brand-gradient flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-[#f5f5dc] text-sm uppercase tracking-wider">
                Best Verified Answer
              </h2>
            </div>
            <ConfidenceBadge score={confidence_score} size="sm" />
          </div>
        </div>

        {/* Answer */}
        <div className="px-6 py-5">
          <p className="text-gray-800 dark:text-[#f5f5dc] leading-relaxed text-[15px] whitespace-pre-wrap">
            {final_answer}
          </p>
        </div>

        {/* Confidence bar */}
        <div className="px-6 pb-5">
          <ConfidenceBar score={confidence_score} />
          {confidence_reason && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{confidence_reason}</p>
          )}
        </div>

        {/* Trust indicators */}
        <div className="px-6 pb-5">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-[#1a1a1e] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2e]">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              {successCount}/5 models responded
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-[#1a1a1e] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2e]">
              <CheckCircle className="w-3 h-3 text-blue-500" />
              {agreedCount} in agreement
            </span>
            {source_trail.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-[#1a1a1e] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2e]">
                <ExternalLink className="w-3 h-3 text-purple-500" />
                {source_trail.length} sources
              </span>
            )}
          </div>
        </div>

        {/* Feedback */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#1f1f23] flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-600">Was this answer helpful?</span>
          {feedbackGiven === null ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFeedback(5)}
                className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-gray-400 hover:text-emerald-500 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFeedback(1)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-600">
              {feedbackGiven >= 3 ? '👍 Thanks!' : '👎 Thanks for the feedback.'}
            </span>
          )}
        </div>
      </div>

      {/* Expandable details */}
      {(key_facts.length > 0 || contradictions.length > 0 || unsupported_claims.length > 0 || source_trail.length > 0) && (
        <div className="card card-shadow overflow-hidden">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-6 py-4 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1e] transition-colors"
          >
            <span>Analysis Details</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="px-6 pb-6 space-y-5 border-t border-gray-100 dark:border-[#1f1f23] pt-4">
              {/* Key facts */}
              {key_facts.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Key Facts</h3>
                  <ul className="space-y-1.5">
                    {key_facts.map((fact, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {source_trail.length > 0 && <SourceTrail sources={source_trail} />}
              {contradictions.length > 0 && <ContradictionList items={contradictions} />}
              {unsupported_claims.length > 0 && <UnsupportedClaimsList items={unsupported_claims} />}
            </div>
          )}
        </div>
      )}

      {/* Raw answers toggle */}
      <div className="card card-shadow overflow-hidden">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="w-full px-6 py-4 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1e] transition-colors"
        >
          <span>Raw Model Answers</span>
          {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showRaw && (
          <div className="border-t border-gray-100 dark:border-[#1f1f23]">
            <RawAnswerGrid responses={providerResponses} modelAgreement={model_agreement} />
          </div>
        )}
      </div>
    </div>
  );
}
