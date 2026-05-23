-- Video Billing Core 1: manual RPCs for private video minute billing.
-- This migration is additive and does not connect video billing to APIs/frontends.

create or replace function public.record_creator_earning_from_session_minute(
  p_charge_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_charge record;
  v_existing record;
  v_source_type text;
  v_rate integer := 850;
  v_agency_rate numeric(5,4) := 0.30;
  v_amount_usd numeric(12,6);
  v_agency_commission_usd numeric(12,6);
  v_earning_id uuid;
begin
  if p_charge_id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'p_charge_id obrigatorio',
      'code', 'INVALID_CHARGE_ID'
    );
  end if;

  perform pg_advisory_xact_lock(hashtext('creator_earning:' || p_charge_id::text)::bigint);

  select
    c.id as charge_id,
    c.session_id,
    c.user_id,
    c.creator_id,
    c.minute_number,
    c.amount_petals,
    c.status,
    c.idempotency_key,
    c.eligible_petals_spent,
    c.non_eligible_petals_spent,
    c.agency_eligible_petals_spent,
    s.type as session_type,
    s.user_id as session_user_id,
    s.creator_id as session_creator_id,
    cr.user_id as creator_user_id,
    cr.agency_id
  into v_charge
  from public.chat_minute_charges c
  join public.chat_sessions s on s.id = c.session_id
  join public.creators cr on cr.id = c.creator_id
  where c.id = p_charge_id
  for update of c;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Charge nao encontrado',
      'code', 'CHARGE_NOT_FOUND'
    );
  end if;

  v_source_type := case v_charge.session_type::text
    when 'text' then 'chat_text_minute'
    when 'video' then 'chat_video_minute'
    else null
  end;

  if v_source_type is null then
    return jsonb_build_object(
      'success', false,
      'error', 'Tipo de sessao invalido para earning',
      'code', 'INVALID_SESSION_TYPE',
      'session_type', v_charge.session_type
    );
  end if;

  select *
  into v_existing
  from public.creator_earnings
  where source_type = v_source_type
    and (source_id = p_charge_id or source_ref_id = p_charge_id)
  limit 1;

  if found then
    return jsonb_build_object(
      'success', true,
      'idempotent_replay', true,
      'created', false,
      'earning_id', v_existing.id,
      'source_type', v_source_type,
      'amount_usd', coalesce(v_existing.amount_usd, v_existing.usd_amount),
      'agency_commission_usd', coalesce(v_existing.agency_commission_usd, 0),
      'status', v_existing.status
    );
  end if;

  if v_charge.status <> 'charged' then
    return jsonb_build_object(
      'success', true,
      'created', false,
      'skipped', true,
      'reason', 'charge_not_charged',
      'charge_status', v_charge.status,
      'source_type', v_source_type
    );
  end if;

  if v_charge.user_id <> v_charge.session_user_id
     or v_charge.creator_id <> v_charge.session_creator_id then
    return jsonb_build_object(
      'success', false,
      'error', 'Charge divergente da sessao',
      'code', 'CHARGE_SESSION_MISMATCH',
      'source_type', v_source_type
    );
  end if;

  if coalesce(v_charge.eligible_petals_spent, 0) <= 0 then
    return jsonb_build_object(
      'success', true,
      'created', false,
      'skipped', true,
      'reason', 'no_eligible_petals',
      'eligible_petals', 0,
      'source_type', v_source_type
    );
  end if;

  if v_charge.amount_petals <> coalesce(v_charge.eligible_petals_spent, 0)
                              + coalesce(v_charge.non_eligible_petals_spent, 0) then
    return jsonb_build_object(
      'success', false,
      'error', 'Elegibilidade divergente do valor cobrado',
      'code', 'CHARGE_ELIGIBILITY_MISMATCH',
      'source_type', v_source_type
    );
  end if;

  if coalesce(v_charge.agency_eligible_petals_spent, 0)
     > coalesce(v_charge.eligible_petals_spent, 0) then
    return jsonb_build_object(
      'success', false,
      'error', 'Agencia elegivel maior que elegivel da creator',
      'code', 'AGENCY_ELIGIBILITY_MISMATCH',
      'source_type', v_source_type
    );
  end if;

  select *
  into v_existing
  from public.creator_earnings
  where source_type = v_source_type
    and (
      source_idempotency_key = v_charge.idempotency_key
      or idempotency_key = v_charge.idempotency_key
    )
  limit 1;

  if found then
    if v_existing.source_id = p_charge_id or v_existing.source_ref_id = p_charge_id then
      return jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'created', false,
        'earning_id', v_existing.id,
        'source_type', v_source_type,
        'amount_usd', coalesce(v_existing.amount_usd, v_existing.usd_amount),
        'agency_commission_usd', coalesce(v_existing.agency_commission_usd, 0),
        'status', v_existing.status
      );
    end if;

    return jsonb_build_object(
      'success', false,
      'error', 'source_idempotency_key ja usada por outro source_id',
      'code', 'SOURCE_IDEMPOTENCY_KEY_CONFLICT',
      'source_type', v_source_type
    );
  end if;

  v_amount_usd := round((v_charge.eligible_petals_spent::numeric / v_rate::numeric), 6);
  v_agency_commission_usd := case
    when v_charge.agency_id is null then 0
    else round(
      (v_charge.agency_eligible_petals_spent::numeric / v_rate::numeric) * v_agency_rate,
      6
    )
  end;

  insert into public.creator_earnings (
    creator_id,
    creator_user_id,
    user_id,
    agency_id,
    source_type,
    source_ref_id,
    source_id,
    idempotency_key,
    source_idempotency_key,
    petals_amount,
    gross_petals,
    eligible_petals,
    non_eligible_petals,
    agency_eligible_petals,
    usd_rate_petals_per_usd,
    usd_amount,
    amount_usd,
    agency_commission_rate,
    agency_commission_usd,
    eligible_for_payout,
    status,
    available_at,
    metadata
  ) values (
    v_charge.creator_id,
    v_charge.creator_user_id,
    v_charge.user_id,
    v_charge.agency_id,
    v_source_type,
    v_charge.charge_id,
    v_charge.charge_id,
    v_charge.idempotency_key,
    v_charge.idempotency_key,
    v_charge.eligible_petals_spent,
    v_charge.amount_petals,
    v_charge.eligible_petals_spent,
    v_charge.non_eligible_petals_spent,
    v_charge.agency_eligible_petals_spent,
    v_rate,
    v_amount_usd,
    v_amount_usd,
    v_agency_rate,
    v_agency_commission_usd,
    true,
    'pending',
    null,
    jsonb_build_object(
      'session_id', v_charge.session_id,
      'session_type', v_charge.session_type,
      'charge_id', v_charge.charge_id,
      'minute_number', v_charge.minute_number,
      'chat_amount_petals', v_charge.amount_petals,
      'agency_commission_uses_agency_eligible_petals', true,
      'agency_commission_suppressed_no_agency', v_charge.agency_id is null
    )
  )
  returning id into v_earning_id;

  return jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'created', true,
    'earning_id', v_earning_id,
    'source_type', v_source_type,
    'creator_id', v_charge.creator_id,
    'agency_id', v_charge.agency_id,
    'amount_usd', v_amount_usd,
    'agency_commission_usd', v_agency_commission_usd,
    'status', 'pending'
  );
