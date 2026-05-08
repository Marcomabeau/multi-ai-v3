import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { getUsageStatus } from '@/lib/services/usageLimiter';
import { jsonResponse, errorResponse } from '@/lib/utils/helpers';
import type { Plan } from '@/types';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse('Unauthorized.', 401);
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', user.id)
    .single();

  const plan = (profile?.plan ?? 'free') as Plan;
  const status = await getUsageStatus(user.id, plan);

  return jsonResponse(status);
}
