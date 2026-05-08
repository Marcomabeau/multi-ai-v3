import { createAdminSupabaseClient } from '@/lib/supabase/server';
import type { Plan, UsageStatus } from '@/types';

// ── Plan config ───────────────────────────────────────────────
const PLAN_CONFIG: Record<Plan, { queriesPerWindow: number; windowHours: number }> = {
  free:    { queriesPerWindow: 2,    windowHours: 2  },
  pro:     { queriesPerWindow: 200,  windowHours: 24 },
  pro_max: { queriesPerWindow: 1000, windowHours: 24 },
};

interface AtomicResult {
  allowed:   boolean;
  used:      number;
  quota:     number;
  resets_at: string | null;
}

/**
 * Atomically check + reserve quota in a single transaction.
 *
 * Uses pg_advisory_xact_lock to prevent race conditions even when
 * no active window exists yet (INSERT path). The lock is per-user
 * and transaction-scoped — it releases automatically on commit/rollback.
 *
 * If this returns allowed=true, quota HAS been consumed.
 * Call rollbackUsage() if the downstream query ultimately fails.
 */
export async function checkAndIncrementUsage(
  userId: string,
  plan: Plan,
): Promise<{ allowed: boolean; status: UsageStatus }> {
  const { queriesPerWindow, windowHours } = PLAN_CONFIG[plan];
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase.rpc('increment_usage_atomic', {
    p_user_id:      userId,
    p_plan:         plan,
    p_limit:        queriesPerWindow,
    p_window_hours: windowHours,
  });

  if (error) throw new Error(`Usage RPC failed: ${error.message}`);

  const row = (data as AtomicResult[])[0];
  if (!row) throw new Error('Usage RPC returned no data');

  const status: UsageStatus = {
    plan,
    queriesUsed:    row.used,
    queriesLimit:   row.quota,
    windowResetsAt: row.resets_at,
    canQuery:       row.allowed,
  };

  return { allowed: row.allowed, status };
}

/**
 * Refund one quota slot back to the user.
 *
 * Call this when the query pipeline fails AFTER quota was already
 * consumed by checkAndIncrementUsage(). This ensures users aren't
 * penalised for provider failures or server errors.
 *
 * Safe to call on errors — it never throws; failures are logged only.
 */
export async function rollbackUsage(userId: string): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.rpc('rollback_usage', {
      p_user_id: userId,
    });
    if (error) {
      console.error('[usageLimiter] rollback_usage RPC error:', error.message);
    }
  } catch (err) {
    console.error('[usageLimiter] rollbackUsage threw:', err);
  }
}

/**
 * Read-only status — does NOT consume quota.
 * Used by GET /api/usage.
 */
export async function getUsageStatus(userId: string, plan: Plan): Promise<UsageStatus> {
  const { queriesPerWindow } = PLAN_CONFIG[plan];
  const supabase = createAdminSupabaseClient();
  const now = new Date();

  const { data: windows } = await supabase
    .from('usage_windows')
    .select('query_count, window_end')
    .eq('user_id', userId)
    .gte('window_end', now.toISOString())
    .order('window_start', { ascending: false })
    .limit(1);

  const current = windows?.[0] ?? null;
  const used = current?.query_count ?? 0;

  return {
    plan,
    queriesUsed:    used,
    queriesLimit:   queriesPerWindow,
    windowResetsAt: current?.window_end ?? null,
    canQuery:       used < queriesPerWindow,
  };
}
