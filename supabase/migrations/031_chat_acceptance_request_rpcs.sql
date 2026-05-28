-- Creator Availability & Acceptance Flow 1B.1.
-- Backend-only request/accept/decline/cancel primitives for text/video chat.
-- This does not move billing behind acceptance yet and does not connect the
-- feed or existing startChat flow to pending requests.

alter table public.chat_sessions
  add column if not exists request_idempotency_key text;

create unique index if not exists idx_chat_sessions_request_idempotency_key
  on public.chat_sessions (request_idempotency_key)
  where request_idempotency_key is not null;

create or replace function public.create_chat_request(
  p_user_id uuid,
  p_creator_id uuid,
  p_type public.session_type,
  p_expires_in_seconds integer default 45,
  p_idempotency_key text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_idempotency_key text := nullif(btrim(coalesce(p_idempotency_key, '')), '');
  v_expires_in_seconds integer := least(greatest(coalesce(p_expires_in_seconds, 45), 10), 300);
  v_creator record;
  v_existing record;
  v_open_session record;
  v_request_id uuid;
  v_requested_at timestamptz := now();
  v_expires_at timestamptz;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Usuario obrigatorio', 'code', 'INVALID_USER');
  end if;

  if p_creator_id is null then
    return jsonb_build_object('success', false, 'error', 'Criadora obrigatoria', 'code', 'INVALID_CREATOR');
  end if;

  if not exists (select 1 from public.users u where u.id = p_user_id) then
    return jsonb_build_object('success', false, 'error', 'Usuario nao encontrado', 'code', 'USER_NOT_FOUND');
  end if;

  select c.id, c.user_id, c.active, c.verified
  into v_creator
  from public.creators c
  where c.id = p_creator_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Criadora nao encontrada', 'code', 'CREATOR_NOT_FOUND');
  end if;

  if v_creator.user_id = p_user_id then
    return jsonb_build_object('success', false, 'error', 'Usuario nao pode solicitar chat consigo mesmo', 'code', 'SELF_CHAT_NOT_ALLOWED');
  end if;

  if not coalesce(v_creator.active, false) then
    return jsonb_build_object('success', false, 'error', 'Criadora inativa', 'code', 'CREATOR_INACTIVE');
  end if;

  if not coalesce(v_creator.verified, false) then
    return jsonb_build_object('success', false, 'error', 'Criadora nao verificada', 'code', 'CREATOR_NOT_VERIFIED');
  end if;

  if v_idempotency_key is not null then
    perform pg_advisory_xact_lock(hashtext(v_idempotency_key)::bigint);

    select s.*
    into v_existing
    from public.chat_sessions s
    where s.request_idempotency_key = v_idempotency_key;

    if found then
      if v_existing.user_id = p_user_id
         and v_existing.creator_id = p_creator_id
         and v_existing.type = p_type then
        return jsonb_build_object(
          'success', true,
          'idempotent_replay', true,
          'session_id', v_existing.id,
          'status', v_existing.status,
          'type', v_existing.type,
          'requested_at', v_existing.requested_at,
          'request_expires_at', v_existing.request_expires_at,
          'ended_at', v_existing.ended_at
        );
      end if;

      return jsonb_build_object('success', false, 'error', 'idempotency_key ja usada com parametros diferentes', 'code', 'IDEMPOTENCY_KEY_CONFLICT');
    end if;
  end if;

  select s.id, s.status, s.type
  into v_open_session
  from public.chat_sessions s
  where s.user_id = p_user_id
    and s.ended_at is null
    and s.status in ('requested', 'pending_creator_acceptance', 'accepted', 'active')
  order by s.started_at desc
  limit 1;

  if found then
    return jsonb_build_object(
      'success', false,
      'error', 'Usuario ja possui sessao ou solicitacao aberta',
      'code', 'OPEN_SESSION_EXISTS',
      'session_id', v_open_session.id,
      'status', v_open_session.status,
      'type', v_open_session.type
    );
  end if;

  v_expires_at := v_requested_at + make_interval(secs => v_expires_in_seconds);

  insert into public.chat_sessions (
    user_id,
    creator_id,
    type,
    started_at,
    status,
    requested_at,
    request_expires_at,
    petals_charged,
    duration_seconds,
    ended_at,
    activated_at,
    request_idempotency_key
  ) values (
    p_user_id,
    p_creator_id,
    p_type,
    v_requested_at,
    'pending_creator_acceptance',
    v_requested_at,
    v_expires_at,
    0,
    null,
    null,
    null,
    v_idempotency_key
  )
  returning id into v_request_id;

  return jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'session_id', v_request_id,
    'status', 'pending_creator_acceptance',
    'type', p_type,
    'requested_at', v_requested_at,
    'request_expires_at', v_expires_at,
    'expires_in_seconds', v_expires_in_seconds
  );
