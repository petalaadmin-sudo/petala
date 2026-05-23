create extension if not exists "uuid-ossp";

create table if not exists public.creator_earnings (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.creators(id),
  creator_user_id uuid not null references public.users(id),
  agency_id uuid references public.agencies(id),
  source_type text not null,
  source_ref_id uuid,
  source_id uuid,
  idempotency_key text,
  source_idempotency_key text,
  petals_amount integer not null,
  gross_petals integer,
  eligible_petals integer,
  non_eligible_petals integer default 0,
  agency_eligible_petals integer default 0,
  usd_rate_petals_per_usd integer default 850,
  usd_amount numeric not null,
  amount_usd numeric(12,6),
  agency_commission_rate numeric(5,4) default 0.30,
  agency_commission_usd numeric(12,6) default 0,
  eligible_for_payout boolean not null,
  status text not null default 'pending',
  available_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creator_earnings
  add column if not exists user_id uuid references public.users(id),
  add column if not exists source_id uuid,
  add column if not exists source_idempotency_key text,
  add column if not exists gross_petals integer,
  add column if not exists eligible_petals integer,
  add column if not exists non_eligible_petals integer default 0,
  add column if not exists agency_eligible_petals integer default 0,
  add column if not exists usd_rate_petals_per_usd integer default 850,
  add column if not exists amount_usd numeric(12,6),
  add column if not exists agency_commission_rate numeric(5,4) default 0.30,
  add column if not exists agency_commission_usd numeric(12,6) default 0,
  add column if not exists available_at timestamptz,
  add column if not exists updated_at timestamptz default now();

update public.creator_earnings
set
  gross_petals = coalesce(gross_petals, petals_amount),
  eligible_petals = coalesce(
    eligible_petals,
    case when eligible_for_payout then petals_amount else 0 end
  ),
  non_eligible_petals = coalesce(
    non_eligible_petals,
    case when eligible_for_payout then 0 else petals_amount end,
    0
  ),
  agency_eligible_petals = coalesce(agency_eligible_petals, 0),
  usd_rate_petals_per_usd = coalesce(usd_rate_petals_per_usd, 850),
  amount_usd = coalesce(amount_usd, usd_amount),
  agency_commission_rate = coalesce(agency_commission_rate, 0.30),
  agency_commission_usd = coalesce(agency_commission_usd, 0),
  updated_at = coalesce(updated_at, created_at, now()),
  metadata = coalesce(metadata, '{}'::jsonb);

with unique_refs as (
  select source_type, source_ref_id
  from public.creator_earnings
  where source_ref_id is not null
  group by source_type, source_ref_id
  having count(*) = 1
)
update public.creator_earnings ce
set source_id = ce.source_ref_id
from unique_refs ur
where ce.source_id is null
  and ce.source_type = ur.source_type
  and ce.source_ref_id = ur.source_ref_id;

update public.creator_earnings
set source_idempotency_key = 'legacy_creator_earning:' || id::text
where nullif(btrim(source_idempotency_key), '') is null;

with unique_old_keys as (
  select source_type, nullif(btrim(idempotency_key), '') as old_key
  from public.creator_earnings
  where nullif(btrim(idempotency_key), '') is not null
  group by source_type, nullif(btrim(idempotency_key), '')
  having count(*) = 1
)
update public.creator_earnings ce
set source_idempotency_key = uk.old_key
from unique_old_keys uk
where ce.source_type = uk.source_type
  and nullif(btrim(ce.idempotency_key), '') = uk.old_key
  and ce.source_idempotency_key = 'legacy_creator_earning:' || ce.id::text
  and not exists (
    select 1
    from public.creator_earnings other
    where other.id <> ce.id
      and other.source_type = ce.source_type
      and other.source_idempotency_key = uk.old_key
  );

create index if not exists idx_creator_earnings_creator_status_created
  on public.creator_earnings (creator_id, status, created_at desc);

create index if not exists idx_creator_earnings_agency_status_created
  on public.creator_earnings (agency_id, status, created_at desc)
  where agency_id is not null;

create index if not exists idx_creator_earnings_available
  on public.creator_earnings (status, available_at)
  where status in ('pending', 'available');

create unique index if not exists idx_creator_earnings_source_type_source_id_unique
  on public.creator_earnings (source_type, source_id)
  where source_id is not null;

create unique index if not exists idx_creator_earnings_source_type_source_idempotency_unique
  on public.creator_earnings (source_type, source_idempotency_key)
  where source_idempotency_key is not null;

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
    and (source_id = p_charge_id or source_ref_id = p_charge_id)
  limit 1;

  if found then
    return jsonb_build_object(
      'success', true,
      'idempotent_replay', true,
      'created', false,
      'earning_id', v_existing.id,
      'amount_usd', coalesce(v_existing.amount_usd, v_existing.usd_amount),
      'agency_commission_usd', coalesce(v_existing.agency_commission_usd, 0),
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
        'amount_usd', coalesce(v_existing.amount_usd, v_existing.usd_amount),
        'agency_commission_usd', coalesce(v_existing.agency_commission_usd, 0),
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
