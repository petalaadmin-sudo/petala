-- Creator Availability & Acceptance Flow 1A.1.
-- Keeps passive chat_sessions acceptance-state fields synchronized for the
-- currently deployed legacy flows, without changing billing, APIs, or UI.

create or replace function public.sync_chat_session_acceptance_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.requested_at is null then
    new.requested_at := new.started_at;
  end if;

  if new.status is null or btrim(new.status) = '' then
    new.status := 'active';
  end if;

  if new.activated_at is null
    and (
      coalesce(new.petals_charged, 0) > 0
      or coalesce(new.duration_seconds, 0) > 0
    ) then
    new.activated_at := new.started_at;
  end if;

  if new.ended_at is not null and new.status in ('active', 'accepted') then
    new.status := 'ended';
  end if;

  return new;
end;
$$;

drop trigger if exists sync_chat_session_acceptance_state_before_write
  on public.chat_sessions;

create trigger sync_chat_session_acceptance_state_before_write
  before insert or update on public.chat_sessions
  for each row
  execute function public.sync_chat_session_acceptance_state();

-- Repair sessions created after the passive schema migration by legacy flows.
-- This does not touch billing fields, durations, or ended_at.
update public.chat_sessions
set
  status = case
    when ended_at is not null and status in ('active', 'accepted') then 'ended'
    else status
  end,
  requested_at = coalesce(requested_at, started_at),
  activated_at = case
    when activated_at is null
      and (
        coalesce(petals_charged, 0) > 0
        or coalesce(duration_seconds, 0) > 0
      )
      then started_at
    else activated_at
  end
where requested_at is null
   or (
     activated_at is null
     and (
       coalesce(petals_charged, 0) > 0
       or coalesce(duration_seconds, 0) > 0
     )
   )
   or (ended_at is not null and status in ('active', 'accepted'));

revoke all on function public.sync_chat_session_acceptance_state() from public;
revoke all on function public.sync_chat_session_acceptance_state() from anon;
revoke all on function public.sync_chat_session_acceptance_state() from authenticated;
grant execute on function public.sync_chat_session_acceptance_state() to service_role;
