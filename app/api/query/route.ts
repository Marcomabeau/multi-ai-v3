import { NextRequest } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { callOpenAI } from '@/lib/services/openai';
import { callClaude } from '@/lib/services/claude';
import { callGemini } from '@/lib/services/gemini';
import { callPerplexity } from '@/lib/services/perplexity';
import { callLlama } from '@/lib/services/llama';
import { callJudge } from '@/lib/services/judge';
import { checkAndIncrementUsage, rollbackUsage } from '@/lib/services/usageLimiter';
import { QuestionSchema, jsonResponse, errorResponse } from '@/lib/utils/helpers';
import type { ProviderResponse, Plan } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes max for all parallel calls + judge

export async function POST(req: NextRequest) {
  const start = Date.now();

  // ── 1. Auth check ─────────────────────────────────────────
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse('Unauthorized. Please sign in.', 401);
  }

  // ── 2. Parse & validate input ─────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body.');
  }

  const parsed = QuestionSchema.safeParse((body as Record<string, unknown>)?.question);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? 'Invalid question.');
  }
  const question = parsed.data;

  // ── 3. Get user profile & plan ────────────────────────────
  const adminSupabase = createAdminSupabaseClient();
  const { data: profile, error: profileError } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return errorResponse('User profile not found.', 404);
  }

  const plan = (profile.plan ?? 'free') as Plan;

  // ── 4. Atomically check + increment usage (race-condition safe) ──
  const { allowed, status: usageStatus } = await checkAndIncrementUsage(user.id, plan);
  if (!allowed) {
    return jsonResponse(
      { error: 'usage_limit_reached', message: 'Query limit reached for this period.', usageStatus },
      429
    );
  }

  // ── 5. Create pending query record ────────────────────────
  const { data: queryRow, error: queryInsertError } = await adminSupabase
    .from('queries')
    .insert({
      user_id: user.id,
      question,
      status: 'processing',
      model_set: ['openai', 'gemini', 'claude', 'perplexity', 'llama'],
    })
    .select()
    .single();

  if (queryInsertError || !queryRow) {
    // Quota was already consumed — refund it since we can't proceed
    await rollbackUsage(user.id);
    return errorResponse('Failed to create query record.', 500);
  }

  const queryId = queryRow.id;

  try {
    // ── 6. Call all 5 providers in parallel ───────────────
    const [openaiResult, geminiResult, claudeResult, perplexityResult, llamaResult] =
      await Promise.allSettled([
        callOpenAI(question),
        callGemini(question),
        callClaude(question),
        callPerplexity(question),
        callLlama(question),
      ]);

    const providerResponses: ProviderResponse[] = [
      settledToResponse(openaiResult, 'openai'),
      settledToResponse(geminiResult, 'gemini'),
      settledToResponse(claudeResult, 'claude'),
      settledToResponse(perplexityResult, 'perplexity'),
      settledToResponse(llamaResult, 'llama'),
    ];

    // ── 7. Save individual model responses ────────────────
    const modelResponseInserts = providerResponses.map((r) => ({
      query_id: queryId,
      provider: r.provider,
      model: r.model,
      raw_answer: r.rawAnswer || null,
      citations: r.citations ?? null,
      latency_ms: r.latencyMs,
      error: r.error ?? null,
      token_input: r.tokenInput ?? null,
      token_output: r.tokenOutput ?? null,
      cost_estimate_usd: r.costEstimateUsd ?? null,
    }));

    await adminSupabase.from('model_responses').insert(modelResponseInserts);

    // ── 9. Call Judge ──────────────────────────────────────
    const judgeResult = await callJudge(question, providerResponses);

    // Collect all citations for source trail
    const allCitations = providerResponses
      .flatMap((r) => r.citations ?? [])
      .concat(judgeResult.source_trail);

    const totalCost = providerResponses.reduce(
      (sum, r) => sum + (r.costEstimateUsd ?? 0),
      0
    );

    const totalLatency = Date.now() - start;

    // ── 10. Update query record with final result ──────────
    await adminSupabase
      .from('queries')
      .update({
        status: 'complete',
        final_answer: judgeResult.final_answer,
        confidence_score: judgeResult.confidence_score,
        source_trail: allCitations,
        judge_result: judgeResult,
        latency_ms: totalLatency,
        cost_estimate_usd: totalCost,
      })
      .eq('id', queryId);

    // ── 11. Return structured response ────────────────────
    return jsonResponse({
      queryId,
      question,
      judgeResult,
      providerResponses,
      latencyMs: totalLatency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error('[/api/query] Fatal error:', err);

    // Refund quota — user should not be penalised for server/provider failure
    await rollbackUsage(user.id);

    // Mark query as errored
    await adminSupabase
      .from('queries')
      .update({ status: 'error' })
      .eq('id', queryId);

    return errorResponse(`Query failed: ${message}`, 500);
  }
}

// ── Helper ─────────────────────────────────────────────────────
function settledToResponse(
  result: PromiseSettledResult<ProviderResponse>,
  provider: ProviderResponse['provider']
): ProviderResponse {
  if (result.status === 'fulfilled') {
    return result.value;
  }
  return {
    provider,
    model: 'unknown',
    rawAnswer: '',
    latencyMs: 0,
    error: result.reason instanceof Error ? result.reason.message : 'Provider call failed',
  };
}
