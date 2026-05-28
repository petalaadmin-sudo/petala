-- Daily bonus eligibility fix.
-- Daily bonus credits must create a transaction, a user_petal_lot, and ledger
-- rows atomically through credit_petals_with_lot. Daily bonus petals are not
-- eligible for creator payout or agency commission.

create or replace function public.get_bonus_status(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_claim_dates date[] := array[]::date[];
  v_claim_date date;
  v_cursor_date date;
  v_previous_date date;
  v_run integer := 0;
  v_current_streak integer := 0;
  v_highest_streak integer := 0;
  v_total_claims integer := 0;
  v_can_claim boolean := true;
  v_next_streak integer;
  v_next_petals integer;
  v_next_claim_at timestamptz;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Usuario obrigatorio', 'code', 'INVALID_USER');
  end if;

  if not exists (select 1 from public.users u where u.id = p_user_id) then
    return jsonb_build_object('success', false, 'error', 'Usuario nao encontrado', 'code', 'USER_NOT_FOUND');
  end if;

  select coalesce(array_agg(d.claim_date order by d.claim_date), array[]::date[])
  into v_claim_dates
  from (
    select distinct right(t.idempotency_key, 10)::date as claim_date
    from public.transactions t
    where t.user_id = p_user_id
      and t.type = 'bonus'
      and t.status = 'completed'
      and t.idempotency_key like ('daily_bonus:' || p_user_id::text || ':%')
      and right(t.idempotency_key, 10) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  ) d;

  v_total_claims := coalesce(array_length(v_claim_dates, 1), 0);
  v_can_claim := not (v_today = any(v_claim_dates));

  foreach v_claim_date in array v_claim_dates loop
    if v_previous_date is null or v_claim_date = v_previous_date + 1 then
      v_run := v_run + 1;
    else
      v_run := 1;
    end if;

    v_highest_streak := greatest(v_highest_streak, v_run);
    v_previous_date := v_claim_date;
  end loop;

  v_cursor_date := case
    when v_can_claim then v_today - 1
    else v_today
  end;

  while v_cursor_date = any(v_claim_dates) loop
    v_current_streak := v_current_streak + 1;
    v_cursor_date := v_cursor_date - 1;
  end loop;

  v_next_streak := v_current_streak + 1;
  v_next_petals := case
    when v_next_streak >= 30 then 25
    when v_next_streak >= 14 then 15
    when v_next_streak >= 7 then 10
    when v_next_streak >= 3 then 7
    when v_next_streak = 2 then 6
    else 5
  end;

  v_next_claim_at := case
    when v_can_claim then now()
    else ((v_today + 1)::timestamp at time zone 'America/Sao_Paulo')
  end;

  return jsonb_build_object(
    'success', true,
    'can_claim', v_can_claim,
    'streak', v_current_streak,
    'highest_streak', v_highest_streak,
    'total_claims', v_total_claims,
    'next_claim_at', v_next_claim_at,
    'next_petals', v_next_petals
  );
end;
$$;

create or replace function public.claim_daily_bonus(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_idempotency_key text;
  v_claim_dates date[] := array[]::date[];
  v_claim_date date;
  v_cursor_date date;
  v_previous_streak integer := 0;
  v_total_claims integer := 0;
  v_streak integer;
  v_petals integer;
  v_existing_tx record;
  v_credit_result jsonb;
  v_new_balance integer;
  v_next_claim_at timestamptz := ((v_today + 1)::timestamp at time zone 'America/Sao_Paulo');
  v_streak_broken boolean := false;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Usuario obrigatorio', 'code', 'INVALID_USER');
  end if;

  if not exists (select 1 from public.users u where u.id = p_user_id) then
    return jsonb_build_object('success', false, 'error', 'Usuario nao encontrado', 'code', 'USER_NOT_FOUND');
  end if;

  v_idempotency_key := 'daily_bonus:' || p_user_id::text || ':' || v_today::text;

  perform pg_advisory_xact_lock(hashtext(v_idempotency_key)::bigint);

  select t.*
  into v_existing_tx
  from public.transactions t
  where t.idempotency_key = v_idempotency_key;

  if found then
    return jsonb_build_object(
      'success', true,
      'already_claimed', true,
      'idempotent_replay', true,
      'petals_earned', greatest(coalesce(v_existing_tx.petals_delta, 0), 0),
      'streak', null,
      'multiplier', 1,
      'streak_broken', false,
      'next_claim_at', v_next_claim_at,
      'is_milestone', false,
      'new_balance', v_existing_tx.balance_after,
      'transaction_id', v_existing_tx.id
    );
  end if;

  select coalesce(array_agg(d.claim_date order by d.claim_date), array[]::date[])
  into v_claim_dates
  from (
    select distinct right(t.idempotency_key, 10)::date as claim_date
    from public.transactions t
    where t.user_id = p_user_id
      and t.type = 'bonus'
      and t.status = 'completed'
      and t.idempotency_key like ('daily_bonus:' || p_user_id::text || ':%')
      and right(t.idempotency_key, 10) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  ) d;

  v_total_claims := coalesce(array_length(v_claim_dates, 1), 0);
  v_cursor_date := v_today - 1;

  while v_cursor_date = any(v_claim_dates) loop
    v_previous_streak := v_previous_streak + 1;
    v_cursor_date := v_cursor_date - 1;
  end loop;

  v_streak := v_previous_streak + 1;
  v_streak_broken := v_previous_streak = 0 and v_total_claims > 0;

  v_petals := case
    when v_streak >= 30 then 25
    when v_streak >= 14 then 15
    when v_streak >= 7 then 10
    when v_streak >= 3 then 7
    when v_streak = 2 then 6
    else 5
  end;

  v_credit_result := public.credit_petals_with_lot(
    p_user_id => p_user_id,
    p_amount => v_petals,
    p_type => 'bonus',
    p_source_type => 'daily_bonus',
    p_idempotency_key => v_idempotency_key,
    p_source_id => v_today::text,
    p_ref_id => null,
    p_eligible_for_creator_payout => false,
    p_eligible_for_agency_commission => false,
    p_expires_at => null,
    p_metadata => jsonb_build_object(
      'source_type', 'daily_bonus',
      'bonus_date', v_today,
      'timezone', 'America/Sao_Paulo',
      'streak_before', v_previous_streak,
      'streak_after', v_streak,
      'petals_earned', v_petals,
      'eligible_for_creator_payout', false,
      'eligible_for_agency_commission', false
    )
  );

  if not coalesce((v_credit_result->>'success')::boolean, false) then
    return v_credit_result || jsonb_build_object(
      'source_type', 'daily_bonus',
      'idempotency_key', v_idempotency_key
    );
  end if;

  v_new_balance := (v_credit_result->>'new_balance')::integer;

  return jsonb_build_object(
    'success', true,
    'already_claimed', false,
    'idempotent_replay', coalesce((v_credit_result->>'idempotent_replay')::boolean, false),
    'petals_earned', v_petals,
    'streak', v_streak,
    'multiplier', 1,
    'streak_broken', v_streak_broken,
    'next_claim_at', v_next_claim_at,
    'is_milestone', (v_streak in (3, 7, 14, 30)),
    'new_balance', v_new_balance,
    'lot_id', v_credit_result->>'lot_id',
    'transaction_id', v_credit_result->>'transaction_id'
  );
end;
$$;

revoke all on function public.get_bonus_status(uuid) from public;
revoke all on function public.get_bonus_status(uuid) from anon;
revoke all on function public.get_bonus_status(uuid) from authenticated;
grant execute on function public.get_bonus_status(uuid) to service_role;

revoke all on function public.claim_daily_bonus(uuid) from public;
revoke all on function public.claim_daily_bonus(uuid) from anon;
revoke all on function public.claim_daily_bonus(uuid) from authenticated;
grant execute on function public.claim_daily_bonus(uuid) to service_role;