end;
$$;

create or replace function public.accept_chat_request(
  p_session_id uuid,
  p_creator_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_now timestamptz := now();
begin
  select s.*, c.user_id as creator_user_id
  into v_session
  from public.chat_sessions s
  join public.creators c on c.id = s.creator_id
  where s.id = p_session_id
  for update of s;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Solicitacao nao encontrada', 'code', 'REQUEST_NOT_FOUND');
  end if;

  if v_session.creator_user_id <> p_creator_user_id then
    return jsonb_build_object('success', false, 'error', 'Criadora nao autorizada para esta solicitacao', 'code', 'UNAUTHORIZED');
  end if;

  if v_session.status = 'accepted' then
    return jsonb_build_object(
      'success', true,
      'idempotent_replay', true,
      'session_id', v_session.id,
      'status', v_session.status,
      'accepted_at', v_session.accepted_at,
      'request_expires_at', v_session.request_expires_at
    );
  end if;

  if v_session.status not in ('pending_creator_acceptance', 'requested') then
    return jsonb_build_object('success', false, 'error', 'Solicitacao nao esta pendente', 'code', 'INVALID_REQUEST_STATUS', 'status', v_session.status);
  end if;

  if v_session.request_expires_at is not null and v_session.request_expires_at <= v_now then
    update public.chat_sessions
    set status = 'missed',
        ended_at = v_now,
        duration_seconds = 0,
        petals_charged = 0,
        ended_reason = 'request_timeout'
    where id = v_session.id;

    return jsonb_build_object(
      'success', false,
      'error', 'Solicitacao expirada',
      'code', 'REQUEST_EXPIRED',
      'session_id', v_session.id,
      'status', 'missed'
    );
  end if;

  update public.chat_sessions
  set status = 'accepted',
      accepted_at = v_now,
      accepted_by_creator_user_id = p_creator_user_id
  where id = v_session.id;

  return jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'session_id', v_session.id,
    'status', 'accepted',
    'accepted_at', v_now,
    'request_expires_at', v_session.request_expires_at
  );
end;
$$;

create or replace function public.decline_chat_request(
  p_session_id uuid,
  p_creator_user_id uuid,
  p_reason text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_now timestamptz := now();
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  select s.*, c.user_id as creator_user_id
  into v_session
  from public.chat_sessions s
  join public.creators c on c.id = s.creator_id
  where s.id = p_session_id
  for update of s;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Solicitacao nao encontrada', 'code', 'REQUEST_NOT_FOUND');
  end if;

  if v_session.creator_user_id <> p_creator_user_id then
    return jsonb_build_object('success', false, 'error', 'Criadora nao autorizada para esta solicitacao', 'code', 'UNAUTHORIZED');
  end if;

  if v_session.status = 'declined' then
    return jsonb_build_object('success', true, 'idempotent_replay', true, 'session_id', v_session.id, 'status', v_session.status);
  end if;

  if v_session.status not in ('pending_creator_acceptance', 'requested') then
    return jsonb_build_object('success', false, 'error', 'Solicitacao nao esta pendente', 'code', 'INVALID_REQUEST_STATUS', 'status', v_session.status);
  end if;

  update public.chat_sessions
  set status = 'declined',
      declined_at = v_now,
      decline_reason = v_reason,
      ended_at = v_now,
      duration_seconds = 0,
      petals_charged = 0,
      ended_reason = 'declined_by_creator'
  where id = v_session.id;

  return jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'session_id', v_session.id,
    'status', 'declined',
    'declined_at', v_now,
    'ended_reason', 'declined_by_creator'
  );
