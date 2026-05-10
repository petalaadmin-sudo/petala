-- supabase/migrations/002_pix_indexes.sql
-- Execute após o schema principal

-- Índice para busca rápida por gateway_id (webhook usa muito)
create index if not exists idx_transactions_gateway_id
  on public.transactions(gateway_id)
  where gateway_id is not null;

-- Índice para polling de status
create index if not exists idx_transactions_user_status
  on public.transactions(user_id, status, created_at desc);

-- View para saldo do usuário (útil para o frontend)
create or replace view public.user_balance as
  select
    id,
    balance_petals,
    vip_until,
    vip_until > now() as is_vip
  from public.users;

-- RLS na view
create policy "balance_select_own" on public.users
  for select using (auth.uid() = id);

-- Função para consultar pacotes disponíveis (chamada pública)
create or replace function public.get_petal_packages()
returns table (
  id uuid,
  name text,
  petals integer,
  bonus_petals integer,
  total_petals integer,
  price_brl numeric
) language sql security definer as $$
  select
    id,
    name,
    petals,
    bonus_petals,
    petals + bonus_petals as total_petals,
    price_brl
  from public.petal_packages
  where active = true
  order by sort_order;
$$;
