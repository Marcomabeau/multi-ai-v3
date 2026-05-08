import { cn } from '@/lib/utils/helpers';

interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

function getColor(score: number) {
  if (score >= 75) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
  return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800';
}

function getLabel(score: number) {
  if (score >= 80) return 'High confidence';
  if (score >= 60) return 'Moderate confidence';
  if (score >= 40) return 'Low confidence';
  return 'Very low confidence';
}

export function ConfidenceBadge({ score, size = 'md' }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-semibold rounded-full border',
          getColor(score),
          size === 'sm' && 'text-xs px-2.5 py-1',
          size === 'md' && 'text-sm px-3 py-1.5',
          size === 'lg' && 'text-base px-4 py-2'
        )}
      >
        <span>{score}%</span>
        <span className="font-normal opacity-80">{getLabel(score)}</span>
      </span>
    </div>
  );
}

// Bar version for displaying in result card
export function ConfidenceBar({ score }: { score: number }) {
  const color =
    score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400 font-medium">Confidence Score</span>
        <span className="font-semibold text-gray-900 dark:text-[#f5f5dc]">{score}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-[#1f1f23] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
