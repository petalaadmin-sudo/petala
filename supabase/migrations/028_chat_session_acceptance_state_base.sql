-- Creator Availability & Acceptance Flow 1A.
-- Passive session state fields for future creator acceptance/decline/cancel/timeout.
-- This migration is intentionally schema-only: it does not change billing, APIs, UI,
-- heartbeat, Agora token issuance, gifts, or any existing charge flow.

alter table public.chat_sessions
  add column if not exists status text,
  add column if not exists requested_at timestamptz,
  add column if not exists request_expires_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists declined_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists activated_at timestamptz,
  add column if not exists accepted_by_creator_user_id uuid,
  add column if not exists decline_reason text,
  add column if not exists cancel_reason text,
  add column if not exists ended_reason text;

-- Backfill legacy sessions without changing billing fields or end times.
update public.chat_sessions
set status = case
  when ended_at is not null then 'ended'
  else 'active'
end
where status is null
   or btrim(status) = ''
   or (status = 'active' and ended_at is not null);

update public.chat_sessions
set requested_at = coalesce(requested_at, started_at)
where requested_at is null;

update public.chat_sessions
set activated_at = started_at
where activated_at is null
  and (
    status = 'active'
    or coalesce(petals_charged, 0) > 0
  );

alter table public.chat_sessions
  alter column status set default 'active',
  alter column status set not null;

alter table public.chat_sessions
  drop constraint if exists chat_sessions_status_check;

alter table public.chat_sessions
  add constraint chat_sessions_status_check
  check (
    status in (
      'requested',
      'pending_creator_acceptance',
      'accepted',
      'active',
      'declined',
      'missed',
      'cancelled',
      'ended'
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.chat_sessions'::regclass
      and conname = 'chat_sessions_accepted_by_creator_user_id_fkey'
  ) then
    alter table public.chat_sessions
      add constraint chat_sessions_accepted_by_creator_user_id_fkey
      foreign key (accepted_by_creator_user_id)
      references public.users(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_chat_sessions_creator_status_expires
  on public.chat_sessions (creator_id, status, request_expires_at);

create index if not exists idx_chat_sessions_user_status
  on public.chat_sessions (user_id, status);

create index if not exists idx_chat_sessions_status_expires
  on public.chat_sessions (status, request_expires_at);
