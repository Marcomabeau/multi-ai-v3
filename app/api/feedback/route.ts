import { NextRequest } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { FeedbackSchema, jsonResponse, errorResponse } from '@/lib/utils/helpers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse('Unauthorized.', 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body.');
  }

  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0]?.message ?? 'Invalid feedback data.');
  }

  const { queryId, rating, comment } = parsed.data;

  // Verify query belongs to user
  const adminSupabase = createAdminSupabaseClient();
  const { data: query } = await adminSupabase
    .from('queries')
    .select('id, user_id')
    .eq('id', queryId)
    .single();

  if (!query || query.user_id !== user.id) {
    return errorResponse('Query not found.', 404);
  }

  const { error } = await adminSupabase
    .from('feedback')
    .upsert(
      {
        user_id: user.id,
        query_id: queryId,
        rating,
        comment: comment ?? null,
      },
      { onConflict: 'user_id,query_id' }
    );

  if (error) {
    return errorResponse('Failed to save feedback.', 500);
  }

  return jsonResponse({ success: true });
}
