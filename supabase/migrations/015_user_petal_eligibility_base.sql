-- E.2.0.1A — Base passiva de elegibilidade das petalas do usuario.
-- Estruturas aditivas: nao conecta fluxos existentes nem altera cobrancas atuais.

create extension if not exists "uuid-ossp";

alter table public.transactions
  add column if not exists idempotency_key text;

create unique index if not exists idx_transactions_idempotency_key_unique
  on public.transactions (idempotency_key)
  where idempotency_key is not null;

create table if not exists public.user_petal_lots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  source_type text not null check (length(trim(source_type)) > 0),
  source_id text,
  amount_original integer not null check (amount_original > 0),
  amount_remaining integer not null check (amount_remaining >= 0),
  eligible_for_creator_payout boolean not null default false,
  eligible_for_agency_commission boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  idempotency_key text not null check (length(trim(idempotency_key)) > 0),

  constraint user_petal_lots_remaining_lte_original
    check (amount_remaining <= amount_original),

  constraint user_petal_lots_agency_requires_creator_eligible
    check ((not eligible_for_agency_commission) or eligible_for_creator_payout)
);

create unique index if not exists idx_user_petal_lots_idempotency_key
  on public.user_petal_lots (idempotency_key);

create index if not exists idx_user_petal_lots_available_fifo
  on public.user_petal_lots (user_id, created_at, id)
  where amount_remaining > 0;

create index if not exists idx_user_petal_lots_source
  on public.user_petal_lots (source_type, source_id)
  where source_id is not null;

create table if not exists public.user_petal_ledger (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  lot_id uuid not null references public.user_petal_lots(id),
  transaction_id uuid references public.transactions(id),
  petals_delta integer not null check (petals_delta <> 0),
  balance_after integer not null check (balance_after >= 0),
  source_type text not null check (length(trim(source_type)) > 0),
  source_id text,
  operation_key text not null check (length(trim(operation_key)) > 0),
  idempotency_key text not null check (length(trim(idempotency_key)) > 0),
  eligible_for_creator_payout boolean not null default false,
  eligible_for_agency_commission boolean not null default false,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,

  constraint user_petal_ledger_agency_requires_creator_eligible
    check ((not eligible_for_agency_commission) or eligible_for_creator_payout)
);

create unique index if not exists idx_user_petal_ledger_idempotency_key
  on public.user_petal_ledger (idempotency_key);

create unique index if not exists idx_user_petal_ledger_operation_lot
  on public.user_petal_ledger (operation_key, lot_id);

create index if not exists idx_user_petal_ledger_user_created
  on public.user_petal_ledger (user_id, created_at desc);

create index if not exists idx_user_petal_ledger_operation_key
  on public.user_petal_ledger (operation_key);

alter table public.user_petal_lots enable row level security;
alter table public.user_petal_ledger enable row level security;

drop policy if exists user_petal_lots_select_own on public.user_petal_lots;
create policy user_petal_lots_select_own on public.user_petal_lots
  for select
  using (auth.uid() = user_id);

drop policy if exists user_petal_ledger_select_own on public.user_petal_ledger;
create policy user_petal_ledger_select_own on public.user_petal_ledger
  for select
  using (auth.uid() = user_id);

create or replace function public.reconcile_user_petal_balance(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_lots_total integer;
  v_creator_eligible integer;
  v_agency_eligible integer;
  v_expired_remaining integer;
begin
  select u.balance_petals
  into v_balance
  from public.users u
  where u.id = p_user_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Usuario nao encontrado',
      'code', 'USER_NOT_FOUND'
    );
  end if;

  select
    coalesce(sum(l.amount_remaining), 0)::integer,
    coalesce(sum(case when l.eligible_for_creator_payout then l.amount_remaining else 0 end), 0)::integer,
    coalesce(sum(case when l.eligible_for_agency_commission then l.amount_remaining else 0 end), 0)::integer,
    coalesce(sum(case when l.expires_at is not null and l.expires_at <= now() then l.amount_remaining else 0 end), 0)::integer
  into
    v_lots_total,
    v_creator_eligible,
    v_agency_eligible,
    v_expired_remaining
  from public.user_petal_lots l
  where l.user_id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'balance_petals', v_balance,
    'lots_total', v_lots_total,
    'delta', v_balance - v_lots_total,
    'reconciled', v_balance = v_lots_total,
    'eligible_for_creator_payout_remaining', v_creator_eligible,
    'eligible_for_agency_commission_remaining', v_agency_eligible,
    'non_eligible_remaining', v_lots_total - v_creator_eligible,
    'expired_remaining', v_expired_remaining
  );
end;
$$;

create or replace function public.ensure_legacy_petal_lot(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_lots_total integer;
  v_amount integer;
  v_lot_id uuid;
  v_key text := 'legacy_balance:' || p_user_id::text;
begin
  select u.balance_petals
  into v_balance
  from public.users u
  where u.id = p_user_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Usuario nao encontrado',
      'code', 'USER_NOT_FOUND'
    );
  end if;

  select l.id
  into v_lot_id
  from public.user_petal_lots l
  where l.idempotency_key = v_key;

  if found then
    return jsonb_build_object(
      'success', true,
      'created', false,
      'reason', 'legacy_lot_already_exists',
      'lot_id', v_lot_id,
      'balance_petals', v_balance
    );
  end if;

  select coalesce(sum(l.amount_remaining), 0)::integer
  into v_lots_total
  from public.user_petal_lots l
  where l.user_id = p_user_id;

  v_amount := v_balance - v_lots_total;

  if v_amount <= 0 then
    return jsonb_build_object(
      'success', true,
      'created', false,
      'reason', case
        when v_amount = 0 then 'already_reconciled'
        else 'lots_exceed_balance'
      end,
      'amount', 0,
      'balance_petals', v_balance,
      'lots_total', v_lots_total,
      'delta', v_amount
    );
  end if;

  insert into public.user_petal_lots (
    user_id,
    source_type,
    source_id,
    amount_original,
    amount_remaining,
    eligible_for_creator_payout,
    eligible_for_agency_commission,
    metadata,
    idempotency_key
  ) values (
    p_user_id,
    'legacy_balance',
    p_user_id::text,
    v_amount,
    v_amount,
    false,
    false,
    jsonb_build_object(
      'materialized_as_non_eligible', true,
      'balance_petals_snapshot', v_balance,
      'lots_total_before', v_lots_total
    ),
    v_key
  )
  returning id into v_lot_id;

  insert into public.user_petal_ledger (
    user_id,
    lot_id,
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
    v_amount,
    v_balance,
    'legacy_balance',
    p_user_id::text,
    v_key,
    v_key || ':ledger',
    false,
    false,
    jsonb_build_object('materialized_as_non_eligible', true)
  );

  return jsonb_build_object(
    'success', true,
    'created', true,
    'lot_id', v_lot_id,
    'amount', v_amount,
    'balance_petals', v_balance,
    'lots_total_before', v_lots_total,
    'lots_total_after', v_lots_total + v_amount
  );
end;
$$;

revoke all on function public.reconcile_user_petal_balance(uuid) from public;
revoke all on function public.reconcile_user_petal_balance(uuid) from anon;
revoke all on function public.reconcile_user_petal_balance(uuid) from authenticated;
grant execute on function public.reconcile_user_petal_balance(uuid) to service_role;

revoke all on function public.ensure_legacy_petal_lot(uuid) from public;
revoke all on function public.ensure_legacy_petal_lot(uuid) from anon;
revoke all on function public.ensure_legacy_petal_lot(uuid) from authenticated;
grant execute on function public.ensure_legacy_petal_lot(uuid) to service_role;
