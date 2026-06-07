-- Canonical creator earnings for gifts.
-- Gifts keep using lot-aware spending, but creator remuneration is now recorded
-- in creator_earnings using the same 850 eligible petals = US$ 1 model used by
-- chat text and video minutes.

create or replace function public.record_creator_earning_from_gift(
  p_gift_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gift record;
  v_existing record;
  v_source_type text := 'gift';
  v_rate integer := 850;
  v_agency_rate numeric(5, 4) := 0.30;
  v_amount_usd numeric(12, 6);
  v_agency_commission_usd numeric(12, 6);
  v_earning_id uuid;
begin
  if p_gift_id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'INVALID_GIFT_ID'
    );
  end if;

  perform pg_advisory_xact_lock(hashtext('creator_earning:gift:' || p_gift_id::text)::bigint);

  select
    g.id as gift_id,
    g.from_user_id,
    g.to_creator_id,
    g.session_id,
    g.gift_type,
    g.gift_emoji,
    g.petals_spent,
    g.transaction_id,
    g.idempotency_key,
    coalesce(g.eligible_petals_spent, 0)::integer as eligible_petals_spent,
    coalesce(g.non_eligible_petals_spent, 0)::integer as non_eligible_petals_spent,
    coalesce(g.agency_eligible_petals_spent, 0)::integer as agency_eligible_petals_spent,
    g.created_at,
    c.user_id as creator_user_id,
    c.agency_id
  into v_gift
  from public.gifts g
  join public.creators c on c.id = g.to_creator_id
  where g.id = p_gift_id
  for update of g;

  if v_gift.gift_id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'GIFT_NOT_FOUND'
    );
  end if;

  select id, status, amount_usd, eligible_petals
  into v_existing
  from public.creator_earnings
  where source_type = v_source_type
    and (
      source_id = v_gift.gift_id
      or source_ref_id = v_gift.gift_id
    )
  limit 1;

  if v_existing.id is not null then
    return jsonb_build_object(
      'success', true,
      'created', false,
      'idempotent', true,
      'earning_id', v_existing.id,
      'amount_usd', v_existing.amount_usd,
      'eligible_petals', v_existing.eligible_petals,
      'status', v_existing.status
    );
  end if;

  if v_gift.idempotency_key is not null then
    select id, status, amount_usd, eligible_petals, source_id
    into v_existing
    from public.creator_earnings
    where source_type = v_source_type
      and (
        idempotency_key = v_gift.idempotency_key
        or source_idempotency_key = v_gift.idempotency_key
      )
    limit 1;

    if v_existing.id is not null then
      if v_existing.source_id = v_gift.gift_id then
        return jsonb_build_object(
          'success', true,
          'created', false,
          'idempotent', true,
          'earning_id', v_existing.id,
          'amount_usd', v_existing.amount_usd,
          'eligible_petals', v_existing.eligible_petals,
          'status', v_existing.status
        );
      end if;

      return jsonb_build_object(
        'success', false,
        'error', 'GIFT_EARNING_IDEMPOTENCY_CONFLICT',
        'earning_id', v_existing.id
      );
    end if;
  end if;

  if v_gift.eligible_petals_spent <= 0 then
    return jsonb_build_object(
      'success', true,
      'created', false,
      'skipped', true,
      'reason', 'no_eligible_petals',
      'gift_id', v_gift.gift_id,
      'eligible_petals', v_gift.eligible_petals_spent
    );
  end if;

  if v_gift.petals_spent <> (v_gift.eligible_petals_spent + v_gift.non_eligible_petals_spent) then
    return jsonb_build_object(
      'success', false,
      'error', 'GIFT_ELIGIBILITY_MISMATCH',
      'gift_id', v_gift.gift_id,
      'petals_spent', v_gift.petals_spent,
      'eligible_petals', v_gift.eligible_petals_spent,
      'non_eligible_petals', v_gift.non_eligible_petals_spent
    );
  end if;

  if v_gift.agency_eligible_petals_spent > v_gift.eligible_petals_spent then
    return jsonb_build_object(
      'success', false,
      'error', 'AGENCY_ELIGIBILITY_MISMATCH',
      'gift_id', v_gift.gift_id,
      'eligible_petals', v_gift.eligible_petals_spent,
      'agency_eligible_petals', v_gift.agency_eligible_petals_spent
    );
  end if;

  v_amount_usd := round((v_gift.eligible_petals_spent::numeric / v_rate::numeric), 6);
  v_agency_commission_usd := case
    when v_gift.agency_id is null then 0
    else round((v_gift.agency_eligible_petals_spent::numeric / v_rate::numeric) * v_agency_rate, 6)
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
  )
  values (
    v_gift.to_creator_id,
    v_gift.creator_user_id,
    v_gift.from_user_id,
    v_gift.agency_id,
    v_source_type,
    v_gift.gift_id,
    v_gift.gift_id,
    v_gift.idempotency_key,
    v_gift.idempotency_key,
    v_gift.eligible_petals_spent,
    v_gift.petals_spent,
    v_gift.eligible_petals_spent,
    v_gift.non_eligible_petals_spent,
    v_gift.agency_eligible_petals_spent,
    v_rate,
    v_amount_usd,
    v_amount_usd,
    v_agency_rate,
    v_agency_commission_usd,
    true,
    'pending',
    null,
    jsonb_build_object(
      'source', 'gift',
      'gift_id', v_gift.gift_id,
      'session_id', v_gift.session_id,
      'gift_type', v_gift.gift_type,
      'gift_emoji', v_gift.gift_emoji,
      'gift_petals', v_gift.petals_spent,
      'transaction_id', v_gift.transaction_id,
      'agency_commission_uses_agency_eligible_petals', true,
      'agency_commission_suppressed_no_agency', v_gift.agency_id is null
    )
  )
  returning id into v_earning_id;

  return jsonb_build_object(
    'success', true,
    'created', true,
    'idempotent', false,
    'earning_id', v_earning_id,
    'amount_usd', v_amount_usd,
    'eligible_petals', v_gift.eligible_petals_spent,
    'agency_eligible_petals', v_gift.agency_eligible_petals_spent,
    'agency_commission_usd', v_agency_commission_usd,
    'status', 'pending'
  );
