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
  v_new_balance integer;
  v_charged_now integer := 0;
  v_total_charged integer := 0;
  v_total_eligible integer := 0;
  v_total_non_eligible integer := 0;
  v_total_agency_eligible integer := 0;
  v_spend_result jsonb;
  v_earning_result jsonb;
  v_charge_id uuid;
  v_eligible_spent integer;
  v_non_eligible_spent integer;
  v_agency_eligible_spent integer;
  v_paid_until_seconds integer;
  v_effective_ended_at timestamptz;
begin
  select *
  into v_session
  from public.chat_sessions
  where id = p_session_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Sessao invalida', 'code', 'INVALID_SESSION');
  end if;

  if v_session.user_id <> p_user_id then
    return jsonb_build_object('success', false, 'error', 'Usuario nao autorizado para esta sessao', 'code', 'UNAUTHORIZED');
  end if;

  if v_session.type <> 'text' then
    return jsonb_build_object('success', false, 'error', 'Cobranca de minutos nesta funcao e exclusiva para chat texto', 'code', 'INVALID_SESSION_TYPE');
  end if;

  if v_session.ended_at is not null then
    select coalesce(sum(amount_petals), 0)::integer
    into v_total_charged
    from public.chat_minute_charges
    where session_id = p_session_id and status = 'charged';

    return jsonb_build_object(
      'success', false,
      'error', 'Sessao encerrada',
      'code', 'SESSION_ENDED',
      'session_ended', true,
      'duration_seconds', v_session.duration_seconds,
      'petals_charged', greatest(v_session.petals_charged, v_total_charged)
    );
  end if;

  v_duration_seconds := greatest(0, floor(extract(epoch from now() - v_session.started_at))::integer);
  v_due_minutes := greatest(1, floor(v_duration_seconds / 60.0)::integer + 1);

  for v_minute in 1..v_due_minutes loop
    v_amount := case when v_minute = 1 then 10 else 50 end;
    v_idempotency_key := format('chat_text_minute:%s:%s', p_session_id, v_minute);
    v_existing_status := null;

    select status
    into v_existing_status
    from public.chat_minute_charges
    where session_id = p_session_id and minute_number = v_minute;

    if v_existing_status = 'charged' then
      continue;
    end if;

    if v_existing_status = 'failed_insufficient_balance' then
      v_paid_until_seconds := greatest(0, (v_minute - 1) * 60);
      v_effective_ended_at := v_session.started_at + make_interval(secs => v_paid_until_seconds);

      select coalesce(sum(amount_petals), 0)::integer
      into v_total_charged
      from public.chat_minute_charges
      where session_id = p_session_id and status = 'charged';

      update public.chat_sessions
      set ended_at = v_effective_ended_at,
          duration_seconds = v_paid_until_seconds,
          petals_charged = v_total_charged
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
        'duration_seconds', v_paid_until_seconds,
        'paid_until_seconds', v_paid_until_seconds,
        'effective_ended_at', v_effective_ended_at,
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

    v_spend_result := public.spend_petals_with_eligibility(
      p_user_id => p_user_id,
      p_amount => v_amount,
      p_type => 'spend',
      p_source_type => 'chat_text_minute',
      p_idempotency_key => v_idempotency_key,
      p_source_id => p_session_id::text,
      p_ref_id => p_session_id,
      p_metadata => jsonb_build_object(
        'source', 'chat_text_minute',
        'session_id', p_session_id,
        'creator_id', v_session.creator_id,
        'minute_number', v_minute
      ),
      p_materialize_legacy => true
    );

    if not coalesce((v_spend_result->>'success')::boolean, false) then
      if v_spend_result->>'code' = 'INSUFFICIENT_BALANCE' then
        v_paid_until_seconds := greatest(0, (v_minute - 1) * 60);
        v_effective_ended_at := v_session.started_at + make_interval(secs => v_paid_until_seconds);

        insert into public.chat_minute_charges (
          session_id, user_id, creator_id, minute_number, amount_petals,
          status, idempotency_key, failure_reason
        ) values (
          p_session_id, p_user_id, v_session.creator_id, v_minute, v_amount,
          'failed_insufficient_balance', v_idempotency_key, 'Saldo insuficiente'
        );

        select coalesce(sum(amount_petals), 0)::integer
        into v_total_charged
        from public.chat_minute_charges
        where session_id = p_session_id and status = 'charged';

        update public.chat_sessions
        set ended_at = v_effective_ended_at,
            duration_seconds = v_paid_until_seconds,
            petals_charged = v_total_charged
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
          'current_balance', (v_spend_result->>'new_balance')::integer,
          'duration_seconds', v_paid_until_seconds,
          'paid_until_seconds', v_paid_until_seconds,
          'effective_ended_at', v_effective_ended_at,
          'petals_charged', v_total_charged
        );
      end if;

      insert into public.chat_minute_charges (
        session_id, user_id, creator_id, minute_number, amount_petals,
        status, idempotency_key, failure_reason
      ) values (
        p_session_id, p_user_id, v_session.creator_id, v_minute, v_amount,
        'failed', v_idempotency_key, coalesce(v_spend_result->>'error', 'Falha ao cobrar minuto')
      );

      return jsonb_build_object(
        'success', false,
        'error', coalesce(v_spend_result->>'error', 'Falha ao cobrar minuto'),
        'code', coalesce(v_spend_result->>'code', 'CHAT_BILLING_FAILED'),
        'failed_minute', v_minute
      );
    end if;

    v_new_balance := (v_spend_result->>'new_balance')::integer;
    v_eligible_spent := coalesce((v_spend_result->>'eligible_petals_spent')::integer, 0);
    v_non_eligible_spent := coalesce((v_spend_result->>'non_eligible_petals_spent')::integer, 0);
    v_agency_eligible_spent := coalesce((v_spend_result->>'agency_eligible_petals_spent')::integer, 0);

    insert into public.chat_minute_charges (
      session_id, user_id, creator_id, minute_number, amount_petals,
      status, idempotency_key, charged_at,
      eligible_petals_spent, non_eligible_petals_spent, agency_eligible_petals_spent
    ) values (
      p_session_id, p_user_id, v_session.creator_id, v_minute, v_amount,
      'charged', v_idempotency_key, now(),
      v_eligible_spent, v_non_eligible_spent, v_agency_eligible_spent
    )
    returning id into v_charge_id;

    v_earning_result := public.record_creator_earning_from_chat_minute(v_charge_id);

    if not coalesce((v_earning_result->>'success')::boolean, false) then
      raise exception 'CREATOR_EARNING_FAILED charge_id=% result=%', v_charge_id, v_earning_result::text;
    end if;

    v_charged_now := v_charged_now + v_amount;
  end loop;

  select
    coalesce(sum(amount_petals), 0)::integer,
    coalesce(sum(eligible_petals_spent), 0)::integer,
    coalesce(sum(non_eligible_petals_spent), 0)::integer,
    coalesce(sum(agency_eligible_petals_spent), 0)::integer
  into v_total_charged, v_total_eligible, v_total_non_eligible, v_total_agency_eligible
  from public.chat_minute_charges
  where session_id = p_session_id and status = 'charged';

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
    'duration_seconds', v_duration_seconds,
    'eligible_petals_charged', v_total_eligible,
    'non_eligible_petals_charged', v_total_non_eligible,
    'agency_eligible_petals_charged', v_total_agency_eligible
  );
end;
$$;

revoke all on function public.charge_chat_text_due_minutes(uuid, uuid) from public;
revoke all on function public.charge_chat_text_due_minutes(uuid, uuid) from anon;
revoke all on function public.charge_chat_text_due_minutes(uuid, uuid) from authenticated;
grant execute on function public.charge_chat_text_due_minutes(uuid, uuid) to service_role;
