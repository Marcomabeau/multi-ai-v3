'use client';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function gtag(...args: unknown[]): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function trackAskQuestion(plan: string): void {
  if (!GA_ID) return;
  gtag('event', 'ask_question', {
    event_category: 'engagement',
    plan,
  });
}

export function trackUpgradeClick(source: string): void {
  if (!GA_ID) return;
  gtag('event', 'upgrade_click', {
    event_category: 'monetization',
    source,
  });
}

export function trackLimitHit(plan: string): void {
  if (!GA_ID) return;
  gtag('event', 'query_limit_hit', {
    event_category: 'engagement',
    plan,
  });
}

export function trackQuerySuccess(latencyMs: number, confidenceScore: number): void {
  if (!GA_ID) return;
  gtag('event', 'query_success', {
    event_category: 'engagement',
    latency_ms: latencyMs,
    confidence_score: confidenceScore,
  });
}

export function trackQueryError(errorType: string): void {
  if (!GA_ID) return;
  gtag('event', 'query_error', {
    event_category: 'error',
    error_type: errorType,
  });
}

export function trackSubscriptionSuccess(plan: string): void {
  if (!GA_ID) return;
  gtag('event', 'subscription_success', {
    event_category: 'monetization',
    plan,
  });
}
