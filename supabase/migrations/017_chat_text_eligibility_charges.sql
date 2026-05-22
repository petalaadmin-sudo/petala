create or replace function public.spend_petals_with_eligibility(
  p_user_id uuid,
  p_amount integer,
  p_type public.transaction_type,
  p_source_type text,
  p_idempotency_key text,
  p_source_id text default null,
  p_ref_id uuid default null,
  p_metadata jsonb default '{}'::jsonb,
  p_materialize_legacy boolean default true
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source_type text := nullif(trim(p_source_type), '');
  v_idempotency_key text := nullif(trim(p_idempotency_key), '');
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_existing_tx record;
  v_balance integer;
  v_new_balance integer;
  v_available integer;
  v_remaining integer;
  v_take integer;
  v_lot record;
  v_transaction_id uuid;
  v_legacy_result jsonb;
  v_reconcile_result jsonb;
  v_eligible_spent integer := 0;
  v_non_eligible_spent integer := 0;
  v_agency_eligible_spent integer := 0;
  v_lots_consumed_count integer := 0;
  v_lots_consumed jsonb := '[]'::jsonb;
begin
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Valor invalido', 'code', 'INVALID_AMOUNT');
  end if;

  if v_source_type is null then
    return jsonb_build_object('success', false, 'error', 'source_type obrigatorio', 'code', 'INVALID_SOURCE_TYPE');
  end if;

  if v_idempotency_key is null then
    return jsonb_build_object('success', false, 'error', 'idempotency_key obrigatoria', 'code', 'INVALID_IDEMPOTENCY_KEY');
  end if;

  if jsonb_typeof(v_metadata) <> 'object' then
    return jsonb_build_object('success', false, 'error', 'metadata deve ser objeto json', 'code', 'INVALID_METADATA');
  end if;

  perform pg_advisory_xact_lock(hashtext(v_idempotency_key)::bigint);

  select t.*
  into v_existing_tx
  from public.transactions t
  where t.idempotency_key = v_idempotency_key;

  if found then
    if v_existing_tx.status = 'completed'
       and v_existing_tx.user_id = p_user_id
       and v_existing_tx.type = p_type
       and v_existing_tx.petals_delta = -p_amount
       and v_existing_tx.ref_id is not distinct from p_ref_id
       and (v_existing_tx.metadata->>'source_type') = v_source_type
       and (v_existing_tx.metadata->>'source_id') is not distinct from p_source_id then

      select
        coalesce(sum(case when l.eligible_for_creator_payout then -l.petals_delta else 0 end), 0)::integer,
        coalesce(sum(case when not l.eligible_for_creator_payout then -l.petals_delta else 0 end), 0)::integer,
        coalesce(sum(case when l.eligible_for_agency_commission then -l.petals_delta else 0 end), 0)::integer,
        count(*)::integer,
        coalesce(
          jsonb_agg(
            jsonb_build_object(
              'lot_id', l.lot_id,
              'petals_spent', -l.petals_delta,
              'eligible_for_creator_payout', l.eligible_for_creator_payout,
              'eligible_for_agency_commission', l.eligible_for_agency_commission
            )
            order by l.created_at, l.id
          ),
          '[]'::jsonb
        )
      into
        v_eligible_spent,
        v_non_eligible_spent,
        v_agency_eligible_spent,
        v_lots_consumed_count,
        v_lots_consumed
      from public.user_petal_ledger l
      where l.transaction_id = v_existing_tx.id;

      if v_lots_consumed_count = 0 then
        return jsonb_build_object('success', false, 'error', 'Registro idempotente incompleto', 'code', 'IDEMPOTENCY_RECORD_INCOMPLETE');
      end if;

      return jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'new_balance', v_existing_tx.balance_after,
        'eligible_petals_spent', v_eligible_spent,
        'non_eligible_petals_spent', v_non_eligible_spent,
        'agency_eligible_petals_spent', v_agency_eligible_spent,
        'lots_consumed', v_lots_consumed,
        'lots_consumed_count', v_lots_consumed_count,
        'transaction_id', v_existing_tx.id
      );
    end if;

    return jsonb_build_object('success', false, 'error', 'idempotency_key ja usada com parametros diferentes', 'code', 'IDEMPOTENCY_KEY_CONFLICT');
  end if;

  select u.balance_petals
  into v_balance
  from public.users u
  where u.id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Usuario nao encontrado', 'code', 'USER_NOT_FOUND');
  end if;

  if p_materialize_legacy then
    v_legacy_result := public.ensure_legacy_petal_lot(p_user_id);

    if not coalesce((v_legacy_result->>'success')::boolean, false) then
      return v_legacy_result;
    end if;
  end if;

  v_reconcile_result := public.reconcile_user_petal_balance(p_user_id);

  if not coalesce((v_reconcile_result->>'reconciled')::boolean, false) then
    return jsonb_build_object(
      'success', false,
      'error', 'Saldo e lotes divergentes',
      'code', 'BALANCE_LOT_MISMATCH',
      'reconciliation', v_reconcile_result
    );
  end if;

  select u.balance_petals
  into v_balance
  from public.users u
  where u.id = p_user_id
  for update;

  select coalesce(sum(l.amount_remaining), 0)::integer
  into v_available
  from public.user_petal_lots l
  where l.user_id = p_user_id
    and l.amount_remaining > 0
    and (l.expires_at is null or l.expires_at > now());

  if v_available < p_amount then
    return jsonb_build_object(
      'success', false,
      'idempotent_replay', false,
      'error', 'Saldo insuficiente',
      'code', 'INSUFFICIENT_BALANCE',
      'required', p_amount,
      'available_petals', v_available,
      'new_balance', v_balance,
      'eligible_petals_spent', 0,
      'non_eligible_petals_spent', 0,
      'agency_eligible_petals_spent', 0,
      'lots_consumed', '[]'::jsonb,
      'lots_consumed_count', 0
    );
  end if;

  v_new_balance := v_balance - p_amount;
  v_remaining := p_amount;

  insert into public.transactions (
    user_id,
    type,
    petals_delta,
    balance_after,
    ref_id,
    status,
    metadata,
    idempotency_key
  ) values (
    p_user_id,
    p_type,
    -p_amount,
    v_new_balance,
    p_ref_id,
    'completed',
    v_metadata || jsonb_build_object(
      'source_type', v_source_type,
      'source_id', p_source_id,
      'requested_amount', p_amount
    ),
    v_idempotency_key
  )
  returning id into v_transaction_id;

  for v_lot in
    select *
    from public.user_petal_lots
    where user_id = p_user_id
      and amount_remaining > 0
      and (expires_at is null or expires_at > now())
    order by
      case when source_type = 'legacy_balance' then 0 else 1 end,
      created_at,
      id
    for update
  loop
    exit when v_remaining <= 0;

    v_take := least(v_lot.amount_remaining, v_remaining);

    update public.user_petal_lots
    set amount_remaining = amount_remaining - v_take
    where id = v_lot.id;

    insert into public.user_petal_ledger (
      user_id,
      lot_id,
      transaction_id,
      petals_delta,
      balance_after,
      source_type,
      source_id,
      operation_key,
      idempotency_key,
      eligible_for_creator_payout,
      eligible_for_agency_commission,
      metadata
    ) values (
      p_user_id,
      v_lot.id,
      v_transaction_id,
      -v_take,
      v_new_balance,
      v_source_type,
      p_source_id,
      v_idempotency_key,
      format('%s:lot:%s', v_idempotency_key, v_lot.id),
      v_lot.eligible_for_creator_payout,
      v_lot.eligible_for_agency_commission,
      v_metadata || jsonb_build_object(
        'operation', 'spend',
        'petals_spent', v_take,
        'amount_remaining_before', v_lot.amount_remaining,
        'amount_remaining_after', v_lot.amount_remaining - v_take
      )
    );

    if v_lot.eligible_for_creator_payout then
      v_eligible_spent := v_eligible_spent + v_take;
    else
      v_non_eligible_spent := v_non_eligible_spent + v_take;
    end if;

    if v_lot.eligible_for_agency_commission then
      v_agency_eligible_spent := v_agency_eligible_spent + v_take;
    end if;

    v_lots_consumed_count := v_lots_consumed_count + 1;
    v_lots_consumed := v_lots_consumed || jsonb_build_array(jsonb_build_object(
      'lot_id', v_lot.id,
      'petals_spent', v_take,
      'eligible_for_creator_payout', v_lot.eligible_for_creator_payout,
      'eligible_for_agency_commission', v_lot.eligible_for_agency_commission
    ));

    v_remaining := v_remaining - v_take;
  end loop;

  if v_remaining <> 0 then
    raise exception 'Invariant failed: insufficient lots after precheck for operation %', v_idempotency_key;
  end if;

  update public.users
  set balance_petals = v_new_balance,
      updated_at = now()
  where id = p_user_id;

  update public.transactions
  set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'eligible_petals_spent', v_eligible_spent,
    'non_eligible_petals_spent', v_non_eligible_spent,
    'agency_eligible_petals_spent', v_agency_eligible_spent,
    'lots_consumed_count', v_lots_consumed_count
  )
  where id = v_transaction_id;

  return jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'new_balance', v_new_balance,
    'eligible_petals_spent', v_eligible_spent,
    'non_eligible_petals_spent', v_non_eligible_spent,
    'agency_eligible_petals_spent', v_agency_eligible_spent,
    'lots_consumed', v_lots_consumed,
    'lots_consumed_count', v_lots_consumed_count,
    'transaction_id', v_transaction_id
  );
end;
$$;

revoke all on function public.spend_petals_with_eligibility(uuid, integer, public.transaction_type, text, text, text, uuid, jsonb, boolean) from public;
revoke all on function public.spend_petals_with_eligibility(uuid, integer, public.transaction_type, text, text, text, uuid, jsonb, boolean) from anon;
revoke all on function public.spend_petals_with_eligibility(uuid, integer, public.transaction_type, text, text, text, uuid, jsonb, boolean) from authenticated;
grant execute on function public.spend_petals_with_eligibility(uuid, integer, public.transaction_type, text, text, text, uuid, jsonb, boolean) to service_role;

alter table public.chat_minute_charges
  add column if not exists eligible_petals_spent integer not null default 0,
  add column if not exists non_eligible_petals_spent integer not null default 0,
  add column if not exists agency_eligible_petals_spent integer not null default 0;

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
  v_eligible_spent integer;
  v_non_eligible_spent integer;
  v_agency_eligible_spent integer;
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
      select coalesce(sum(amount_petals), 0)::integer
      into v_total_charged
      from public.chat_minute_charges
      where session_id = p_session_id and status = 'charged';

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
          'current_balance', (v_spend_result->>'new_balance')::integer,
          'duration_seconds', v_duration_seconds,
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
    );

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
