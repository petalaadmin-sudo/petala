create extension if not exists "uuid-ossp";

create table if not exists public.creator_earnings (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.creators(id),
  user_id uuid not null references public.users(id),
  agency_id uuid references public.agencies(id),
  source_type text not null,
  source_id uuid not null,
  source_idempotency_key text not null,
  gross_petals integer not null,
  eligible_petals integer not null,
  non_eligible_petals integer not null default 0,
  agency_eligible_petals integer not null default 0,
  usd_rate_petals_per_usd integer not null default 850,
  amount_usd numeric(12,6) not null,
  agency_commission_rate numeric(5,4) not null default 0.30,
  agency_commission_usd numeric(12,6) not null default 0,
  status text not null default 'pending',
  available_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,

  constraint creator_earnings_source_type_not_empty
    check (btrim(source_type) <> ''),
  constraint creator_earnings_source_idempotency_key_not_empty
    check (btrim(source_idempotency_key) <> ''),
  constraint creator_earnings_petals_check
    check (
      gross_petals > 0
      and eligible_petals > 0
      and non_eligible_petals >= 0
      and agency_eligible_petals >= 0
      and gross_petals = eligible_petals + non_eligible_petals
      and agency_eligible_petals <= eligible_petals
    ),
  constraint creator_earnings_usd_rate_check
    check (usd_rate_petals_per_usd > 0),
  constraint creator_earnings_amounts_check
    check (amount_usd >= 0 and agency_commission_usd >= 0),
  constraint creator_earnings_commission_rate_check
    check (agency_commission_rate >= 0 and agency_commission_rate <= 1),
  constraint creator_earnings_status_check
    check (status in ('pending', 'available', 'paid', 'reversed', 'blocked')),
  constraint creator_earnings_metadata_object_check
    check (jsonb_typeof(metadata) = 'object'),
  constraint creator_earnings_source_unique
    unique (source_type, source_id),
  constraint creator_earnings_source_idempotency_unique
    unique (source_type, source_idempotency_key)
);

create index if not exists idx_creator_earnings_creator_status_created
  on public.creator_earnings (creator_id, status, created_at desc);

create index if not exists idx_creator_earnings_agency_status_created
  on public.creator_earnings (agency_id, status, created_at desc)
  where agency_id is not null;

create index if not exists idx_creator_earnings_available
  on public.creator_earnings (status, available_at)
  where status in ('pending', 'available');

drop trigger if exists set_creator_earnings_updated_at
  on public.creator_earnings;

create trigger set_creator_earnings_updated_at
  before update on public.creator_earnings
  for each row execute procedure public.set_updated_at();

alter table public.creator_earnings enable row level security;

create or replace function public.record_creator_earning_from_chat_minute(
  p_charge_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_charge record;
  v_existing record;
  v_source_type text := 'chat_text_minute';
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

  select *
  into v_existing
  from public.creator_earnings
  where source_type = v_source_type
    and source_id = p_charge_id;

  if found then
    return jsonb_build_object(
      'success', true,
      'idempotent_replay', true,
      'created', false,
      'earning_id', v_existing.id,
      'amount_usd', v_existing.amount_usd,
      'agency_commission_usd', v_existing.agency_commission_usd,
      'status', v_existing.status
    );
  end if;

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
    s.user_id as session_user_id,
    s.creator_id as session_creator_id,
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

  if v_charge.status <> 'charged' then
    return jsonb_build_object(
      'success', true,
      'created', false,
      'skipped', true,
      'reason', 'charge_not_charged',
      'charge_status', v_charge.status
    );
  end if;

  if v_charge.user_id <> v_charge.session_user_id
     or v_charge.creator_id <> v_charge.session_creator_id then
    return jsonb_build_object(
      'success', false,
      'error', 'Charge divergente da sessao',
      'code', 'CHARGE_SESSION_MISMATCH'
    );
  end if;

  if coalesce(v_charge.eligible_petals_spent, 0) <= 0 then
    return jsonb_build_object(
      'success', true,
      'created', false,
      'skipped', true,
      'reason', 'no_eligible_petals',
      'eligible_petals', 0
    );
  end if;

  if v_charge.amount_petals <> coalesce(v_charge.eligible_petals_spent, 0)
                              + coalesce(v_charge.non_eligible_petals_spent, 0) then
    return jsonb_build_object(
      'success', false,
      'error', 'Elegibilidade divergente do valor cobrado',
      'code', 'CHARGE_ELIGIBILITY_MISMATCH'
    );
  end if;

  if coalesce(v_charge.agency_eligible_petals_spent, 0)
     > coalesce(v_charge.eligible_petals_spent, 0) then
    return jsonb_build_object(
      'success', false,
      'error', 'Agencia elegivel maior que elegivel da creator',
      'code', 'AGENCY_ELIGIBILITY_MISMATCH'
    );
  end if;

  select *
  into v_existing
  from public.creator_earnings
  where source_type = v_source_type
    and source_idempotency_key = v_charge.idempotency_key;

  if found then
    if v_existing.source_id = p_charge_id then
      return jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'created', false,
        'earning_id', v_existing.id,
        'amount_usd', v_existing.amount_usd,
        'agency_commission_usd', v_existing.agency_commission_usd,
        'status', v_existing.status
      );
    end if;

    return jsonb_build_object(
      'success', false,
      'error', 'source_idempotency_key ja usada por outro source_id',
      'code', 'SOURCE_IDEMPOTENCY_KEY_CONFLICT'
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
    user_id,
    agency_id,
    source_type,
    source_id,
    source_idempotency_key,
    gross_petals,
    eligible_petals,
    non_eligible_petals,
    agency_eligible_petals,
    usd_rate_petals_per_usd,
    amount_usd,
    agency_commission_rate,
    agency_commission_usd,
    status,
    available_at,
    metadata
  ) values (
    v_charge.creator_id,
    v_charge.user_id,
    v_charge.agency_id,
    v_source_type,
    v_charge.charge_id,
    v_charge.idempotency_key,
    v_charge.amount_petals,
    v_charge.eligible_petals_spent,
    v_charge.non_eligible_petals_spent,
    v_charge.agency_eligible_petals_spent,
    v_rate,
    v_amount_usd,
    v_agency_rate,
    v_agency_commission_usd,
    'pending',
    null,
    jsonb_build_object(
      'session_id', v_charge.session_id,
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
    'creator_id', v_charge.creator_id,
    'agency_id', v_charge.agency_id,
    'amount_usd', v_amount_usd,
    'agency_commission_usd', v_agency_commission_usd,
    'status', 'pending'
  );
end;
$$;

revoke all on function public.record_creator_earning_from_chat_minute(uuid) from public;
revoke all on function public.record_creator_earning_from_chat_minute(uuid) from anon;
revoke all on function public.record_creator_earning_from_chat_minute(uuid) from authenticated;
grant execute on function public.record_creator_earning_from_chat_minute(uuid) to service_role;