end;
$$;

create or replace function public.cancel_chat_request(
  p_session_id uuid,
  p_user_id uuid,
  p_reason text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_now timestamptz := now();
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  select s.*
  into v_session
  from public.chat_sessions s
  where s.id = p_session_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Solicitacao nao encontrada', 'code', 'REQUEST_NOT_FOUND');
  end if;

  if v_session.user_id <> p_user_id then
    return jsonb_build_object('success', false, 'error', 'Usuario nao autorizado para esta solicitacao', 'code', 'UNAUTHORIZED');
  end if;

  if v_session.status = 'cancelled' then
    return jsonb_build_object('success', true, 'idempotent_replay', true, 'session_id', v_session.id, 'status', v_session.status);
  end if;

  if v_session.status not in ('pending_creator_acceptance', 'requested') then
    return jsonb_build_object('success', false, 'error', 'Solicitacao nao esta pendente', 'code', 'INVALID_REQUEST_STATUS', 'status', v_session.status);
  end if;

  update public.chat_sessions
  set status = 'cancelled',
      cancelled_at = v_now,
      cancel_reason = v_reason,
      ended_at = v_now,
      duration_seconds = 0,
      petals_charged = 0,
      ended_reason = 'cancelled_by_user'
  where id = v_session.id;

  return jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'session_id', v_session.id,
    'status', 'cancelled',
    'cancelled_at', v_now,
    'ended_reason', 'cancelled_by_user'
  );
end;
$$;

create or replace function public.expire_pending_chat_requests(
  p_now timestamptz default now()
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired_count integer := 0;
begin
  update public.chat_sessions
  set status = 'missed',
      ended_at = p_now,
      duration_seconds = 0,
      petals_charged = 0,
      ended_reason = 'request_timeout'
  where status in ('pending_creator_acceptance', 'requested')
    and ended_at is null
    and request_expires_at is not null
    and request_expires_at <= p_now;

  get diagnostics v_expired_count = row_count;

  return jsonb_build_object(
    'success', true,
    'expired_count', v_expired_count
  );
end;
$$;

revoke all on function public.create_chat_request(uuid, uuid, public.session_type, integer, text) from public;
revoke all on function public.create_chat_request(uuid, uuid, public.session_type, integer, text) from anon;
revoke all on function public.create_chat_request(uuid, uuid, public.session_type, integer, text) from authenticated;
grant execute on function public.create_chat_request(uuid, uuid, public.session_type, integer, text) to service_role;

revoke all on function public.accept_chat_request(uuid, uuid) from public;
revoke all on function public.accept_chat_request(uuid, uuid) from anon;
revoke all on function public.accept_chat_request(uuid, uuid) from authenticated;
grant execute on function public.accept_chat_request(uuid, uuid) to service_role;

revoke all on function public.decline_chat_request(uuid, uuid, text) from public;
revoke all on function public.decline_chat_request(uuid, uuid, text) from anon;
revoke all on function public.decline_chat_request(uuid, uuid, text) from authenticated;
grant execute on function public.decline_chat_request(uuid, uuid, text) to service_role;

revoke all on function public.cancel_chat_request(uuid, uuid, text) from public;
revoke all on function public.cancel_chat_request(uuid, uuid, text) from anon;
revoke all on function public.cancel_chat_request(uuid, uuid, text) from authenticated;
grant execute on function public.cancel_chat_request(uuid, uuid, text) to service_role;

revoke all on function public.expire_pending_chat_requests(timestamptz) from public;
revoke all on function public.expire_pending_chat_requests(timestamptz) from anon;
revoke all on function public.expire_pending_chat_requests(timestamptz) from authenticated;
grant execute on function public.expire_pending_chat_requests(timestamptz) to service_role;
