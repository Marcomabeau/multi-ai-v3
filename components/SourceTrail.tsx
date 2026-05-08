import type { Citation } from '@/types';
import { ExternalLink, Shield, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

// ── SourceTrail ───────────────────────────────────────────────
interface SourceTrailProps {
  sources: Citation[];
}

export function SourceTrail({ sources }: SourceTrailProps) {
  if (sources.length === 0) return null;

  const reliabilityColor = {
    high: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    low: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
  };

  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        <Shield className="w-3.5 h-3.5" />
        Source Trail
      </h3>
      <div className="space-y-2">
        {sources.map((source, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#1a1a1e] border border-gray-100 dark:border-[#2a2a2e]"
          >
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{source.claim}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {source.source}
                  </a>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{source.source}</span>
                )}
                <span className={cn('text-xs px-1.5 py-0.5 rounded border font-medium', reliabilityColor[source.reliability])}>
                  {source.reliability}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ContradictionList ─────────────────────────────────────────
interface ListProps {
  items: string[];
}

export function ContradictionList({ items }: ListProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3">
        <AlertCircle className="w-3.5 h-3.5" />
        Contradictions Found
      </h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40"
          >
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── UnsupportedClaimsList ─────────────────────────────────────
export function UnsupportedClaimsList({ items }: ListProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">
        <XCircle className="w-3.5 h-3.5" />
        Unsupported Claims
      </h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40"
          >
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
