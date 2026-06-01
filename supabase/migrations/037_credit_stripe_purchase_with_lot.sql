-- Stripe purchase crediting must be a single transactional database operation.
-- This RPC creates the completed transaction, petal lot, and ledger entry
-- together so the webhook never needs to perform a financial update afterward.

create or replace function public.credit_stripe_purchase_with_lot(
  p_user_id uuid,
  p_amount integer,
  p_stripe_session_id text,
  p_amount_brl numeric,
  p_package_name text,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stripe_session_id text := nullif(btrim(p_stripe_session_id), '');
  v_idempotency_key text := nullif(btrim(p_idempotency_key), '');
  v_input_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_metadata jsonb;
  v_existing_tx record;
  v_existing_lot_id uuid;
  v_existing_ledger_id uuid;
  v_balance integer;
  v_new_balance integer;
  v_transaction_id uuid;
  v_lot_id uuid;
  v_ledger_id uuid;
  v_processed_at timestamptz := now();
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Usuario obrigatorio', 'code', 'INVALID_USER');
  end if;

  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Valor invalido', 'code', 'INVALID_AMOUNT');
  end if;

  if v_stripe_session_id is null then
    return jsonb_build_object('success', false, 'error', 'stripe_session_id obrigatorio', 'code', 'INVALID_STRIPE_SESSION');
  end if;

  if v_idempotency_key is null then
    return jsonb_build_object('success', false, 'error', 'idempotency_key obrigatoria', 'code', 'INVALID_IDEMPOTENCY_KEY');
  end if;

  if v_idempotency_key <> ('stripe:' || v_stripe_session_id) then
    return jsonb_build_object('success', false, 'error', 'idempotency_key incompativel com sessao Stripe', 'code', 'INVALID_IDEMPOTENCY_KEY');
  end if;

  if p_amount_brl is null or p_amount_brl < 0 then
    return jsonb_build_object('success', false, 'error', 'amount_brl invalido', 'code', 'INVALID_AMOUNT_BRL');
  end if;

  if jsonb_typeof(v_input_metadata) <> 'object' then
    return jsonb_build_object('success', false, 'error', 'metadata deve ser objeto json', 'code', 'INVALID_METADATA');
  end if;

  v_metadata := v_input_metadata || jsonb_build_object(
    'provider', 'stripe',
    'source_type', 'stripe_purchase',
    'source_id', v_stripe_session_id,
    'stripe_session_id', v_stripe_session_id,
    'package_name', p_package_name,
    'amount_brl', p_amount_brl,
    'idempotency_key', v_idempotency_key,
    'eligible_for_creator_payout', true,
    'eligible_for_agency_commission', true,
    'credited_at', v_processed_at
  );

  perform pg_advisory_xact_lock(hashtext(v_idempotency_key)::bigint);

  select t.*
  into v_existing_tx
  from public.transactions t
  where t.idempotency_key = v_idempotency_key;

  if found then
    if v_existing_tx.status = 'completed'
       and v_existing_tx.user_id = p_user_id
       and v_existing_tx.type = 'purchase'
       and v_existing_tx.petals_delta = p_amount
       and v_existing_tx.gateway_id is not distinct from v_stripe_session_id
       and v_existing_tx.amount_brl is not distinct from p_amount_brl
       and (v_existing_tx.metadata->>'source_type') = 'stripe_purchase'
       and (v_existing_tx.metadata->>'source_id') = v_stripe_session_id then

      select l.id
      into v_existing_lot_id
      from public.user_petal_lots l
      where l.idempotency_key = v_idempotency_key;

      select l.id
      into v_existing_ledger_id
      from public.user_petal_ledger l
      where l.idempotency_key = v_idempotency_key || ':ledger';

      if v_existing_lot_id is null or v_existing_ledger_id is null then
        return jsonb_build_object(
          'success', false,
          'error', 'Registro idempotente incompleto',
          'code', 'IDEMPOTENCY_RECORD_INCOMPLETE',
          'transaction_id', v_existing_tx.id,
          'lot_id', v_existing_lot_id,
          'ledger_id', v_existing_ledger_id
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
        'lot_id', v_existing_lot_id,
        'ledger_id', v_existing_ledger_id
      );
    end if;

    return jsonb_build_object(
      'success', false,
      'error', 'idempotency_key ja usada com parametros diferentes',
      'code', 'IDEMPOTENCY_KEY_CONFLICT',
      'transaction_id', v_existing_tx.id
    );
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
    amount_brl,
    gateway_id,
    ref_id,
    status,
    metadata,
    idempotency_key
  ) values (
    p_user_id,
    'purchase',
    p_amount,
    v_new_balance,
    p_amount_brl,
    v_stripe_session_id,
    null,
    'completed',
    v_metadata,
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
    'stripe_purchase',
    v_stripe_session_id,
    p_amount,
    p_amount,
    true,
    true,
    null,
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
    'stripe_purchase',
    v_stripe_session_id,
    v_idempotency_key,
    v_idempotency_key || ':ledger',
    true,
    true,
    v_metadata || jsonb_build_object('operation', 'credit')
  )
  returning id into v_ledger_id;

  return jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id,
    'lot_id', v_lot_id,
    'ledger_id', v_ledger_id
  );
end;
$$;

revoke all on function public.credit_stripe_purchase_with_lot(uuid, integer, text, numeric, text, text, jsonb) from public;
revoke all on function public.credit_stripe_purchase_with_lot(uuid, integer, text, numeric, text, text, jsonb) from anon;
revoke all on function public.credit_stripe_purchase_with_lot(uuid, integer, text, numeric, text, text, jsonb) from authenticated;
grant execute on function public.credit_stripe_purchase_with_lot(uuid, integer, text, numeric, text, text, jsonb) to service_role;