end;
$$;

revoke all on function public.record_creator_earning_from_session_minute(uuid) from public;
revoke all on function public.record_creator_earning_from_session_minute(uuid) from anon;
revoke all on function public.record_creator_earning_from_session_minute(uuid) from authenticated;
grant execute on function public.record_creator_earning_from_session_minute(uuid) to service_role;

create or replace function public.charge_chat_video_due_minutes(
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
  v_amount integer := 120;
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

  if v_session.type <> 'video' then
    return jsonb_build_object('success', false, 'error', 'Cobranca de minutos nesta funcao e exclusiva para video', 'code', 'INVALID_SESSION_TYPE');
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
    v_idempotency_key := format('chat_video_minute:%s:%s', p_session_id, v_minute);
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
      p_source_type => 'chat_video_minute',
      p_idempotency_key => v_idempotency_key,
      p_source_id => p_session_id::text,
      p_ref_id => p_session_id,
      p_metadata => jsonb_build_object(
        'source', 'chat_video_minute',
        'session_id', p_session_id,
        'creator_id', v_session.creator_id,
        'minute_number', v_minute,
        'price_petals_per_minute', v_amount
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
          'available_petals', (v_spend_result->>'available_petals')::integer,
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
        'failed', v_idempotency_key, coalesce(v_spend_result->>'error', 'Falha ao cobrar minuto de video')
      );

      return jsonb_build_object(
        'success', false,
        'error', coalesce(v_spend_result->>'error', 'Falha ao cobrar minuto de video'),
        'code', coalesce(v_spend_result->>'code', 'VIDEO_BILLING_FAILED'),
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

    v_earning_result := public.record_creator_earning_from_session_minute(v_charge_id);

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

revoke all on function public.charge_chat_video_due_minutes(uuid, uuid) from public;
revoke all on function public.charge_chat_video_due_minutes(uuid, uuid) from anon;
revoke all on function public.charge_chat_video_due_minutes(uuid, uuid) from authenticated;
grant execute on function public.charge_chat_video_due_minutes(uuid, uuid) to service_role;
