'use client';

import { useState } from 'react';
import { cn, formatDuration } from '@/lib/utils/helpers';
import type { ProviderResponse, ModelAgreement, JudgeResult } from '@/types';
import { ChevronDown, ChevronUp, AlertCircle, Clock } from 'lucide-react';

interface Props {
  responses: ProviderResponse[];
  modelAgreement: JudgeResult['model_agreement'];
}

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  openai: { label: 'OpenAI', color: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' },
  gemini: { label: 'Gemini', color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900' },
  claude: { label: 'Claude', color: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900' },
  perplexity: { label: 'Perplexity', color: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900' },
  llama: { label: 'Llama', color: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' },
};

const AGREEMENT_STYLE: Record<ModelAgreement, string> = {
  agree: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
  disagree: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30',
  partial: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30',
  error: 'text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-900/30',
};

function ProviderCard({
  response,
  agreement,
}: {
  response: ProviderResponse;
  agreement: ModelAgreement;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = PROVIDER_LABELS[response.provider];
  const preview = response.rawAnswer?.slice(0, 200);
  const isLong = (response.rawAnswer?.length ?? 0) > 200;

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', meta.color)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 dark:text-[#f5f5dc]">
          {meta.label}
        </span>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', AGREEMENT_STYLE[agreement])}>
            {agreement}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-600">
            <Clock className="w-3 h-3" />
            {formatDuration(response.latencyMs)}
          </span>
        </div>
      </div>

      {/* Model name */}
      <p className="text-xs text-gray-400 dark:text-gray-600 font-mono">{response.model}</p>

      {/* Content */}
      {response.error ? (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400">{response.error}</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {expanded ? response.rawAnswer : preview}
            {!expanded && isLong && '...'}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3" /> Show less</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> Show more</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Citations */}
      {response.citations && response.citations.length > 0 && (
        <div className="pt-2 border-t border-current border-opacity-10">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            {response.citations.length} web source{response.citations.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-1">
            {response.citations.slice(0, 3).map((c, i) => (
              <a
                key={i}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-blue-500 hover:text-blue-600 truncate"
              >
                {c.source || c.url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RawAnswerGrid({ responses, modelAgreement }: Props) {
  return (
    <div className="p-4 sm:p-6">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        Raw responses from all models
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {responses.map((r) => (
          <ProviderCard
            key={r.provider}
            response={r}
            agreement={modelAgreement[r.provider] ?? 'error'}
          />
        ))}
      </div>
    </div>
  );
}
