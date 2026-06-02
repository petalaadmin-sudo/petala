-- Pix/Paggue purchase completion must be a single transactional database
-- operation. This RPC only completes a canonical pending transaction previously
-- created by /api/pix/criar, then creates paid/bonus lots and ledger entries.
-- It never uses legacy credit_petals and never creates a completed fallback
-- transaction without a pending Pix row.

create or replace function public.complete_pix_purchase_with_lots(
  p_user_id uuid,
  p_gateway_id text,
  p_amount_brl numeric,
  p_paid_petals integer,
  p_bonus_petals integer default 0,
  p_package_name text default null,
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gateway_id text := nullif(btrim(p_gateway_id), '');
  v_idempotency_key text := nullif(btrim(p_idempotency_key), '');
  v_input_package_name text := nullif(btrim(coalesce(p_package_name, '')), '');
  v_bonus_petals integer := coalesce(p_bonus_petals, 0);
  v_total_petals integer;
  v_input_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_pending_metadata jsonb;
  v_metadata jsonb;
  v_paid_lot_metadata jsonb;
  v_bonus_lot_metadata jsonb;
  v_existing_tx record;
  v_matching_tx_count integer;
  v_pending_paid_petals integer;
  v_pending_bonus_petals integer;
  v_pending_total_petals integer;
  v_pending_amount_brl numeric;
  v_package_name text;
  v_existing_paid_lot_id uuid;
  v_existing_bonus_lot_id uuid;
  v_existing_paid_ledger_id uuid;
  v_existing_bonus_ledger_id uuid;
  v_balance integer;
  v_new_balance integer;
  v_transaction_id uuid;
  v_paid_lot_id uuid;
  v_bonus_lot_id uuid;
  v_paid_ledger_id uuid;
  v_bonus_ledger_id uuid;
  v_processed_at timestamptz := now();
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Usuario obrigatorio', 'code', 'INVALID_USER');
  end if;

  if v_gateway_id is null then
    return jsonb_build_object('success', false, 'error', 'gateway_id obrigatorio', 'code', 'INVALID_GATEWAY_ID');
  end if;

  if v_idempotency_key is null then
    return jsonb_build_object('success', false, 'error', 'idempotency_key obrigatoria', 'code', 'INVALID_IDEMPOTENCY_KEY');
  end if;

  if v_idempotency_key <> ('pix:' || v_gateway_id) then
    return jsonb_build_object('success', false, 'error', 'idempotency_key incompativel com gateway Pix', 'code', 'INVALID_IDEMPOTENCY_KEY');
  end if;

  if p_amount_brl is null or p_amount_brl <= 0 then
    return jsonb_build_object('success', false, 'error', 'amount_brl invalido', 'code', 'INVALID_AMOUNT_BRL');
  end if;

  if p_paid_petals is null or p_paid_petals <= 0 then
    return jsonb_build_object('success', false, 'error', 'paid_petals invalido', 'code', 'INVALID_PAID_PETALS');
  end if;

  if v_bonus_petals < 0 then
    return jsonb_build_object('success', false, 'error', 'bonus_petals invalido', 'code', 'INVALID_BONUS_PETALS');
  end if;

  if jsonb_typeof(v_input_metadata) <> 'object' then
    return jsonb_build_object('success', false, 'error', 'metadata deve ser objeto json', 'code', 'INVALID_METADATA');
  end if;

  v_total_petals := p_paid_petals + v_bonus_petals;

  perform pg_advisory_xact_lock(hashtext(v_idempotency_key)::bigint);

  select count(*)
  into v_matching_tx_count
  from public.transactions t
  where t.idempotency_key = v_idempotency_key
     or t.gateway_id = v_gateway_id;

  if v_matching_tx_count > 1 then
    return jsonb_build_object(
      'success', false,
      'error', 'Mais de uma transacao encontrada para este Pix',
      'code', 'PIX_TRANSACTION_CONFLICT'
    );
  end if;

  select t.*
  into v_existing_tx
  from public.transactions t
  where t.idempotency_key = v_idempotency_key
     or t.gateway_id = v_gateway_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Transacao Pix pending nao encontrada',
      'code', 'PIX_PENDING_NOT_FOUND'
    );
  end if;

  if v_existing_tx.status = 'completed' then
    if v_existing_tx.user_id = p_user_id
       and v_existing_tx.type = 'purchase'
       and v_existing_tx.petals_delta = v_total_petals
       and v_existing_tx.gateway_id is not distinct from v_gateway_id
       and v_existing_tx.idempotency_key is not distinct from v_idempotency_key
       and v_existing_tx.amount_brl is not distinct from p_amount_brl
       and (v_existing_tx.metadata->>'source_type') = 'pix_purchase'
       and (v_existing_tx.metadata->>'source_id') = v_gateway_id
       and nullif(btrim(coalesce(v_existing_tx.metadata->>'package_name', '')), '') is not null then

      select l.id
      into v_existing_paid_lot_id
      from public.user_petal_lots l
      where l.idempotency_key = v_idempotency_key || ':paid';

      select l.id
      into v_existing_paid_ledger_id
      from public.user_petal_ledger l
      where l.idempotency_key = v_idempotency_key || ':paid:ledger';

      if v_bonus_petals > 0 then
        select l.id
        into v_existing_bonus_lot_id
        from public.user_petal_lots l
        where l.idempotency_key = v_idempotency_key || ':bonus';

        select l.id
        into v_existing_bonus_ledger_id
        from public.user_petal_ledger l
        where l.idempotency_key = v_idempotency_key || ':bonus:ledger';
      end if;

      if v_existing_paid_lot_id is null
         or v_existing_paid_ledger_id is null
         or (v_bonus_petals > 0 and (v_existing_bonus_lot_id is null or v_existing_bonus_ledger_id is null)) then
        return jsonb_build_object(
          'success', false,
          'error', 'Registro idempotente incompleto',
          'code', 'IDEMPOTENCY_RECORD_INCOMPLETE',
          'transaction_id', v_existing_tx.id,
          'paid_lot_id', v_existing_paid_lot_id,
          'bonus_lot_id', v_existing_bonus_lot_id,
          'paid_ledger_id', v_existing_paid_ledger_id,
          'bonus_ledger_id', v_existing_bonus_ledger_id
        );
      end if;

      select u.balance_petals
      into v_balance
      from public.users u
      where u.id = p_user_id;

      return jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'new_balance', coalesce(v_balance, v_existing_tx.balance_after),
        'transaction_id', v_existing_tx.id,
        'paid_lot_id', v_existing_paid_lot_id,
        'bonus_lot_id', v_existing_bonus_lot_id,
        'paid_ledger_id', v_existing_paid_ledger_id,
        'bonus_ledger_id', v_existing_bonus_ledger_id,
        'total_petals', v_total_petals,
        'paid_petals', p_paid_petals,
        'bonus_petals', v_bonus_petals
      );
    end if;

    return jsonb_build_object(
      'success', false,
      'error', 'Pix ja completado com parametros diferentes',
      'code', 'PIX_COMPLETED_CONFLICT',
      'transaction_id', v_existing_tx.id
    );
  end if;

  if v_existing_tx.status <> 'pending' then
    return jsonb_build_object(
      'success', false,
      'error', 'Transacao Pix nao esta pending',
      'code', 'PIX_TRANSACTION_NOT_PENDING',
      'transaction_id', v_existing_tx.id,
      'status', v_existing_tx.status
    );
  end if;

  v_pending_metadata := coalesce(v_existing_tx.metadata, '{}'::jsonb);
  v_package_name := coalesce(v_input_package_name, nullif(btrim(coalesce(v_pending_metadata->>'package_name', '')), ''));

  if v_package_name is null then
    return jsonb_build_object('success', false, 'error', 'package_name obrigatorio', 'code', 'INVALID_PACKAGE_NAME');
  end if;

  v_pending_paid_petals := case
    when coalesce(v_pending_metadata->>'paid_petals', '') ~ '^[0-9]+$'
      then (v_pending_metadata->>'paid_petals')::integer
    else null
  end;

  v_pending_bonus_petals := case
    when coalesce(v_pending_metadata->>'bonus_petals', '') ~ '^[0-9]+$'
      then (v_pending_metadata->>'bonus_petals')::integer
    else null
  end;

  v_pending_total_petals := case
    when coalesce(v_pending_metadata->>'total_petals', '') ~ '^[0-9]+$'
      then (v_pending_metadata->>'total_petals')::integer
    else null
  end;

  v_pending_amount_brl := case
    when coalesce(v_pending_metadata->>'amount_brl', '') ~ '^[0-9]+(\.[0-9]+)?$'
      then (v_pending_metadata->>'amount_brl')::numeric
    else null
  end;

  if v_pending_paid_petals is null
     or v_pending_bonus_petals is null
     or v_pending_total_petals is null
     or v_pending_amount_brl is null then
    return jsonb_build_object(
      'success', false,
      'error', 'Metadata da transacao Pix pending incompleta',
      'code', 'PIX_PENDING_METADATA_INCOMPLETE',
      'transaction_id', v_existing_tx.id
    );
  end if;

  if v_existing_tx.user_id <> p_user_id
     or v_existing_tx.type <> 'purchase'
     or v_existing_tx.gateway_id is distinct from v_gateway_id
     or v_existing_tx.idempotency_key is distinct from v_idempotency_key
     or v_existing_tx.petals_delta <> v_total_petals
     or v_existing_tx.amount_brl is distinct from p_amount_brl
     or v_existing_tx.amount_brl <= 0
     or v_pending_paid_petals <> p_paid_petals
     or v_pending_bonus_petals <> v_bonus_petals
     or v_pending_total_petals <> v_total_petals
     or v_pending_amount_brl is distinct from p_amount_brl then
    return jsonb_build_object(
      'success', false,
      'error', 'Transacao Pix pending incompativel',
      'code', 'PIX_PENDING_CONFLICT',
      'transaction_id', v_existing_tx.id
    );
  end if;

  v_metadata := v_pending_metadata || v_input_metadata || jsonb_build_object(
    'provider', 'paggue',
    'source_type', 'pix_purchase',
    'source_id', v_gateway_id,
    'gateway_id', v_gateway_id,
    'package_name', v_package_name,
    'amount_brl', p_amount_brl,
    'paid_petals', p_paid_petals,
    'bonus_petals', v_bonus_petals,
    'total_petals', v_total_petals,
    'idempotency_key', v_idempotency_key,
    'paid_eligible_for_creator_payout', true,
    'paid_eligible_for_agency_commission', true,
    'bonus_eligible_for_creator_payout', false,
    'bonus_eligible_for_agency_commission', false,
    'processed_at', v_processed_at
  );

  v_paid_lot_metadata := v_metadata || jsonb_build_object(
    'lot_kind', 'paid',
    'source_type', 'pix_purchase_paid',
    'eligible_for_creator_payout', true,
    'eligible_for_agency_commission', true
  );

  v_bonus_lot_metadata := v_metadata || jsonb_build_object(
    'lot_kind', 'bonus',
    'source_type', 'pix_purchase_bonus',
    'eligible_for_creator_payout', false,
    'eligible_for_agency_commission', false
  );

  select u.balance_petals
  into v_balance
  from public.users u
  where u.id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Usuario nao encontrado', 'code', 'USER_NOT_FOUND');
  end if;

  v_new_balance := v_balance + v_total_petals;

  update public.users
  set balance_petals = v_new_balance,
      updated_at = now()
  where id = p_user_id;

  update public.transactions
  set status = 'completed',
      balance_after = v_new_balance,
      amount_brl = p_amount_brl,
      gateway_id = v_gateway_id,
      metadata = v_metadata,
      idempotency_key = v_idempotency_key
  where id = v_existing_tx.id
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
    'pix_purchase_paid',
    v_gateway_id,
    p_paid_petals,
    p_paid_petals,
    true,
    true,
    null,
    v_paid_lot_metadata,
    v_idempotency_key || ':paid'
  )
  returning id into v_paid_lot_id;

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
    v_paid_lot_id,
    v_transaction_id,
    p_paid_petals,
    v_balance + p_paid_petals,
    'pix_purchase_paid',
    v_gateway_id,
    v_idempotency_key,
    v_idempotency_key || ':paid:ledger',
    true,
    true,
    v_paid_lot_metadata || jsonb_build_object('operation', 'credit')
  )
  returning id into v_paid_ledger_id;

  if v_bonus_petals > 0 then
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
      'pix_purchase_bonus',
      v_gateway_id,
      v_bonus_petals,
      v_bonus_petals,
      false,
      false,
      null,
      v_bonus_lot_metadata,
      v_idempotency_key || ':bonus'
    )
    returning id into v_bonus_lot_id;

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
      v_bonus_lot_id,
      v_transaction_id,
      v_bonus_petals,
      v_new_balance,
      'pix_purchase_bonus',
      v_gateway_id,
      v_idempotency_key,
      v_idempotency_key || ':bonus:ledger',
      false,
      false,
      v_bonus_lot_metadata || jsonb_build_object('operation', 'credit')
    )
    returning id into v_bonus_ledger_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id,
    'paid_lot_id', v_paid_lot_id,
    'bonus_lot_id', v_bonus_lot_id,
    'paid_ledger_id', v_paid_ledger_id,
    'bonus_ledger_id', v_bonus_ledger_id,
    'total_petals', v_total_petals,
    'paid_petals', p_paid_petals,
    'bonus_petals', v_bonus_petals
  );
end;
$$;

revoke all on function public.complete_pix_purchase_with_lots(uuid, text, numeric, integer, integer, text, text, jsonb) from public;
revoke all on function public.complete_pix_purchase_with_lots(uuid, text, numeric, integer, integer, text, text, jsonb) from anon;
revoke all on function public.complete_pix_purchase_with_lots(uuid, text, numeric, integer, integer, text, text, jsonb) from authenticated;
grant execute on function public.complete_pix_purchase_with_lots(uuid, text, numeric, integer, integer, text, text, jsonb) to service_role;
