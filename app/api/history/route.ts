import { NextRequest } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { jsonResponse, errorResponse } from '@/lib/utils/helpers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Auth
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse('Unauthorized.', 401);
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50);
  const offset = Number(searchParams.get('offset') ?? 0);

  const adminSupabase = createAdminSupabaseClient();

  const { data: queries, error } = await adminSupabase
    .from('queries')
    .select(
      'id, question, final_answer, confidence_score, status, latency_ms, created_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[/api/history] DB error:', error);
    return errorResponse('Failed to fetch history.', 500);
  }

  return jsonResponse({ queries: queries ?? [] });
}