end;
$$;

revoke all on function public.record_creator_earning_from_gift(uuid) from public;
revoke all on function public.record_creator_earning_from_gift(uuid) from anon;
revoke all on function public.record_creator_earning_from_gift(uuid) from authenticated;
grant execute on function public.record_creator_earning_from_gift(uuid) to service_role;

create or replace function public.send_gift(
  p_from_user uuid,
  p_to_creator uuid,
  p_gift_type text,
  p_gift_emoji text,
  p_petals integer,
  p_session_id uuid default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_balance integer;
  v_gift_id uuid;
  v_message_id uuid;
  v_transaction_id uuid;
  v_spend jsonb;
  v_eligible_spent integer := 0;
  v_non_eligible_spent integer := 0;
  v_agency_eligible_spent integer := 0;
  v_earning_result jsonb;
  v_existing_gift record;
begin
  if p_from_user is null or p_to_creator is null then
    return jsonb_build_object('success', false, 'error', 'INVALID_PARTICIPANTS');
  end if;

  if p_petals is null or p_petals <= 0 then
    return jsonb_build_object('success', false, 'error', 'INVALID_GIFT_AMOUNT');
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 then
    return jsonb_build_object('success', false, 'error', 'INVALID_IDEMPOTENCY_KEY');
  end if;

  select
    g.id,
    g.message_id,
    g.transaction_id,
    g.petals_spent,
    g.eligible_petals_spent,
    g.non_eligible_petals_spent,
    g.agency_eligible_petals_spent
  into v_existing_gift
  from public.gifts g
  where g.idempotency_key = p_idempotency_key
    and g.from_user_id = p_from_user
  limit 1;

  if v_existing_gift.id is not null then
    if coalesce(v_existing_gift.eligible_petals_spent, 0) > 0 then
      v_earning_result := public.record_creator_earning_from_gift(v_existing_gift.id);

      if not coalesce((v_earning_result->>'success')::boolean, false) then
        raise exception 'GIFT_CREATOR_EARNING_FAILED gift_id=% result=%', v_existing_gift.id, v_earning_result::text;
      end if;
    else
      v_earning_result := jsonb_build_object(
        'success', true,
        'created', false,
        'skipped', true,
        'reason', 'no_eligible_petals'
      );
    end if;

    select balance_petals
    into v_user_balance
    from public.users
    where id = p_from_user;

    return jsonb_build_object(
      'success', true,
      'idempotent', true,
      'gift_id', v_existing_gift.id,
      'message_id', v_existing_gift.message_id,
      'transaction_id', v_existing_gift.transaction_id,
      'petals_spent', v_existing_gift.petals_spent,
      'eligible_petals_spent', coalesce(v_existing_gift.eligible_petals_spent, 0),
      'non_eligible_petals_spent', coalesce(v_existing_gift.non_eligible_petals_spent, 0),
      'agency_eligible_petals_spent', coalesce(v_existing_gift.agency_eligible_petals_spent, 0),
      'creator_earning_result', v_earning_result,
      'new_balance', coalesce(v_user_balance, 0)
    );
  end if;

  perform pg_advisory_xact_lock(hashtext('gift:' || p_idempotency_key)::bigint);

  select
    g.id,
    g.message_id,
    g.transaction_id,
    g.petals_spent,
    g.eligible_petals_spent,
    g.non_eligible_petals_spent,
    g.agency_eligible_petals_spent
  into v_existing_gift
  from public.gifts g
  where g.idempotency_key = p_idempotency_key
    and g.from_user_id = p_from_user
  limit 1;

  if v_existing_gift.id is not null then
    if coalesce(v_existing_gift.eligible_petals_spent, 0) > 0 then
      v_earning_result := public.record_creator_earning_from_gift(v_existing_gift.id);

      if not coalesce((v_earning_result->>'success')::boolean, false) then
        raise exception 'GIFT_CREATOR_EARNING_FAILED gift_id=% result=%', v_existing_gift.id, v_earning_result::text;
      end if;
    else
      v_earning_result := jsonb_build_object(
        'success', true,
        'created', false,
        'skipped', true,
        'reason', 'no_eligible_petals'
      );
    end if;

    select balance_petals
    into v_user_balance
    from public.users
    where id = p_from_user;

    return jsonb_build_object(
      'success', true,
      'idempotent', true,
      'gift_id', v_existing_gift.id,
      'message_id', v_existing_gift.message_id,
      'transaction_id', v_existing_gift.transaction_id,
      'petals_spent', v_existing_gift.petals_spent,
      'eligible_petals_spent', coalesce(v_existing_gift.eligible_petals_spent, 0),
      'non_eligible_petals_spent', coalesce(v_existing_gift.non_eligible_petals_spent, 0),
      'agency_eligible_petals_spent', coalesce(v_existing_gift.agency_eligible_petals_spent, 0),
      'creator_earning_result', v_earning_result,
      'new_balance', coalesce(v_user_balance, 0)
    );
  end if;

  v_spend := public.spend_petals_with_eligibility(
    p_from_user,
    p_petals,
    'gift',
    p_idempotency_key
  );

  if not coalesce((v_spend->>'success')::boolean, false) then
    return jsonb_build_object(
      'success', false,
      'error', coalesce(v_spend->>'error', 'SPEND_FAILED')
    );
  end if;

  v_eligible_spent := coalesce((v_spend->>'eligible_petals_spent')::integer, 0);
  v_non_eligible_spent := coalesce((v_spend->>'non_eligible_petals_spent')::integer, 0);
  v_agency_eligible_spent := coalesce((v_spend->>'agency_eligible_petals_spent')::integer, 0);
  v_transaction_id := nullif(v_spend->>'transaction_id', '')::uuid;
  v_user_balance := coalesce((v_spend->>'new_balance')::integer, 0);

  if p_petals <> (v_eligible_spent + v_non_eligible_spent) then
    raise exception 'GIFT_ELIGIBILITY_MISMATCH petals=% eligible=% non_eligible=%',
      p_petals,
      v_eligible_spent,
      v_non_eligible_spent;
  end if;

  if v_agency_eligible_spent > v_eligible_spent then
    raise exception 'AGENCY_ELIGIBILITY_MISMATCH eligible=% agency_eligible=%',
      v_eligible_spent,
      v_agency_eligible_spent;
  end if;

  insert into public.gifts (
    from_user_id,
    to_creator_id,
    session_id,
    gift_type,
    gift_emoji,
    petals_spent,
    creator_petals_earned,
    transaction_id,
    idempotency_key,
    eligible_petals_spent,
    non_eligible_petals_spent,
    agency_eligible_petals_spent
  )
  values (
    p_from_user,
    p_to_creator,
    p_session_id,
    p_gift_type,
    p_gift_emoji,
    p_petals,
    0,
    v_transaction_id,
    p_idempotency_key,
    v_eligible_spent,
    v_non_eligible_spent,
    v_agency_eligible_spent
  )
  returning id into v_gift_id;

  insert into public.chat_messages (
    sender_id,
    receiver_id,
    content,
    message_type,
    gift_id,
    metadata
  )
  values (
    p_from_user,
    (select user_id from public.creators where id = p_to_creator),
    p_gift_emoji || ' Presente enviado!',
    'gift',
    v_gift_id,
    jsonb_build_object(
      'gift_type', p_gift_type,
      'gift_emoji', p_gift_emoji,
      'petals_spent', p_petals,
      'eligible_petals_spent', v_eligible_spent,
      'non_eligible_petals_spent', v_non_eligible_spent,
      'agency_eligible_petals_spent', v_agency_eligible_spent,
      'creator_earning_model', 'creator_earnings',
      'creator_earning_rate_petals_per_usd', 850
    )
  )
  returning id into v_message_id;

  update public.gifts
  set message_id = v_message_id
  where id = v_gift_id;

  update public.creators
  set
    total_gifts = total_gifts + 1,
    updated_at = now()
  where id = p_to_creator;

  v_earning_result := public.record_creator_earning_from_gift(v_gift_id);

  if not coalesce((v_earning_result->>'success')::boolean, false) then
    raise exception 'GIFT_CREATOR_EARNING_FAILED gift_id=% result=%', v_gift_id, v_earning_result::text;
  end if;

  if v_eligible_spent > 0 and coalesce((v_earning_result->>'skipped')::boolean, false) then
    raise exception 'GIFT_CREATOR_EARNING_SKIPPED_WITH_ELIGIBLE_PETALS gift_id=% result=%', v_gift_id, v_earning_result::text;
  end if;

  update public.transactions
  set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'gift_id', v_gift_id,
    'gift_message_id', v_message_id,
    'gift_type', p_gift_type,
    'gift_emoji', p_gift_emoji,
    'eligible_petals_spent', v_eligible_spent,
    'non_eligible_petals_spent', v_non_eligible_spent,
    'agency_eligible_petals_spent', v_agency_eligible_spent,
    'creator_earning_result', v_earning_result
  )
  where id = v_transaction_id;

  return jsonb_build_object(
    'success', true,
    'idempotent', false,
    'gift_id', v_gift_id,
    'message_id', v_message_id,
    'transaction_id', v_transaction_id,
    'petals_spent', p_petals,
    'eligible_petals_spent', v_eligible_spent,
    'non_eligible_petals_spent', v_non_eligible_spent,
    'agency_eligible_petals_spent', v_agency_eligible_spent,
    'creator_earning_result', v_earning_result,
    'new_balance', v_user_balance
  );
exception
  when unique_violation then
    raise;
end;
$$;

revoke all on function public.send_gift(uuid, uuid, text, text, integer, uuid, text) from public;
revoke all on function public.send_gift(uuid, uuid, text, text, integer, uuid, text) from anon;
revoke all on function public.send_gift(uuid, uuid, text, text, integer, uuid, text) from authenticated;
grant execute on function public.send_gift(uuid, uuid, text, text, integer, uuid, text) to service_role;
