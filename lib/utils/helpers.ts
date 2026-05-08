import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { z } from 'zod';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatCost(usd: number | null | undefined): string {
  if (usd == null) return '—';
  if (usd < 0.001) return '<$0.001';
  return `$${usd.toFixed(4)}`;
}

// ── Input validation ──────────────────────────────────────────
export const QuestionSchema = z
  .string()
  .min(3, 'Question must be at least 3 characters.')
  .max(8000, 'Question must be at most 8,000 characters.')
  .trim();

export const FeedbackSchema = z.object({
  queryId: z.string().uuid('Invalid query ID.'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

// ── HTTP helpers ──────────────────────────────────────────────
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

// ── Auth helper ───────────────────────────────────────────────
export function getAuthError(code: string): string {
  const messages: Record<string, string> = {
    'invalid_credentials': 'Invalid email or password.',
    'email_not_confirmed': 'Please verify your email before signing in.',
    'user_already_exists': 'An account with this email already exists.',
    'weak_password': 'Password must be at least 8 characters.',
  };
  return messages[code] ?? 'An authentication error occurred. Please try again.';
}
