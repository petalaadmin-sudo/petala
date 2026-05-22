create or replace function public.credit_petals_with_lot(
  p_user_id uuid,
  p_amount integer,
  p_type public.transaction_type,
  p_source_type text,
  p_idempotency_key text,
  p_source_id text default null,
  p_ref_id uuid default null,
  p_eligible_for_creator_payout boolean default false,
  p_eligible_for_agency_commission boolean default false,
  p_expires_at timestamptz default null,
  p_metadata jsonb default '{}'::jsonb
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
  v_lot_id uuid;
  v_transaction_id uuid;
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

  if p_eligible_for_agency_commission and not p_eligible_for_creator_payout then
    return jsonb_build_object('success', false, 'error', 'Comissao de agencia exige elegibilidade de creator', 'code', 'INVALID_ELIGIBILITY');
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
       and v_existing_tx.petals_delta = p_amount
       and v_existing_tx.ref_id is not distinct from p_ref_id
       and (v_existing_tx.metadata->>'source_type') = v_source_type
       and (v_existing_tx.metadata->>'source_id') is not distinct from p_source_id then

      select l.id
      into v_lot_id
      from public.user_petal_lots l
      where l.idempotency_key = v_idempotency_key;

      if v_lot_id is null then
        return jsonb_build_object('success', false, 'error', 'Registro idempotente incompleto', 'code', 'IDEMPOTENCY_RECORD_INCOMPLETE');
      end if;

      return jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'new_balance', v_existing_tx.balance_after,
        'lot_id', v_lot_id,
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

  v_new_balance := v_balance + p_amount;

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
    status,
    metadata,
    idempotency_key
  ) values (
    p_user_id,
    p_type,
    p_amount,
    v_new_balance,
    p_ref_id,
    'completed',
    v_metadata || jsonb_build_object(
      'source_type', v_source_type,
      'source_id', p_source_id,
      'idempotency_key', v_idempotency_key,
      'eligible_for_creator_payout', p_eligible_for_creator_payout,
      'eligible_for_agency_commission', p_eligible_for_agency_commission
    ),
    v_idempotency_key
  )
  returning id into v_transaction_id;

  insert into public.user_petal_lots (
    user_id,
    source_type,
    source_id,
    amount_original,
    amount_remaining,
    eligible_for_creator_payout,
    eligible_for_agency_commission,
    expires_at,
    metadata,
    idempotency_key
  ) values (
    p_user_id,
    v_source_type,
    p_source_id,
    p_amount,
    p_amount,
    p_eligible_for_creator_payout,
    p_eligible_for_agency_commission,
    p_expires_at,
    v_metadata,
    v_idempotency_key
  )
  returning id into v_lot_id;

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
    v_lot_id,
    v_transaction_id,
    p_amount,
    v_new_balance,
    v_source_type,
    p_source_id,
    v_idempotency_key,
    v_idempotency_key || ':ledger',
    p_eligible_for_creator_payout,
    p_eligible_for_agency_commission,
    v_metadata || jsonb_build_object('operation', 'credit')
  );

  return jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'new_balance', v_new_balance,
    'lot_id', v_lot_id,
    'transaction_id', v_transaction_id
  );
end;
$$;

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
    order by created_at, id
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

revoke all on function public.credit_petals_with_lot(uuid, integer, public.transaction_type, text, text, text, uuid, boolean, boolean, timestamptz, jsonb) from public;
revoke all on function public.credit_petals_with_lot(uuid, integer, public.transaction_type, text, text, text, uuid, boolean, boolean, timestamptz, jsonb) from anon;
revoke all on function public.credit_petals_with_lot(uuid, integer, public.transaction_type, text, text, text, uuid, boolean, boolean, timestamptz, jsonb) from authenticated;
grant execute on function public.credit_petals_with_lot(uuid, integer, public.transaction_type, text, text, text, uuid, boolean, boolean, timestamptz, jsonb) to service_role;

revoke all on function public.spend_petals_with_eligibility(uuid, integer, public.transaction_type, text, text, text, uuid, jsonb, boolean) from public;
revoke all on function public.spend_petals_with_eligibility(uuid, integer, public.transaction_type, text, text, text, uuid, jsonb, boolean) from anon;
revoke all on function public.spend_petals_with_eligibility(uuid, integer, public.transaction_type, text, text, text, uuid, jsonb, boolean) from authenticated;
grant execute on function public.spend_petals_with_eligibility(uuid, integer, public.transaction_type, text, text, text, uuid, jsonb, boolean) to service_role;
