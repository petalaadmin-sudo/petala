-- Idempotent per-minute billing for text chat sessions.

create extension if not exists "uuid-ossp";

create table if not exists public.chat_minute_charges (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id),
  creator_id uuid not null references public.creators(id),
  minute_number integer not null check (minute_number >= 1),
  amount_petals integer not null check (amount_petals > 0),
  status text not null check (status in ('charged', 'failed_insufficient_balance', 'failed')),
  idempotency_key text not null unique,
  charged_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_chat_minute_charges_session_minute
  on public.chat_minute_charges (session_id, minute_number);

create index if not exists idx_chat_minute_charges_session_id
  on public.chat_minute_charges (session_id);

create index if not exists idx_chat_minute_charges_user_created
  on public.chat_minute_charges (user_id, created_at desc);

create index if not exists idx_chat_minute_charges_creator_created
  on public.chat_minute_charges (creator_id, created_at desc);

alter table public.chat_minute_charges enable row level security;

create or replace function public.charge_chat_text_due_minutes(
  p_session_id uuid,
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_duration_seconds integer;
  v_due_minutes integer;
  v_minute integer;
  v_amount integer;
  v_idempotency_key text;
  v_existing_status text;
  v_balance integer;
  v_new_balance integer;
  v_charged_now integer := 0;
  v_total_charged integer := 0;
begin
  select *
  into v_session
  from public.chat_sessions
  where id = p_session_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Sessao invalida',
      'code', 'INVALID_SESSION'
    );
  end if;

  if v_session.user_id <> p_user_id then
    return jsonb_build_object(
      'success', false,
      'error', 'Usuario nao autorizado para esta sessao',
      'code', 'UNAUTHORIZED'
    );
  end if;

  if v_session.type <> 'text' then
    return jsonb_build_object(
      'success', false,
      'error', 'Cobranca de minutos nesta funcao e exclusiva para chat texto',
      'code', 'INVALID_SESSION_TYPE'
    );
  end if;

  if v_session.ended_at is not null then
    select coalesce(sum(amount_petals), 0)::integer
    into v_total_charged
    from public.chat_minute_charges
    where session_id = p_session_id
      and status = 'charged';

    return jsonb_build_object(
      'success', false,
      'error', 'Sessao encerrada',
      'code', 'SESSION_ENDED',
      'session_ended', true,
      'duration_seconds', v_session.duration_seconds,
      'petals_charged', greatest(v_session.petals_charged, v_total_charged)
    );
  end if;

  v_duration_seconds := greatest(
    0,
    floor(extract(epoch from now() - v_session.started_at))::integer
  );
  v_due_minutes := greatest(1, floor(v_duration_seconds / 60.0)::integer + 1);

  for v_minute in 1..v_due_minutes loop
    v_amount := case when v_minute = 1 then 10 else 50 end;
    v_idempotency_key := format('chat_text_minute:%s:%s', p_session_id, v_minute);
    v_existing_status := null;

    select status
    into v_existing_status
    from public.chat_minute_charges
    where session_id = p_session_id
      and minute_number = v_minute;

    if v_existing_status = 'charged' then
      continue;
    end if;

    if v_existing_status = 'failed_insufficient_balance' then
      select coalesce(sum(amount_petals), 0)::integer
      into v_total_charged
      from public.chat_minute_charges
      where session_id = p_session_id
        and status = 'charged';

      update public.chat_sessions
      set ended_at = coalesce(ended_at, now()),
          duration_seconds = coalesce(duration_seconds, v_duration_seconds),
          petals_charged = greatest(petals_charged, v_total_charged)
      where id = p_session_id;

      update public.creator_presence
      set in_session = false
      where creator_id = v_session.creator_id;

      return jsonb_build_object(
        'success', false,
        'error', 'Saldo insuficiente',
        'code', 'INSUFFICIENT_BALANCE',
        'session_ended', true,
        'failed_minute', v_minute,
        'required', v_amount,
        'duration_seconds', v_duration_seconds,
        'petals_charged', v_total_charged
      );
    end if;

    if v_existing_status = 'failed' then
      return jsonb_build_object(
        'success', false,
        'error', 'Cobranca anterior falhou para este minuto',
        'code', 'MINUTE_CHARGE_FAILED',
        'failed_minute', v_minute
      );
    end if;

    select balance_petals
    into v_balance
    from public.users
    where id = p_user_id
    for update;

    if not found then
      return jsonb_build_object(
        'success', false,
        'error', 'Usuario nao encontrado',
        'code', 'USER_NOT_FOUND'
      );
    end if;

    if v_balance < v_amount then
      insert into public.chat_minute_charges (
        session_id,
        user_id,
        creator_id,
        minute_number,
        amount_petals,
        status,
        idempotency_key,
        failure_reason
      ) values (
        p_session_id,
        p_user_id,
        v_session.creator_id,
        v_minute,
        v_amount,
        'failed_insufficient_balance',
        v_idempotency_key,
        'Saldo insuficiente'
      );

      select coalesce(sum(amount_petals), 0)::integer
      into v_total_charged
      from public.chat_minute_charges
      where session_id = p_session_id
        and status = 'charged';

      update public.chat_sessions
      set ended_at = now(),
          duration_seconds = v_duration_seconds,
          petals_charged = greatest(petals_charged, v_total_charged)
      where id = p_session_id;

      update public.creator_presence
      set in_session = false
      where creator_id = v_session.creator_id;

      return jsonb_build_object(
        'success', false,
        'error', 'Saldo insuficiente',
        'code', 'INSUFFICIENT_BALANCE',
        'session_ended', true,
        'failed_minute', v_minute,
        'required', v_amount,
        'current_balance', v_balance,
        'duration_seconds', v_duration_seconds,
        'petals_charged', v_total_charged
      );
    end if;

    v_new_balance := v_balance - v_amount;

    update public.users
    set balance_petals = v_new_balance,
        updated_at = now()
    where id = p_user_id;

    insert into public.transactions (
      user_id,
      type,
      petals_delta,
      balance_after,
      ref_id,
      metadata
    ) values (
      p_user_id,
      'spend',
      -v_amount,
      v_new_balance,
      p_session_id,
      jsonb_build_object(
        'source', 'chat_text_minute',
        'session_id', p_session_id,
        'minute_number', v_minute,
        'idempotency_key', v_idempotency_key
      )
    );

    insert into public.chat_minute_charges (
      session_id,
      user_id,
      creator_id,
      minute_number,
      amount_petals,
      status,
      idempotency_key,
      charged_at
    ) values (
      p_session_id,
      p_user_id,
      v_session.creator_id,
      v_minute,
      v_amount,
      'charged',
      v_idempotency_key,
      now()
    );

    v_charged_now := v_charged_now + v_amount;
  end loop;

  select coalesce(sum(amount_petals), 0)::integer
  into v_total_charged
  from public.chat_minute_charges
  where session_id = p_session_id
    and status = 'charged';

  update public.chat_sessions
  set petals_charged = v_total_charged
  where id = p_session_id;

  select balance_petals
  into v_new_balance
  from public.users
  where id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'due_minutes', v_due_minutes,
    'charged_now', v_charged_now,
    'petals_charged', v_total_charged,
    'new_balance', v_new_balance,
    'duration_seconds', v_duration_seconds
  );
end;
$$;

revoke all on function public.charge_chat_text_due_minutes(uuid, uuid) from public;
revoke all on function public.charge_chat_text_due_minutes(uuid, uuid) from anon;
revoke all on function public.charge_chat_text_due_minutes(uuid, uuid) from authenticated;
grant execute on function public.charge_chat_text_due_minutes(uuid, uuid) to service_role;
