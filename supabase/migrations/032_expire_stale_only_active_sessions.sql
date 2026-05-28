-- Heartbeat stale cleanup must only expire active billable sessions.
-- Pending creator-acceptance requests are not active sessions and must be
-- expired only by expire_pending_chat_requests using request_expires_at.

create or replace function public.expire_stale_chat_sessions(
  p_stale_after_seconds integer default 90
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stale_after_seconds integer;
  v_now timestamptz := now();
  v_expired_count integer := 0;
  v_released_presence_count integer := 0;
  v_sessions jsonb := '[]'::jsonb;
begin
  -- Conservative guardrails: callers cannot request an aggressive timeout.
  v_stale_after_seconds := least(
    greatest(coalesce(p_stale_after_seconds, 90), 45),
    3600
  );

  with stale_sessions as (
    select
      cs.id,
      cs.creator_id,
      cs.started_at,
      greatest(
        0,
        coalesce(max(cmc.minute_number) filter (where cmc.status = 'charged'), 0)
      )::integer as paid_minutes,
      greatest(
        0,
        coalesce(sum(cmc.amount_petals) filter (where cmc.status = 'charged'), 0)
      )::integer as charged_petals
    from public.chat_sessions cs
    left join public.chat_minute_charges cmc
      on cmc.session_id = cs.id
    where cs.ended_at is null
      and (cs.status = 'active' or cs.status is null)
      and coalesce(cs.last_heartbeat_at, cs.started_at)
        < v_now - make_interval(secs => v_stale_after_seconds)
    group by cs.id
  ),
  expired_sessions as (
    update public.chat_sessions cs
    set
      ended_at = stale_sessions.started_at
        + make_interval(secs => stale_sessions.paid_minutes * 60),
      duration_seconds = stale_sessions.paid_minutes * 60,
      petals_charged = greatest(coalesce(cs.petals_charged, 0), stale_sessions.charged_petals),
      status = 'ended',
      ended_reason = coalesce(cs.ended_reason, 'stale_heartbeat_timeout')
    from stale_sessions
    where cs.id = stale_sessions.id
      and cs.ended_at is null
      and (cs.status = 'active' or cs.status is null)
    returning
      cs.id,
      cs.creator_id,
      cs.type,
      cs.status,
      cs.duration_seconds,
      cs.petals_charged,
      cs.ended_reason
  ),
  released_presence as (
    update public.creator_presence cp
    set in_session = false
    from expired_sessions es
    where cp.creator_id = es.creator_id
      and not exists (
        select 1
        from public.chat_sessions cs_active
        where cs_active.creator_id = cp.creator_id
          and cs_active.ended_at is null
          and (cs_active.status = 'active' or cs_active.status is null)
      )
    returning cp.creator_id
  )
  select
    count(*)::integer,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'session_id', id,
          'type', type,
          'status', status,
          'duration_seconds', duration_seconds,
          'petals_charged', petals_charged,
          'ended_reason', ended_reason
        )
        order by id
      ),
      '[]'::jsonb
    ),
    (select count(*)::integer from released_presence)
  into v_expired_count, v_sessions, v_released_presence_count
  from expired_sessions;

  return jsonb_build_object(
    'success', true,
    'expired_count', v_expired_count,
    'released_presence_count', v_released_presence_count,
    'stale_after_seconds', v_stale_after_seconds,
    'sessions', v_sessions
  );
end;
$$;

-- Repair pending/requested rows that were incorrectly closed by the old stale
-- heartbeat cleanup before this migration. These requests are no longer valid
-- operationally, so mark them as missed without charging anything.
update public.chat_sessions
set
  status = 'missed',
  duration_seconds = 0,
  petals_charged = 0,
  activated_at = null,
  ended_reason = 'request_timeout'
where status in ('pending_creator_acceptance', 'requested')
  and ended_at is not null
  and coalesce(petals_charged, 0) = 0
  and ended_reason is null;

revoke all on function public.expire_stale_chat_sessions(integer) from public;
revoke all on function public.expire_stale_chat_sessions(integer) from anon;
revoke all on function public.expire_stale_chat_sessions(integer) from authenticated;
grant execute on function public.expire_stale_chat_sessions(integer) to service_role;
