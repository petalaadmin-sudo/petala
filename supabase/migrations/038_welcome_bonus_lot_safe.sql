-- Make the first-purchase referral welcome bonus lot-safe.
-- The legacy implementation used public.credit_petals, which updated
-- users.balance_petals without creating user_petal_lots/user_petal_ledger.
-- This keeps the existing on_first_purchase contract used by Pix, but routes
-- all welcome bonus credits through credit_petals_with_lot.

create or replace function public.release_welcome_bonus_with_lots(
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
  v_auth_email_confirmed_at timestamptz;
  v_email_verified boolean := false;
  v_ref record;
  v_referred_key text;
  v_referrer_key text;
  v_referred_credit jsonb;
  v_referrer_credit jsonb;
begin
  if p_user_id is null then
    return jsonb_build_object(
      'released', false,
      'success', false,
      'reason', 'user_id required',
      'code', 'INVALID_USER'
    );
  end if;

  select u.*
  into v_user
  from public.users u
  where u.id = p_user_id;

  if not found then
    return jsonb_build_object(
      'released', false,
      'success', false,
      'reason', 'user not found',
      'code', 'USER_NOT_FOUND'
    );
  end if;

  select au.email_confirmed_at
  into v_auth_email_confirmed_at
  from auth.users au
  where au.id = p_user_id;

  v_email_verified := v_auth_email_confirmed_at is not null;

  if not (v_email_verified or coalesce(v_user.phone_verified, false)) then
    return jsonb_build_object(
      'released', false,
      'success', true,
      'reason', 'not verified',
      'email_verified', v_email_verified,
      'phone_verified', coalesce(v_user.phone_verified, false)
    );
  end if;

  if not coalesce(v_user.first_purchase_done, false) then
    return jsonb_build_object(
      'released', false,
      'success', true,
      'reason', 'no purchase'
    );
  end if;

  select r.*
  into v_ref
  from public.referrals r
  where r.referred_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object(
      'released', false,
      'success', true,
      'reason', 'no pending referral'
    );
  end if;

  if coalesce(v_ref.blocked, false) then
    return jsonb_build_object(
      'released', false,
      'success', true,
      'reason', 'referral blocked',
      'referral_id', v_ref.id
    );
  end if;

  if v_ref.referred_type <> 'user' or v_ref.referrer_type <> 'user' then
    return jsonb_build_object(
      'released', false,
      'success', true,
      'reason', 'referral type not eligible',
      'referral_id', v_ref.id,
      'referred_type', v_ref.referred_type,
      'referrer_type', v_ref.referrer_type
    );
  end if;

  if v_ref.welcome_bonus_referred_paid and v_ref.welcome_bonus_referrer_paid then
    return jsonb_build_object(
      'released', false,
      'success', true,
      'idempotent_replay', true,
      'reason', 'already processed',
      'referral_id', v_ref.id
    );
  end if;

  if v_ref.welcome_bonus_referred_paid or v_ref.welcome_bonus_referrer_paid then
    return jsonb_build_object(
      'released', false,
      'success', false,
      'reason', 'partial legacy bonus state',
      'code', 'PARTIAL_BONUS_STATE',
      'referral_id', v_ref.id,
      'welcome_bonus_referred_paid', v_ref.welcome_bonus_referred_paid,
      'welcome_bonus_referrer_paid', v_ref.welcome_bonus_referrer_paid
    );
  end if;

  v_referred_key := 'welcome_bonus:referred:' || v_ref.id::text;
  v_referrer_key := 'welcome_bonus:referrer:' || v_ref.id::text;

  v_referred_credit := public.credit_petals_with_lot(
    p_user_id => p_user_id,
    p_amount => 50,
    p_type => 'bonus',
    p_source_type => 'welcome_bonus_referred',
    p_idempotency_key => v_referred_key,
    p_source_id => v_ref.id::text,
    p_ref_id => null,
    p_eligible_for_creator_payout => false,
    p_eligible_for_agency_commission => false,
    p_expires_at => null,
    p_metadata => jsonb_build_object(
      'source_type', 'welcome_bonus_referred',
      'referral_id', v_ref.id,
      'bonus_role', 'referred',
      'petals_earned', 50,
      'eligible_for_creator_payout', false,
      'eligible_for_agency_commission', false
    )
  );

  if not coalesce((v_referred_credit->>'success')::boolean, false) then
    raise exception 'Failed to credit referred welcome bonus: %', v_referred_credit;
  end if;

  v_referrer_credit := public.credit_petals_with_lot(
    p_user_id => v_ref.referrer_id,
    p_amount => 50,
    p_type => 'bonus',
    p_source_type => 'welcome_bonus_referrer',
    p_idempotency_key => v_referrer_key,
    p_source_id => v_ref.id::text,
    p_ref_id => null,
    p_eligible_for_creator_payout => false,
    p_eligible_for_agency_commission => false,
    p_expires_at => null,
    p_metadata => jsonb_build_object(
      'source_type', 'welcome_bonus_referrer',
      'referral_id', v_ref.id,
      'bonus_role', 'referrer',
      'petals_earned', 50,
      'eligible_for_creator_payout', false,
      'eligible_for_agency_commission', false
    )
  );

  if not coalesce((v_referrer_credit->>'success')::boolean, false) then
    raise exception 'Failed to credit referrer welcome bonus: %', v_referrer_credit;
  end if;

  update public.referrals
  set welcome_bonus_referred_paid = true,
      welcome_bonus_referrer_paid = true,
      welcome_bonus_paid_at = now(),
      referred_email_verified = v_email_verified,
      referred_first_purchase_done = true
  where id = v_ref.id;

  update public.users
  set referral_bonus_paid = true,
      updated_at = now()
  where id = p_user_id;

  return jsonb_build_object(
    'released', true,
    'success', true,
    'idempotent_replay',
      coalesce((v_referred_credit->>'idempotent_replay')::boolean, false)
      and coalesce((v_referrer_credit->>'idempotent_replay')::boolean, false),
    'referral_id', v_ref.id,
    'petals_each', 50,
    'referred', jsonb_build_object(
      'user_id', p_user_id,
      'idempotency_key', v_referred_key,
      'transaction_id', v_referred_credit->>'transaction_id',
      'lot_id', v_referred_credit->>'lot_id',
      'new_balance', v_referred_credit->>'new_balance'
    ),
    'referrer', jsonb_build_object(
      'user_id', v_ref.referrer_id,
      'idempotency_key', v_referrer_key,
      'transaction_id', v_referrer_credit->>'transaction_id',
      'lot_id', v_referrer_credit->>'lot_id',
      'new_balance', v_referrer_credit->>'new_balance'
    )
  );
end;
$$;

create or replace function public.try_release_welcome_bonus(
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.release_welcome_bonus_with_lots(p_user_id);
end;
$$;

create or replace function public.on_first_purchase(
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_already_done boolean;
  v_bonus_result jsonb;
begin
  if p_user_id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'Usuario obrigatorio',
      'code', 'INVALID_USER'
    );
  end if;

  select first_purchase_done
  into v_already_done
  from public.users
  where id = p_user_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Usuario nao encontrado',
      'code', 'USER_NOT_FOUND'
    );
  end if;

  update public.users
  set first_purchase_done = true,
      updated_at = now()
  where id = p_user_id;

  v_bonus_result := public.try_release_welcome_bonus(p_user_id);

  return jsonb_build_object(
    'success', true,
    'first_purchase_was_new', not coalesce(v_already_done, false),
    'bonus_result', v_bonus_result
  );
end;
$$;

revoke all on function public.release_welcome_bonus_with_lots(uuid) from public;
revoke all on function public.release_welcome_bonus_with_lots(uuid) from anon;
revoke all on function public.release_welcome_bonus_with_lots(uuid) from authenticated;
grant execute on function public.release_welcome_bonus_with_lots(uuid) to service_role;

revoke all on function public.try_release_welcome_bonus(uuid) from public;
revoke all on function public.try_release_welcome_bonus(uuid) from anon;
revoke all on function public.try_release_welcome_bonus(uuid) from authenticated;
grant execute on function public.try_release_welcome_bonus(uuid) to service_role;

revoke all on function public.on_first_purchase(uuid) from public;
revoke all on function public.on_first_purchase(uuid) from anon;
revoke all on function public.on_first_purchase(uuid) from authenticated;
grant execute on function public.on_first_purchase(uuid) to service_role;
