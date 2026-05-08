'use client';

import Link from 'next/link';
import { trackUpgradeClick, trackLimitHit } from '@/lib/utils/analytics';
import { useEffect } from 'react';
import { X, Zap, Clock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resetsAt?: string | null;
}

export function UsageLimitModal({ isOpen, onClose, resetsAt }: Props) {
  useEffect(() => {
    if (isOpen) trackLimitHit('free');
  }, [isOpen]);

  if (!isOpen) return null;

  const resetTime = resetsAt
    ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(resetsAt))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md card card-shadow p-6 sm:p-8 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1e] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6 text-white" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#f5f5dc] mb-2">
              Query limit reached
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              You've used your 2 free questions in this 2-hour window. Upgrade to Pro for high-limit access with full source trails and verification.
            </p>
          </div>

          {resetTime && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1a1e] rounded-xl px-4 py-3">
              <Clock className="w-4 h-4" />
              Free access resets at {resetTime}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/pricing"
              onClick={() => trackUpgradeClick('limit_modal')}
              className="btn-primary justify-center"
            >
              <Zap className="w-4 h-4" />
              Upgrade to Pro
            </Link>
            <button
              onClick={onClose}
              className="btn-secondary text-sm justify-center"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
