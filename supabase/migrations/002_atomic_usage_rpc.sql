-- ─────────────────────────────────────────────────────────────
-- MULTI Ai — Migration 002: Atomic Usage RPC + pgcrypto
-- Fixes:
--   - gen_random_uuid() requires pgcrypto on older Postgres
--   - Race condition when two requests arrive with no active window
--   - Uses pg_advisory_xact_lock for full INSERT safety
-- ─────────────────────────────────────────────────────────────

-- pgcrypto provides gen_random_uuid() on Postgres < 13
-- On Postgres 13+ it is a no-op but safe to run
create extension if not exists "pgcrypto";

-- ── Simplified profiles RLS ──────────────────────────────────
-- Drop the risky self-referencing UPDATE policy.
-- Plan and Stripe fields are ONLY updated by service role
-- (server-side via SUPABASE_SERVICE_ROLE_KEY), never by clients.
-- RLS is bypassed for service_role by default in Supabase.

drop policy if exists "Users can update own profile" on profiles;

-- Users may only update non-sensitive fields (none currently exposed).
-- If you add user-editable fields later (display_name, etc.) add them here.
-- For now: no client-side UPDATE is permitted at all.
-- Service role bypasses RLS and can update anything server-side.

-- ── Atomic usage increment with advisory lock ─────────────────
-- pg_advisory_xact_lock(bigint) holds for the duration of the
-- transaction, preventing a second concurrent INSERT of a new window
-- for the same user_id even if no row exists yet.
-- hashtext() is a built-in Postgres function (no extension needed).

create or replace function increment_usage_atomic(
  p_user_id      uuid,
  p_plan         text,
  p_limit        int,
  p_window_hours int
)
returns table(allowed boolean, used int, quota int, resets_at timestamptz)
language plpgsql
security definer
as $$
declare
  v_window    usage_windows;
  v_now       timestamptz := now();
  v_end       timestamptz := v_now + (p_window_hours || ' hours')::interval;
  v_new_count int;
  v_lock_key  bigint;
begin
  -- Derive a stable per-user lock key from the UUID
  -- hashtext returns int4; cast to bigint for advisory lock
  v_lock_key := hashtext(p_user_id::text)::bigint;

  -- Acquire transaction-scoped advisory lock for this user.
  -- Any concurrent call with the same user_id blocks here until
  -- the first transaction commits or rolls back.
  perform pg_advisory_xact_lock(v_lock_key);

  -- Now safely check for an active window (no concurrent INSERT can race us)
  select * into v_window
  from usage_windows
  where user_id = p_user_id
    and window_end > v_now
  order by window_start desc
  limit 1;

  if v_window.id is null then
    -- No active window — create one at count=1
    insert into usage_windows (user_id, window_start, window_end, query_count)
    values (p_user_id, v_now, v_end, 1)
    returning query_count into v_new_count;

    return query select true, v_new_count, p_limit, v_end;

  elsif v_window.query_count >= p_limit then
    -- Quota exhausted — do NOT increment
    return query select false, v_window.query_count, p_limit, v_window.window_end;

  else
    -- Quota available — increment
    update usage_windows
    set query_count = query_count + 1
    where id = v_window.id
    returning query_count into v_new_count;

    return query select true, v_new_count, p_limit, v_window.window_end;
  end if;
end;
$$;

-- Only service role may call this function
revoke execute on function increment_usage_atomic from public;
revoke execute on function increment_usage_atomic from anon;
revoke execute on function increment_usage_atomic from authenticated;
grant  execute on function increment_usage_atomic to service_role;

-- ── Quota rollback helper ─────────────────────────────────────
-- Called when a query fails AFTER quota was already consumed.
-- Decrements the count by 1 (floor 0) so the user gets their slot back.
create or replace function rollback_usage(
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_now timestamptz := now();
begin
  update usage_windows
  set query_count = greatest(query_count - 1, 0)
  where user_id = p_user_id
    and window_end > v_now
    and query_count > 0
    -- only rollback the most recent active window
    and id = (
      select id from usage_windows
      where user_id = p_user_id and window_end > v_now
      order by window_start desc
      limit 1
    );
end;
$$;

revoke execute on function rollback_usage from public;
revoke execute on function rollback_usage from anon;
revoke execute on function rollback_usage from authenticated;
grant  execute on function rollback_usage to service_role;
